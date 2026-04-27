package proxy

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

const (
	// BaseURLHeader 是浏览器传给代理的目标服务前缀。该 header 只用于代理内部拼接，不会转发给上游。
	BaseURLHeader = "X-Image-Base-Url"

	generationSuffix = "/images/generations"
	editSuffix       = "/images/edits"
)

var hopByHopHeaders = map[string]struct{}{
	"Connection":          {},
	"Keep-Alive":          {},
	"Proxy-Authenticate":  {},
	"Proxy-Authorization": {},
	"Te":                  {},
	"Trailer":             {},
	"Transfer-Encoding":   {},
	"Upgrade":             {},
}

// ImageProxy 只代理 OpenAI Images 的两个固定端点。
// 它不保存请求体或响应体，调用方应为每次请求提供 BaseURLHeader。
type ImageProxy struct {
	Client *http.Client
	Logger *slog.Logger
}

// ServeGeneration 将请求转发到用户配置 Base URL 后的 /images/generations。
func (p *ImageProxy) ServeGeneration(w http.ResponseWriter, r *http.Request) {
	p.serveFixedEndpoint(w, r, generationSuffix, "images.generations")
}

// ServeEdit 将请求转发到用户配置 Base URL 后的 /images/edits。
func (p *ImageProxy) ServeEdit(w http.ResponseWriter, r *http.Request) {
	p.serveFixedEndpoint(w, r, editSuffix, "images.edits")
}

func (p *ImageProxy) serveFixedEndpoint(w http.ResponseWriter, r *http.Request, suffix string, endpoint string) {
	start := time.Now()
	status := http.StatusOK
	bytesWritten := int64(0)
	errKind := ""
	baseURLForLog := ""

	defer func() {
		p.logRequest(r, endpoint, status, bytesWritten, errKind, baseURLForLog, time.Since(start))
	}()

	if r.Method != http.MethodPost {
		status = http.StatusMethodNotAllowed
		errKind = "method_not_allowed"
		http.Error(w, "method not allowed", status)
		return
	}
	if r.URL.RawQuery != "" {
		status = http.StatusBadRequest
		errKind = "proxy_query_not_allowed"
		http.Error(w, "proxy endpoint query string is not allowed", status)
		return
	}

	target, err := buildTargetURL(r.Header.Get(BaseURLHeader), suffix)
	if err != nil {
		status = http.StatusBadRequest
		errKind = "invalid_base_url"
		http.Error(w, err.Error(), status)
		return
	}
	baseURLForLog = target.Host

	upstreamReq, err := http.NewRequestWithContext(r.Context(), r.Method, target.String(), r.Body)
	if err != nil {
		status = http.StatusInternalServerError
		errKind = "request_build_failed"
		http.Error(w, "failed to build upstream request", status)
		return
	}
	copyProxyHeaders(upstreamReq.Header, r.Header)

	client := p.Client
	if client == nil {
		client = http.DefaultClient
	}
	upstreamResp, err := client.Do(upstreamReq)
	if err != nil {
		status = http.StatusBadGateway
		errKind = "upstream_request_failed"
		http.Error(w, "upstream request failed", status)
		return
	}
	defer upstreamResp.Body.Close()

	status = upstreamResp.StatusCode
	copyResponseHeaders(w.Header(), upstreamResp.Header)
	w.WriteHeader(upstreamResp.StatusCode)

	counting := &countingWriter{ResponseWriter: w}
	bytesWritten, err = io.Copy(counting, upstreamResp.Body)
	if err != nil {
		errKind = "response_copy_failed"
		return
	}
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}

func buildTargetURL(rawBaseURL string, suffix string) (*url.URL, error) {
	if strings.TrimSpace(rawBaseURL) == "" {
		return nil, errors.New("missing base url")
	}

	parsed, err := url.Parse(rawBaseURL)
	if err != nil {
		return nil, errors.New("invalid base url")
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, errors.New("base url must use http or https")
	}
	if parsed.Host == "" {
		return nil, errors.New("base url host is required")
	}
	if parsed.RawQuery != "" || parsed.Fragment != "" {
		return nil, errors.New("base url must not include query or fragment")
	}

	joined := path.Join(parsed.Path, suffix)
	if strings.HasSuffix(suffix, "/") && !strings.HasSuffix(joined, "/") {
		joined += "/"
	}
	parsed.Path = joined
	return parsed, nil
}

func copyProxyHeaders(dst http.Header, src http.Header) {
	for name, values := range src {
		canonical := http.CanonicalHeaderKey(name)
		if canonical == BaseURLHeader {
			continue
		}
		if _, blocked := hopByHopHeaders[canonical]; blocked {
			continue
		}
		for _, value := range values {
			dst.Add(canonical, value)
		}
	}
}

func copyResponseHeaders(dst http.Header, src http.Header) {
	for name, values := range src {
		canonical := http.CanonicalHeaderKey(name)
		if _, blocked := hopByHopHeaders[canonical]; blocked {
			continue
		}
		for _, value := range values {
			dst.Add(canonical, value)
		}
	}
}

func (p *ImageProxy) logRequest(r *http.Request, endpoint string, status int, bytesWritten int64, errKind string, host string, duration time.Duration) {
	logger := p.Logger
	if logger == nil {
		return
	}
	logger.Info("proxy request",
		"method", r.Method,
		"endpoint", endpoint,
		"status", status,
		"duration_ms", duration.Milliseconds(),
		"bytes", bytesWritten,
		"error_kind", errKind,
		"base_url_host_hash", hashHost(host),
	)
}

func hashHost(host string) string {
	if host == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(host))
	return hex.EncodeToString(sum[:])[:12]
}

type countingWriter struct {
	http.ResponseWriter
}

func (w *countingWriter) Write(data []byte) (int, error) {
	n, err := w.ResponseWriter.Write(data)
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
	return n, err
}

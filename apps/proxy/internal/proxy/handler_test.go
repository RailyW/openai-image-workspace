package proxy

import (
	"bufio"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestProxy(upstream http.HandlerFunc) (*ImageProxy, *httptest.Server) {
	server := httptest.NewServer(upstream)
	return &ImageProxy{
		Client: server.Client(),
		Logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}, server
}

func TestGenerationRequiresBaseURL(t *testing.T) {
	proxy, upstream := newTestProxy(func(http.ResponseWriter, *http.Request) {})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/generations", strings.NewReader(`{"prompt":"x"}`))
	rec := httptest.NewRecorder()

	proxy.ServeGeneration(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestRejectsUnsafeBaseURL(t *testing.T) {
	cases := []string{
		"ftp://example.test/v1",
		"http:///v1",
		"http://example.test/v1?x=1",
		"http://example.test/v1#fragment",
	}

	for _, baseURL := range cases {
		t.Run(baseURL, func(t *testing.T) {
			proxy, upstream := newTestProxy(func(http.ResponseWriter, *http.Request) {})
			defer upstream.Close()

			req := httptest.NewRequest(http.MethodPost, "/api/images/generations", strings.NewReader(`{"prompt":"x"}`))
			req.Header.Set(BaseURLHeader, baseURL)
			rec := httptest.NewRecorder()

			proxy.ServeGeneration(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 for %q, got %d", baseURL, rec.Code)
			}
		})
	}
}

func TestRejectsProxyQueryString(t *testing.T) {
	proxy, upstream := newTestProxy(func(http.ResponseWriter, *http.Request) {})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/generations?target=/other", strings.NewReader(`{"prompt":"x"}`))
	req.Header.Set(BaseURLHeader, upstream.URL+"/v1")
	rec := httptest.NewRecorder()

	proxy.ServeGeneration(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestGenerationForwardsToFixedEndpoint(t *testing.T) {
	var gotPath string
	proxy, upstream := newTestProxy(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[]}`))
	})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/generations", strings.NewReader(`{"prompt":"x"}`))
	req.Header.Set(BaseURLHeader, upstream.URL+"/v1/")
	rec := httptest.NewRecorder()

	proxy.ServeGeneration(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}
	if gotPath != "/v1/images/generations" {
		t.Fatalf("expected fixed generation path, got %q", gotPath)
	}
}

func TestEditForwardsToFixedEndpoint(t *testing.T) {
	var gotPath string
	proxy, upstream := newTestProxy(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[]}`))
	})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/edits", strings.NewReader(`{"prompt":"x","images":[]}`))
	req.Header.Set(BaseURLHeader, upstream.URL+"/v1")
	rec := httptest.NewRecorder()

	proxy.ServeEdit(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rec.Code, rec.Body.String())
	}
	if gotPath != "/v1/images/edits" {
		t.Fatalf("expected fixed edit path, got %q", gotPath)
	}
}

func TestHeadersAreForwardedAndFiltered(t *testing.T) {
	var gotAuth string
	var gotContentType string
	var gotBaseURLHeader string
	var gotConnection string

	proxy, upstream := newTestProxy(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotContentType = r.Header.Get("Content-Type")
		gotBaseURLHeader = r.Header.Get(BaseURLHeader)
		gotConnection = r.Header.Get("Connection")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[]}`))
	})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/generations", strings.NewReader(`{"prompt":"x"}`))
	req.Header.Set(BaseURLHeader, upstream.URL+"/v1")
	req.Header.Set("Authorization", "Bearer local-token")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Connection", "keep-alive")
	rec := httptest.NewRecorder()

	proxy.ServeGeneration(rec, req)

	if gotAuth != "Bearer local-token" {
		t.Fatalf("expected authorization to forward, got %q", gotAuth)
	}
	if gotContentType != "application/json" {
		t.Fatalf("expected content-type to forward, got %q", gotContentType)
	}
	if gotBaseURLHeader != "" {
		t.Fatalf("expected base url header filtered, got %q", gotBaseURLHeader)
	}
	if gotConnection != "" {
		t.Fatalf("expected hop-by-hop connection header filtered, got %q", gotConnection)
	}
}

func TestStreamsServerSentEvents(t *testing.T) {
	proxy, upstream := newTestProxy(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("test server response writer should flush")
		}
		_, _ = w.Write([]byte("event: image_generation.completed\n"))
		_, _ = w.Write([]byte("data: {\"type\":\"image_generation.completed\",\"b64_json\":\"abc\"}\n\n"))
		flusher.Flush()
	})
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/images/generations", strings.NewReader(`{"prompt":"x","stream":true}`))
	req.Header.Set(BaseURLHeader, upstream.URL+"/v1")
	rec := httptest.NewRecorder()

	proxy.ServeGeneration(rec, req)

	reader := bufio.NewReader(strings.NewReader(rec.Body.String()))
	line, err := reader.ReadString('\n')
	if err != nil {
		t.Fatalf("expected stream line, got error %v", err)
	}
	if line != "event: image_generation.completed\n" {
		t.Fatalf("unexpected first stream line %q", line)
	}
}

package server

import (
	"net/http"
	"os"
	"path/filepath"

	"gpt-image-v2-workspace/apps/proxy/internal/proxy"
)

// NewRouter 组装健康检查、固定代理端点和前端静态资源路由。
func NewRouter(imageProxy *proxy.ImageProxy, distDir string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/api/images/generations", imageProxy.ServeGeneration)
	mux.HandleFunc("/api/images/edits", imageProxy.ServeEdit)
	mux.Handle("/", staticHandler(distDir))
	return mux
}

func staticHandler(distDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(distDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.NotFound(w, r)
			return
		}

		cleanPath := filepath.Clean(r.URL.Path)
		if cleanPath == "." || cleanPath == string(filepath.Separator) {
			cleanPath = "index.html"
		}
		fullPath := filepath.Join(distDir, filepath.FromSlash(cleanPath))
		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		indexPath := filepath.Join(distDir, "index.html")
		http.ServeFile(w, r, indexPath)
	})
}

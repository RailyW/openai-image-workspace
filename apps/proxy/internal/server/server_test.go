package server

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"gpt-image-v2-workspace/apps/proxy/internal/proxy"
)

func TestServesStaticIndexAndFallback(t *testing.T) {
	distDir := t.TempDir()
	index := []byte("<html><body>app shell</body></html>")
	if err := os.WriteFile(filepath.Join(distDir, "index.html"), index, 0o600); err != nil {
		t.Fatal(err)
	}

	router := NewRouter(&proxy.ImageProxy{Logger: slog.New(slog.NewTextHandler(io.Discard, nil))}, distDir)

	for _, path := range []string{"/", "/settings"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", rec.Code)
			}
			if !strings.Contains(rec.Body.String(), "app shell") {
				t.Fatalf("expected index body, got %q", rec.Body.String())
			}
		})
	}
}

func TestHealthz(t *testing.T) {
	router := NewRouter(&proxy.ImageProxy{Logger: slog.New(slog.NewTextHandler(io.Discard, nil))}, t.TempDir())
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

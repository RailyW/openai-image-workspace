package main

import (
	"net/http"

	"gpt-image-v2-workspace/apps/proxy/internal/config"
	"gpt-image-v2-workspace/apps/proxy/internal/logging"
	"gpt-image-v2-workspace/apps/proxy/internal/proxy"
	"gpt-image-v2-workspace/apps/proxy/internal/server"
)

// main 是 Go 代理服务入口，负责装配配置、日志、代理和静态资源路由。
func main() {
	cfg := config.Load()
	logger := logging.NewLogger(cfg.LogLevel)
	imageProxy := &proxy.ImageProxy{
		Client: &http.Client{Timeout: cfg.ProxyTimeout},
		Logger: logger,
	}

	httpServer := &http.Server{
		Addr:         cfg.ListenAddr,
		Handler:      server.NewRouter(imageProxy, cfg.DistDir),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	logger.Info("image tool proxy starting", "addr", cfg.ListenAddr, "dist_dir", cfg.DistDir)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("image tool proxy stopped unexpectedly", "error", err.Error())
	}
}

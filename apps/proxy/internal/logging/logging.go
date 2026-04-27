package logging

import (
	"log/slog"
	"os"
)

// NewLogger 创建结构化日志器。调用方必须保证不传入请求体、响应体、Prompt、图片或 token。
func NewLogger(level string) *slog.Logger {
	var slogLevel slog.Level
	switch level {
	case "debug":
		slogLevel = slog.LevelDebug
	case "warn":
		slogLevel = slog.LevelWarn
	case "error":
		slogLevel = slog.LevelError
	default:
		slogLevel = slog.LevelInfo
	}

	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slogLevel}))
}

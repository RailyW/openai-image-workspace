package config

import (
	"os"
	"time"
)

// Config 描述 Go 服务的运行时配置。配置只影响服务运行，不保存任何用户业务数据。
type Config struct {
	ListenAddr   string
	DistDir      string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
	ProxyTimeout time.Duration
	LogLevel     string
}

// Load 从环境变量读取配置，并为内网部署提供保守默认值。
func Load() Config {
	return Config{
		ListenAddr:   getEnv("APP_LISTEN_ADDR", ":8000"),
		DistDir:      getEnv("APP_DIST_DIR", "./dist"),
		ReadTimeout:  getDuration("APP_READ_TIMEOUT", 30*time.Second),
		WriteTimeout: getDuration("APP_WRITE_TIMEOUT", 600*time.Second),
		IdleTimeout:  getDuration("APP_IDLE_TIMEOUT", 120*time.Second),
		ProxyTimeout: getDuration("APP_PROXY_TIMEOUT", 600*time.Second),
		LogLevel:     getEnv("APP_LOG_LEVEL", "info"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getDuration(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

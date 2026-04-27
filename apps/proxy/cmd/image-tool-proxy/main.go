package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

// main 是 Go 代理服务的临时入口。后续任务会将配置、日志、静态资源和代理路由拆入 internal 模块。
func main() {
	addr := os.Getenv("APP_LISTEN_ADDR")
	if addr == "" {
		addr = ":8000"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprint(w, "ok")
	})

	log.Printf("image tool proxy listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

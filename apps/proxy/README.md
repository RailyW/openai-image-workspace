# Go 代理模块

`apps/proxy` 是极薄的 Go HTTP 服务。

## 职责

- 托管前端构建产物 `dist/`。
- 提供健康检查 `/healthz`。
- 转发 `POST /api/images/generations`。
- 转发 `POST /api/images/edits`。

## 隐私边界

代理不保存请求体、响应体、Prompt、图片、Bearer Token 或服务配置。日志只记录脱敏后的请求元数据。

## 配置

可通过环境变量配置：

- `APP_LISTEN_ADDR`：监听地址，默认 `:8000`。
- `APP_DIST_DIR`：前端构建目录，默认 `./dist`。
- `APP_READ_TIMEOUT`：读取超时，默认 `30s`。
- `APP_WRITE_TIMEOUT`：写入超时，默认 `600s`。
- `APP_IDLE_TIMEOUT`：空闲连接超时，默认 `120s`。
- `APP_PROXY_TIMEOUT`：上游代理超时，默认 `600s`。
- `APP_LOG_LEVEL`：日志级别，默认 `info`。

## 开发

```powershell
go test ./...
go run .\cmd\image-tool-proxy
```

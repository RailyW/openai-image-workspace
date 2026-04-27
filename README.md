# OpenAI Images 内网网页工具

这是一个用于访问 OpenAI Images API 兼容服务的内网网页工具。前端负责完整的用户体验和本地数据管理，Go 后端只负责托管前端静态资源以及转发两个固定端点：

- `POST /api/images/generations`
- `POST /api/images/edits`

用户只需要在浏览器中配置服务的 Base URL，例如 `http://192.168.1.50:8000/v1`。应用会自动拼接 `/images/generations` 或 `/images/edits`，不会开放任意 URL 代理。

## 隐私边界

用户数据只保存在当前浏览器的 IndexedDB 中，包括：

- 服务配置和 Bearer Token。
- Prompt 和参数预设。
- 生成、编辑历史。
- 图片结果。
- 本地偏好设置。

Go 服务端不保存 Prompt、图片、历史、服务配置或密钥。请求转发过程中，Go 代理会临时经过请求和响应内容，但不会落盘保存业务数据。

## 模块

- `apps/web`：React、Vite、TypeScript、shadcn/ui 风格组件、IndexedDB 和业务页面。
- `apps/proxy`：Go HTTP 服务，负责静态资源托管和固定端点代理。

## 开发

前端开发：

```powershell
cd apps\web
npm install
npm run dev
```

后端开发：

```powershell
cd apps\proxy
go run .\cmd\image-tool-proxy
```

开发期前端通过 Vite dev server 将 `/api` 转发到 Go 服务。

## 构建

```powershell
cd apps\web
npm run build
cd ..\proxy
$env:APP_DIST_DIR='..\web\dist'
go run .\cmd\image-tool-proxy
```

生产部署时建议使用 Go 服务托管外置 `dist/` 目录。如果需要 HTTPS，请在 Go 服务前放置 Caddy、Nginx 或公司网关做 TLS 终止。

## 非目标

本项目不做用户系统、不做服务端数据库、不做服务端历史、不做 `/models`、不做 `/images/variations`、不做任意 URL 代理、不做服务端并发限制。

# 服务路由模块

本模块负责组合 HTTP 路由。

## 路由

- `GET /healthz`：健康检查。
- `POST /api/images/generations`：图片生成代理。
- `POST /api/images/edits`：图片编辑代理。
- `GET /*`：前端静态资源和 SPA fallback。

## 边界

本模块不处理用户业务数据，只负责路由分发和静态文件托管。

# API 模块

本模块负责构造 OpenAI Images API 兼容请求，并调用 Go 代理。

## 端点

- `/api/images/generations`
- `/api/images/edits`

## 规则

- 用户填写的 Base URL 通过 `X-Image-Base-Url` 传给 Go 代理。
- Bearer Token 从本地服务配置读取，并通过 `Authorization` 发送。
- 高级 JSON 只能补充字段，表单可见字段优先。
- 本模块不保存任何响应数据，持久化由调用方决定。

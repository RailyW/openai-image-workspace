# 代理模块

本模块实现固定 OpenAI Images 端点代理。

## 职责

- 接收 `/api/images/generations` 与 `/api/images/edits`。
- 从 `X-Image-Base-Url` 读取用户本次请求选择的服务前缀。
- 只拼接 `/images/generations` 或 `/images/edits`。
- 透明转发 JSON、multipart 和 SSE。
- 过滤内部控制 header 和 hop-by-hop header。

## 隐私边界

本模块不保存请求体、响应体、Prompt、图片或 Bearer Token。日志只能记录脱敏元数据。

# 图片保存模块

本模块负责将 OpenAI Images API 返回的图片保存到 IndexedDB。

## 规则

- `b64_json` 会解码为 Blob 保存。
- `url` 会先由浏览器直接下载，成功后保存 Blob。
- URL 下载失败时只保存远程引用和错误摘要。
- 不通过 Go 代理下载任意图片 URL。

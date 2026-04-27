# 日志模块

本模块创建 Go 服务使用的结构化日志器。

## 隐私要求

日志不得包含：

- Prompt。
- 请求体。
- 响应体。
- 图片内容。
- Bearer Token。
- Authorization。
- 完整 Base URL。

业务模块只能记录脱敏后的运行元数据。

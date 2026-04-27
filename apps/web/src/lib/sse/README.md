# SSE 模块

本模块解析 OpenAI Images API 的官方 `text/event-stream` 响应。

## 支持事件

- `image_generation.partial_image`
- `image_generation.completed`
- `image_edit.partial_image`
- `image_edit.completed`

## 边界

解析器只识别官方事件，不猜测非官方字段。解析失败会返回结构化错误事件，由调用方决定如何保存失败任务。

# 生成图片功能

本功能调用 `/api/images/generations`，支持普通 JSON 响应和 SSE 流式响应。

## 数据边界

成功和失败任务都写入 IndexedDB。任务历史只保存服务非敏感快照，不保存 Bearer Token。

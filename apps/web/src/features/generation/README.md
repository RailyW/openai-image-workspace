# 生成图片功能

本功能调用 `/api/images/generations`，支持普通 JSON 响应和 SSE 流式响应。

## 界面

页面使用 shadcn 风格的 `Card`、`Input`、`Textarea`、`Select` 和 `Checkbox` 组合控件。服务选择和流式预览开关不使用浏览器原生 select/checkbox，以保持跨浏览器一致的黑白极简界面。

## 数据边界

成功和失败任务都写入 IndexedDB。任务历史只保存服务非敏感快照，不保存 Bearer Token。

## 文件说明

- `GenerationPage.tsx`：管理生成表单、本次会话任务、流式预览和取消入口。
- `generationRunner.ts`：构造请求、调用代理、解析 JSON/SSE 响应，并把任务和图片写入 IndexedDB。
- `generationRunner.test.ts`：覆盖生成请求和图片保存相关行为。

# 编辑图片功能

本功能调用 `/api/images/edits`，支持 multipart 上传和 JSON 引用两种官方请求体。

## 界面

页面使用 shadcn 风格的 `Card`、`Input`、`Textarea`、`Select` 和 `Checkbox` 组合控件。来源模式、服务选择和流式预览开关都通过统一组件渲染，避免裸原生表单控件造成视觉割裂。

## 数据边界

上传文件只在浏览器请求过程中使用。任务历史保存文件名快照，不保存 Bearer Token。

## 文件说明

- `EditingPage.tsx`：管理编辑表单、上传/JSON 来源模式、本次会话任务、流式预览和取消入口。
- `editingRunner.ts`：按来源模式构造请求、调用代理、解析 JSON/SSE 响应，并保存任务和图片。
- `editingRunner.test.ts`：覆盖编辑请求、multipart 高级参数和图片 MIME 推断等行为。

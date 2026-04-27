# 编辑图片功能

本功能调用 `/api/images/edits`，支持 multipart 上传和 JSON 引用两种官方请求体。

## 数据边界

上传文件只在浏览器请求过程中使用。任务历史保存文件名快照，不保存 Bearer Token。

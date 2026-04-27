# 本地数据库模块

本模块使用 Dexie.js 封装 IndexedDB。

## 表

- `providers`：服务配置和可选 Bearer Token。
- `settings`：当前浏览器的应用设置。
- `presets`：生成和编辑参数预设。
- `promptSnippets`：常用 Prompt 片段。
- `tasks`：生成和编辑任务历史。
- `images`：图片 Blob 或远程 URL 引用。

## 隐私边界

所有数据只保存在当前浏览器。Go 后端没有任何数据库，也不会保存这些记录。

# 前端模块

`apps/web` 是浏览器端应用，负责所有用户可见功能和用户数据管理。

## 职责

- 提供生成、编辑、历史、预设、设置页面。
- 使用 IndexedDB 保存用户的服务配置、Bearer Token、Prompt、历史和图片。
- 调用 Go 代理的固定端点。
- 解析 OpenAI Images API 的普通 JSON 响应和 SSE 流式响应。
- 导出本地数据。
- 清理本地数据。

## 数据边界

前端是用户数据的唯一持久化位置。服务端不会保存这些数据。清除浏览器站点数据会删除本工具内的所有本地记录。

## 命令

```powershell
npm install
npm run dev
npm run test
npm run build
```

## 文件结构

- `src/app`：应用壳和页面导航。
- `src/components/ui`：shadcn/ui 风格基础组件。
- `src/lib`：数据库、API、SSE、图片保存、导出等通用能力。
- `src/features`：生成、编辑、历史、预设、设置等业务功能。

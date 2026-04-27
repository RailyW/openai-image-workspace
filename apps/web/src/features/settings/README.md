# 设置功能

设置功能管理浏览器本地的服务配置、Bearer Token、本地存储、导出和清理。

## 界面

页面使用 shadcn 风格表单控件管理服务名称、Base URL、鉴权方式和默认模型。鉴权方式使用 Radix Select，已保存服务和本地数据操作使用统一按钮、图标和状态标记。

## 数据边界

服务配置只写入 IndexedDB。Go 后端不保存这些配置。任务历史不会复制 Bearer Token。

## 文件说明

- `SettingsPage.tsx`：管理服务配置表单、当前服务切换、本地数据导出和全量清理。
- `providerStore.ts`：封装服务配置和应用设置的 IndexedDB 读写。

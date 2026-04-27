# 设置功能

设置功能管理浏览器本地的服务配置、Bearer Token、本地存储、导出和清理。

## 数据边界

服务配置只写入 IndexedDB。Go 后端不保存这些配置。任务历史不会复制 Bearer Token。

# 预设功能

预设功能保存参数模板和 Prompt 片段，全部数据存放在 IndexedDB。

第一版提供本地新增和删除能力，不与服务端同步。

## 界面

页面使用 shadcn 风格的表单、Select、卡片和按钮。预设类型不再使用浏览器原生下拉，而是使用统一的 Radix Select 组合控件。

## 文件说明

- `PresetsPage.tsx`：管理参数预设、Prompt 片段的录入、展示和删除。
- `presetStore.ts`：封装预设和 Prompt 片段的 IndexedDB 写入逻辑。

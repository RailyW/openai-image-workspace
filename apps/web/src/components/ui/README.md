# UI 基础组件

本目录存放 shadcn/ui 风格的轻量基础组件。交互型控件优先使用 Radix Primitive 承载可访问性和键盘行为，视觉层保持黑白极简、低彩度、细边框的应用风格。

## 组件

- `Button`
- `Badge`
- `Checkbox`
- `Input`
- `Textarea`
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`
- `Card`
- `Label`

组件只负责外观和基础 HTML 契约，不持有业务状态。

## 文件说明

- `button.tsx`：统一按钮尺寸、语义变体、焦点状态和图标间距。
- `badge.tsx`：用于当前状态、当前服务等短文本标记。
- `checkbox.tsx`：基于 `@radix-ui/react-checkbox` 的按钮式复选框，避免裸原生 checkbox 造成样式割裂。
- `select.tsx`：基于 `@radix-ui/react-select` 的组合式下拉控件，避免使用浏览器原生 select。
- `input.tsx`：统一文本、数字、密码和文件输入的边框、焦点和禁用状态。
- `textarea.tsx`：统一 Prompt、JSON 等长文本输入控件。
- `card.tsx`：统一页面工作区块的边框、圆角和留白。
- `label.tsx`：统一表单标签文本并保留 `htmlFor` 可访问性契约。

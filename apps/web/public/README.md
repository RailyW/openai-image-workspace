# 静态资源

本目录存放 Vite 构建时直接复制到站点根路径的静态文件。

## 文件说明

- `openai-icon.svg`：从 `https://chatgpt.com/cdn/assets/favicon-l4nq08hd.svg` 保存到本地的 OpenAI 标志，用于应用左上角品牌区域。页面通过 `/openai-icon.svg` 引用它，运行时不再请求远程 CDN。

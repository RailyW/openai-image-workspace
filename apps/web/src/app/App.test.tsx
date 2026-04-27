import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("应用壳冒烟测试", () => {
  afterEach(() => {
    cleanup();
  });

  it("渲染导航并可切换主要页面", async () => {
    render(<App />);
    const user = userEvent.setup();

    expect(screen.getByText("OpenAI Images 工具")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(await screen.findByText("服务配置")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "编辑" }));
    expect(await screen.findByText("编辑图片")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "历史" }));
    expect(await screen.findByText("历史记录")).toBeInTheDocument();
  });

  it("主要表单使用统一的 shadcn 风格控件而不是浏览器原生下拉", () => {
    const { container } = render(<App />);

    // Select 应由 Radix/shadcn 组合控件承载，避免不同浏览器的原生 select 样式割裂。
    expect(container.querySelector("select")).not.toBeInTheDocument();
    // Checkbox 应呈现为按钮式控件，便于统一焦点、边框和科技感视觉。
    expect(screen.getByRole("checkbox", { name: "启用流式预览" }).tagName).toBe("BUTTON");
  });

  it("应用壳不再展示每页顶部 header 和本地优先标记，并使用 OpenAI 标志", () => {
    render(<App />);

    expect(screen.queryByRole("heading", { name: "生成" })).not.toBeInTheDocument();
    expect(screen.queryByText("仅代理固定 Images 端点")).not.toBeInTheDocument();
    expect(screen.queryByText("本地优先")).not.toBeInTheDocument();
    expect(screen.getByLabelText("OpenAI 标志")).toBeInTheDocument();
  });
});

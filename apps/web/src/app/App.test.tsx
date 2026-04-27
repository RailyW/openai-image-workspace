import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("应用壳冒烟测试", () => {
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
});

import { describe, expect, it } from "vitest";
import {
  buildEditJsonRequest,
  buildEditMultipartRequest,
  buildGenerationRequest,
  mergeAdvancedJson,
} from "./requestBuilders";

describe("请求构造", () => {
  it("高级 JSON 只能补充字段，表单字段优先", () => {
    const merged = mergeAdvancedJson(
      { prompt: "表单 prompt", size: "1024x1024" },
      `{"size":"512x512","quality":"high"}`,
    );

    expect(merged).toEqual({
      prompt: "表单 prompt",
      size: "1024x1024",
      quality: "high",
    });
  });

  it("非法高级 JSON 会抛出中文错误", () => {
    expect(() => mergeAdvancedJson({ prompt: "x" }, "{bad")).toThrow("高级 JSON");
  });

  it("生成请求会构造 OpenAI 官方 JSON 形态", () => {
    const request = buildGenerationRequest({
      model: "gpt-image-1.5",
      prompt: "一张图",
      n: 1,
      size: "1024x1024",
      stream: true,
      advancedJson: `{"output_format":"png"}`,
    });

    expect(request).toMatchObject({
      model: "gpt-image-1.5",
      prompt: "一张图",
      n: 1,
      size: "1024x1024",
      stream: true,
      output_format: "png",
    });
  });

  it("编辑 JSON 模式要求每个图片引用只能有一种来源", () => {
    expect(() =>
      buildEditJsonRequest({
        model: "gpt-image-1.5",
        prompt: "改图",
        images: [{ image_url: "https://example.test/a.png", file_id: "file-1" }],
      }),
    ).toThrow("只能提供一种图片来源");
  });

  it("编辑 multipart 模式会写入多张 image[] 和 mask", () => {
    const file = new File(["image"], "a.png", { type: "image/png" });
    const mask = new File(["mask"], "mask.png", { type: "image/png" });
    const form = buildEditMultipartRequest({
      model: "gpt-image-1.5",
      prompt: "改图",
      images: [file, file],
      mask,
      stream: false,
      advancedJson: `{"quality":"high"}`,
    });

    expect(form.getAll("image[]")).toHaveLength(2);
    expect(form.get("mask")).toBe(mask);
    expect(form.get("prompt")).toBe("改图");
    expect(form.get("quality")).toBe("high");
  });
});

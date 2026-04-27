import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, type ProviderConfig } from "@/lib/db/schema";
import { runEditing } from "./editingRunner";

describe("编辑任务运行器", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("openai-images-tool");
    vi.restoreAllMocks();
  });

  it("multipart 高级 JSON 指定 output_format=webp 时保存 image/webp", async () => {
    const provider: ProviderConfig = {
      id: "provider-1",
      name: "测试服务",
      baseUrl: "http://127.0.0.1:8000/v1",
      authType: "none",
      createdAt: 1,
      updatedAt: 1,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            data: [{ b64_json: btoa("webp") }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const task = await runEditing({
      mode: "multipart",
      provider,
      values: {
        model: "gpt-image-1.5",
        prompt: "编辑",
        images: [new File(["image"], "source.png", { type: "image/png" })],
        advancedJson: `{"output_format":"webp"}`,
      },
    });

    const image = await db.images.get(task.imageIds[0]);
    expect(task.status).toBe("succeeded");
    expect(image?.mimeType).toBe("image/webp");
  });
});

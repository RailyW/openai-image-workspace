import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "@/lib/db/schema";
import { saveBase64Image, saveImageUrl } from "./store";

describe("图片本地保存", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("openai-images-tool-image-test");
    vi.restoreAllMocks();
  });

  it("将 b64_json 转为 Blob 并写入 IndexedDB", async () => {
    const db = createDatabase("openai-images-tool-image-test");
    const image = await saveBase64Image(db, {
      id: "image-1",
      taskId: "task-1",
      b64Json: btoa("hello"),
      mimeType: "image/png",
      source: "b64_json",
    });

    expect(image.status).toBe("stored");
    expect(image.byteSize).toBe(5);
    await expect(db.images.get("image-1")).resolves.toMatchObject({ mimeType: "image/png" });
    db.close();
  });

  it("保存 b64_json 时尊重调用方传入的 MIME 类型", async () => {
    const db = createDatabase("openai-images-tool-image-test");
    const image = await saveBase64Image(db, {
      id: "image-jpeg",
      taskId: "task-1",
      b64Json: btoa("jpeg"),
      mimeType: "image/jpeg",
      source: "b64_json",
    });

    expect(image.mimeType).toBe("image/jpeg");
    expect(image.blob?.type).toBe("image/jpeg");
    db.close();
  });

  it("URL 图片下载成功时保存 Blob", async () => {
    const db = createDatabase("openai-images-tool-image-test");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Blob(["img"], { type: "image/webp" }), {
            status: 200,
            headers: { "Content-Type": "image/webp" },
          }),
      ),
    );

    const image = await saveImageUrl(db, {
      id: "image-2",
      taskId: "task-1",
      url: "https://example.test/a.webp",
    });

    expect(image.status).toBe("stored");
    expect(image.mimeType).toBe("image/webp");
    db.close();
  });

  it("URL 图片下载失败时保存远程引用", async () => {
    const db = createDatabase("openai-images-tool-image-test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 403 })));

    const image = await saveImageUrl(db, {
      id: "image-3",
      taskId: "task-1",
      url: "https://example.test/expired.png",
    });

    expect(image.status).toBe("remote-only");
    expect(image.remoteUrl).toBe("https://example.test/expired.png");
    expect(image.errorSummary).toContain("403");
    db.close();
  });
});

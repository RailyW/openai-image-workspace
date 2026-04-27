import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "./schema";

describe("本地 IndexedDB schema", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("openai-images-tool-test");
  });

  it("可以读写服务配置、设置、预设、Prompt 片段、任务和图片", async () => {
    const db = createDatabase("openai-images-tool-test");

    await db.providers.add({
      id: "provider-1",
      name: "内网服务",
      baseUrl: "http://127.0.0.1:8000/v1",
      authType: "bearer",
      bearerToken: "token",
      defaultModel: "gpt-image-1.5",
      createdAt: 1,
      updatedAt: 1,
    });
    await db.settings.put({
      id: "app",
      activeProviderId: "provider-1",
      saveImagesByDefault: true,
      locale: "zh-CN",
      recentModels: ["gpt-image-1.5"],
      createdAt: 1,
      updatedAt: 1,
    });
    await db.presets.add({
      id: "preset-1",
      name: "默认生成",
      kind: "generation",
      values: { prompt: "测试" },
      createdAt: 1,
      updatedAt: 1,
    });
    await db.promptSnippets.add({
      id: "snippet-1",
      title: "光照",
      content: "柔和光照",
      createdAt: 1,
      updatedAt: 1,
    });
    await db.tasks.add({
      id: "task-1",
      kind: "generation",
      status: "succeeded",
      providerId: "provider-1",
      providerSnapshot: {
        name: "内网服务",
        baseUrl: "http://127.0.0.1:8000/v1",
        authType: "bearer",
      },
      requestSnapshot: { prompt: "测试" },
      imageIds: ["image-1"],
      streamed: false,
      createdAt: 1,
      finishedAt: 2,
      durationMs: 1,
    });
    await db.images.add({
      id: "image-1",
      taskId: "task-1",
      source: "b64_json",
      status: "stored",
      blob: new Blob(["abc"], { type: "image/png" }),
      mimeType: "image/png",
      byteSize: 3,
      createdAt: 1,
    });

    await expect(db.providers.get("provider-1")).resolves.toMatchObject({ name: "内网服务" });
    await expect(db.settings.get("app")).resolves.toMatchObject({ activeProviderId: "provider-1" });
    await expect(db.presets.get("preset-1")).resolves.toMatchObject({ kind: "generation" });
    await expect(db.promptSnippets.get("snippet-1")).resolves.toMatchObject({ title: "光照" });
    await expect(db.tasks.get("task-1")).resolves.toMatchObject({ status: "succeeded" });
    await expect(db.images.get("image-1")).resolves.toMatchObject({ status: "stored" });

    db.close();
  });
});

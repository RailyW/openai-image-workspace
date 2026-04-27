import { beforeEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createDatabase } from "@/lib/db/schema";
import { exportLocalDataZip, exportWarningText } from "./exportZip";

describe("本地数据导出", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("openai-images-tool-export-test");
  });

  it("导出 zip 包含 manifest、数据表和图片文件", async () => {
    const db = createDatabase("openai-images-tool-export-test");
    await db.providers.add({
      id: "provider-1",
      name: "内网",
      baseUrl: "http://127.0.0.1:8000/v1",
      authType: "bearer",
      bearerToken: "token",
      createdAt: 1,
      updatedAt: 1,
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

    const blob = await exportLocalDataZip(db);
    const zip = await JSZip.loadAsync(blob);

    expect(zip.file("manifest.json")).toBeTruthy();
    expect(zip.file("providers.json")).toBeTruthy();
    expect(zip.file("settings.json")).toBeTruthy();
    expect(zip.file("presets.json")).toBeTruthy();
    expect(zip.file("prompt-snippets.json")).toBeTruthy();
    expect(zip.file("tasks.json")).toBeTruthy();
    expect(zip.file("images/image-1.png")).toBeTruthy();
    expect(exportWarningText).toContain("Bearer Token");
    db.close();
  });
});

import JSZip from "jszip";
import type { ImagesToolDatabase } from "@/lib/db/schema";

export const exportWarningText =
  "导出包可能包含 Bearer Token、Prompt 和图片结果，请只保存到可信位置。";

// exportLocalDataZip 将 IndexedDB 中的本地数据导出为 zip。它只读取浏览器本地数据，不访问服务端。
export async function exportLocalDataZip(db: ImagesToolDatabase) {
  const zip = new JSZip();
  const [providers, settings, presets, promptSnippets, tasks, images] = await Promise.all([
    db.providers.toArray(),
    db.settings.toArray(),
    db.presets.toArray(),
    db.promptSnippets.toArray(),
    db.tasks.toArray(),
    db.images.toArray(),
  ]);

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        warning: exportWarningText,
        counts: {
          providers: providers.length,
          settings: settings.length,
          presets: presets.length,
          promptSnippets: promptSnippets.length,
          tasks: tasks.length,
          images: images.length,
        },
      },
      null,
      2,
    ),
  );
  zip.file("providers.json", JSON.stringify(providers, null, 2));
  zip.file("settings.json", JSON.stringify(settings, null, 2));
  zip.file("presets.json", JSON.stringify(presets, null, 2));
  zip.file("prompt-snippets.json", JSON.stringify(promptSnippets, null, 2));
  zip.file("tasks.json", JSON.stringify(tasks, null, 2));

  const imageManifest = images.map(({ blob, ...image }) => ({
    ...image,
    fileName: image.status === "stored" && blob ? `images/${image.id}.${extensionFromMime(image.mimeType)}` : undefined,
  }));
  zip.file("images.json", JSON.stringify(imageManifest, null, 2));

  for (const image of images) {
    if (image.status !== "stored" || !image.blob) {
      continue;
    }
    const ext = extensionFromMime(image.mimeType);
    zip.file(`images/${image.id}.${ext}`, await blobToArrayBuffer(image.blob));
  }

  return zip.generateAsync({ type: "blob" });
}

export function exportFileName() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `gpt-image-v2-export-${stamp}.zip`;
}

function extensionFromMime(mimeType?: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
}

async function blobToArrayBuffer(blob: Blob) {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }
  if (typeof FileReader !== "undefined") {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
      reader.onerror = () => resolve(new ArrayBuffer(0));
      try {
        reader.readAsArrayBuffer(blob);
      } catch {
        resolve(new ArrayBuffer(0));
      }
    });
  }
  return new ArrayBuffer(0);
}

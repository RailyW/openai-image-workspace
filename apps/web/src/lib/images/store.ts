import type { ImageRecord, ImagesToolDatabase, ImageSource } from "@/lib/db/schema";

interface SaveBase64ImageInput {
  id: string;
  taskId: string;
  b64Json: string;
  mimeType?: string;
  source: ImageSource;
}

interface SaveImageUrlInput {
  id: string;
  taskId: string;
  url: string;
}

// saveBase64Image 将 OpenAI 响应中的 b64_json 解码为 Blob，并保存到 IndexedDB。
export async function saveBase64Image(db: ImagesToolDatabase, input: SaveBase64ImageInput) {
  const bytes = decodeBase64(input.b64Json);
  const mimeType = input.mimeType ?? "image/png";
  const blob = new Blob([bytes], { type: mimeType });
  const record: ImageRecord = {
    id: input.id,
    taskId: input.taskId,
    source: input.source,
    status: "stored",
    blob,
    mimeType,
    byteSize: blob.size,
    createdAt: Date.now(),
  };
  await db.images.put(record);
  return record;
}

// saveImageUrl 尝试由浏览器直接下载图片 URL；失败时只保存远程引用，不使用 Go 任意代理兜底。
export async function saveImageUrl(db: ImagesToolDatabase, input: SaveImageUrlInput) {
  try {
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`图片下载失败：HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const record: ImageRecord = {
      id: input.id,
      taskId: input.taskId,
      source: "url",
      status: "stored",
      blob,
      remoteUrl: input.url,
      mimeType: blob.type || undefined,
      byteSize: blob.size,
      createdAt: Date.now(),
    };
    await db.images.put(record);
    return record;
  } catch (error) {
    const record: ImageRecord = {
      id: input.id,
      taskId: input.taskId,
      source: "url",
      status: "remote-only",
      remoteUrl: input.url,
      errorSummary: error instanceof Error ? error.message : "图片下载失败",
      createdAt: Date.now(),
    };
    await db.images.put(record);
    return record;
  }
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

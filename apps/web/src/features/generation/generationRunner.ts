import { db, type ProviderConfig, type TaskRecord } from "@/lib/db/schema";
import { buildGenerationRequest } from "@/lib/api/requestBuilders";
import { requestGeneration } from "@/lib/api/client";
import type { GenerationFormValues, ImagesResponse } from "@/lib/api/types";
import { saveBase64Image, saveImageUrl } from "@/lib/images/store";
import { parseImageEventStream } from "@/lib/sse/parser";
import { createId } from "@/lib/utils";
import { rememberModel } from "@/features/settings/providerStore";

interface RunGenerationInput {
  provider: ProviderConfig;
  values: GenerationFormValues;
  signal?: AbortSignal;
  onPartial?: (b64Json: string) => void;
}

// runGeneration 执行一次图片生成任务，并将成功或失败结果写入 IndexedDB。
export async function runGeneration(input: RunGenerationInput): Promise<TaskRecord> {
  const startedAt = Date.now();
  const taskId = createId("task");
  const requestBody = buildGenerationRequest(input.values);
  const baseTask: TaskRecord = {
    id: taskId,
    kind: "generation",
    status: "running",
    providerId: input.provider.id,
    providerSnapshot: {
      name: input.provider.name,
      baseUrl: input.provider.baseUrl,
      authType: input.provider.authType,
    },
    requestSnapshot: requestBody,
    imageIds: [],
    streamed: Boolean(input.values.stream),
    createdAt: startedAt,
  };
  await db.tasks.put(baseTask);

  try {
    await rememberModel(String(requestBody.model ?? ""));
    const envelope = await requestGeneration(requestBody, { provider: input.provider, signal: input.signal });
    if (!envelope.response.ok) {
      throw new HttpTaskError(envelope.response.status, await envelope.response.text());
    }

    const imageIds: string[] = [];
    let responseMetadata: unknown;
    const mimeType = mimeTypeFromOutputFormat(requestBody.output_format);
    if (envelope.kind === "sse" && envelope.response.body) {
      let completed = false;
      for await (const event of parseImageEventStream(envelope.response.body)) {
        if (event.event === "parser.error") {
          throw new Error(event.error);
        }
        if (event.data.b64_json && event.event.endsWith("partial_image")) {
          input.onPartial?.(event.data.b64_json);
        }
        if (event.data.b64_json && event.event.endsWith("completed")) {
          completed = true;
          const imageId = createId("image");
          await saveBase64Image(db, {
            id: imageId,
            taskId,
            b64Json: event.data.b64_json,
            source: "sse",
            mimeType,
          });
          imageIds.push(imageId);
          responseMetadata = { usage: event.data.usage };
        }
      }
      if (!completed || imageIds.length === 0) {
        throw new Error("流式响应未收到 completed 事件或最终图片");
      }
    } else {
      const json = (await envelope.response.json()) as ImagesResponse;
      for (const item of strictImageData(json)) {
        const imageId = createId("image");
        if (item.b64_json) {
          await saveBase64Image(db, { id: imageId, taskId, b64Json: item.b64_json, source: "b64_json", mimeType });
        } else if (item.url) {
          await saveImageUrl(db, { id: imageId, taskId, url: item.url });
        }
        imageIds.push(imageId);
      }
      responseMetadata = { created: json.created, usage: json.usage };
    }

    const finished = finishTask(baseTask, "succeeded", startedAt, { imageIds, responseMetadata });
    await db.tasks.put(finished);
    return finished;
  } catch (error) {
    const failed = finishTask(baseTask, isAbort(error) ? "canceled" : "failed", startedAt, {
      errorSummary: summarizeError(error),
      httpStatus: error instanceof HttpTaskError ? error.status : undefined,
    });
    await db.tasks.put(failed);
    return failed;
  }
}

function mimeTypeFromOutputFormat(value: unknown) {
  const format = String(value ?? "png").toLowerCase();
  if (format === "jpeg" || format === "jpg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
}

function strictImageData(json: ImagesResponse) {
  if (!json || !Array.isArray(json.data)) {
    throw new Error("响应格式错误：缺少 data 数组");
  }
  for (const item of json.data) {
    if (!item.b64_json && !item.url) {
      throw new Error("响应格式错误：data 项缺少 b64_json 或 url");
    }
  }
  return json.data;
}

function finishTask(
  task: TaskRecord,
  status: TaskRecord["status"],
  startedAt: number,
  patch: Partial<TaskRecord>,
): TaskRecord {
  const finishedAt = Date.now();
  return {
    ...task,
    ...patch,
    status,
    finishedAt,
    durationMs: finishedAt - startedAt,
  };
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function summarizeError(error: unknown) {
  if (error instanceof HttpTaskError) {
    return `HTTP ${error.status}: ${error.body.slice(0, 300)}`;
  }
  return error instanceof Error ? error.message : "请求失败";
}

class HttpTaskError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`HTTP ${status}`);
  }
}

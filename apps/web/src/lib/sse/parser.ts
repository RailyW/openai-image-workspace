export type ImageSseEventName =
  | "image_generation.partial_image"
  | "image_generation.completed"
  | "image_edit.partial_image"
  | "image_edit.completed";

export interface ImageSsePayload {
  type: string;
  b64_json?: string;
  partial_image_index?: number;
  usage?: unknown;
}

export interface ImageSseEvent {
  event: ImageSseEventName;
  data: ImageSsePayload;
}

export interface ParserErrorEvent {
  event: "parser.error";
  error: string;
  raw: string;
}

export type ParsedImageSseEvent = ImageSseEvent | ParserErrorEvent;

const officialEvents = new Set<ImageSseEventName>([
  "image_generation.partial_image",
  "image_generation.completed",
  "image_edit.partial_image",
  "image_edit.completed",
]);

// parseImageEventStream 解析 OpenAI Images 官方 SSE 事件。非官方字段不会被猜测或转换。
export async function* parseImageEventStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ParsedImageSseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = findEventBoundary(buffer);
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + boundaryLength(buffer, separatorIndex));
      const parsed = parseEvent(rawEvent);
      if (parsed) {
        yield parsed;
      }
      separatorIndex = findEventBoundary(buffer);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const parsed = parseEvent(buffer);
    if (parsed) {
      yield parsed;
    }
  }
}

function parseEvent(rawEvent: string): ParsedImageSseEvent | undefined {
  let eventName = "";
  const dataLines: string[] = [];

  for (const line of rawEvent.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!officialEvents.has(eventName as ImageSseEventName)) {
    return undefined;
  }

  const rawData = dataLines.join("\n");
  try {
    return {
      event: eventName as ImageSseEventName,
      data: JSON.parse(rawData) as ImageSsePayload,
    };
  } catch (error) {
    return {
      event: "parser.error",
      error: `无法解析 SSE JSON：${error instanceof Error ? error.message : "未知错误"}`,
      raw: rawData,
    };
  }
}

function findEventBoundary(buffer: string) {
  const lf = buffer.indexOf("\n\n");
  const crlf = buffer.indexOf("\r\n\r\n");
  if (lf === -1) {
    return crlf;
  }
  if (crlf === -1) {
    return lf;
  }
  return Math.min(lf, crlf);
}

function boundaryLength(buffer: string, index: number) {
  return buffer.startsWith("\r\n\r\n", index) ? 4 : 2;
}

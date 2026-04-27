import { describe, expect, it } from "vitest";
import { parseImageEventStream } from "./parser";

function streamFromText(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe("OpenAI Images SSE 解析", () => {
  it("解析 generation partial 和 completed 事件", async () => {
    const stream = streamFromText(
      [
        "event: image_generation.partial_image",
        'data: {"type":"image_generation.partial_image","b64_json":"part","partial_image_index":0}',
        "",
        "event: image_generation.completed",
        'data: {"type":"image_generation.completed","b64_json":"done","usage":{"total_tokens":1}}',
        "",
      ].join("\n"),
    );

    const events = [];
    for await (const event of parseImageEventStream(stream)) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        event: "image_generation.partial_image",
        data: { type: "image_generation.partial_image", b64_json: "part", partial_image_index: 0 },
      },
      {
        event: "image_generation.completed",
        data: { type: "image_generation.completed", b64_json: "done", usage: { total_tokens: 1 } },
      },
    ]);
  });

  it("解析 edit partial 和 completed 事件", async () => {
    const stream = streamFromText(
      [
        "event: image_edit.partial_image",
        'data: {"type":"image_edit.partial_image","b64_json":"part","partial_image_index":0}',
        "",
        "event: image_edit.completed",
        'data: {"type":"image_edit.completed","b64_json":"done"}',
        "",
      ].join("\n"),
    );

    const events = [];
    for await (const event of parseImageEventStream(stream)) {
      events.push(event.event);
    }

    expect(events).toEqual(["image_edit.partial_image", "image_edit.completed"]);
  });

  it("非法 JSON 会返回结构化错误事件", async () => {
    const stream = streamFromText(["event: image_generation.completed", "data: {bad", ""].join("\n"));
    const events = [];
    for await (const event of parseImageEventStream(stream)) {
      events.push(event);
    }

    expect(events[0]).toMatchObject({
      event: "parser.error",
      error: expect.stringContaining("无法解析 SSE JSON"),
    });
  });
});

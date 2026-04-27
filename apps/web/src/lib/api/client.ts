import type { ApiResponseEnvelope, ProxyRequestOptions } from "./types";

const baseURLHeader = "X-Image-Base-Url";

// requestGeneration 调用 Go 代理的固定生成端点。它只负责网络请求，不持久化任何用户数据。
export async function requestGeneration(body: unknown, options: ProxyRequestOptions) {
  return requestProxy("/api/images/generations", body, options);
}

// requestEditJson 调用 Go 代理的固定编辑端点，并以 JSON 方式发送请求体。
export async function requestEditJson(body: unknown, options: ProxyRequestOptions) {
  return requestProxy("/api/images/edits", body, options);
}

// requestEditMultipart 调用 Go 代理的固定编辑端点，并以 multipart/form-data 方式发送请求体。
export async function requestEditMultipart(body: FormData, options: ProxyRequestOptions) {
  return requestProxy("/api/images/edits", body, options);
}

async function requestProxy(
  endpoint: "/api/images/generations" | "/api/images/edits",
  body: unknown,
  options: ProxyRequestOptions,
): Promise<ApiResponseEnvelope> {
  const headers = new Headers();
  headers.set(baseURLHeader, options.provider.baseUrl);
  if (options.provider.authType === "bearer" && options.provider.bearerToken) {
    headers.set("Authorization", `Bearer ${options.provider.bearerToken}`);
  }

  let requestBody: BodyInit;
  if (body instanceof FormData) {
    requestBody = body;
  } else {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: requestBody,
    signal: options.signal,
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  return {
    kind: contentType.includes("text/event-stream") ? "sse" : "json",
    response,
  };
}

import type {
  EditFormValues,
  EditImageReference,
  EditMultipartValues,
  GenerationFormValues,
} from "./types";

type JsonObject = Record<string, unknown>;

// mergeAdvancedJson 将高级 JSON 作为补充字段合并到表单字段中。表单字段优先，避免用户界面显示值被隐藏字段覆盖。
export function mergeAdvancedJson(formFields: JsonObject, advancedJson?: string): JsonObject {
  const trimmed = advancedJson?.trim();
  if (!trimmed) {
    return removeUndefined(formFields);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`高级 JSON 格式无效：${error instanceof Error ? error.message : "无法解析"}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("高级 JSON 必须是一个对象");
  }

  return {
    ...(parsed as JsonObject),
    ...removeUndefined(formFields),
  };
}

// buildGenerationRequest 构造 OpenAI /images/generations 的 JSON 请求体。
export function buildGenerationRequest(values: GenerationFormValues): JsonObject {
  const fields: JsonObject = {
    model: emptyToUndefined(values.model),
    prompt: values.prompt,
    n: values.n,
    size: emptyToUndefined(values.size),
    quality: emptyToUndefined(values.quality),
    output_format: emptyToUndefined(values.output_format),
    output_compression: values.output_compression,
    background: emptyToUndefined(values.background),
    moderation: emptyToUndefined(values.moderation),
    stream: values.stream,
  };
  return mergeAdvancedJson(fields, values.advancedJson);
}

// buildEditJsonRequest 构造 OpenAI /images/edits 的 application/json 请求体。
export function buildEditJsonRequest(values: EditFormValues): JsonObject {
  if (!values.images || values.images.length === 0) {
    throw new Error("编辑 JSON 模式至少需要一张图片引用");
  }
  values.images.forEach(validateReference);
  if (values.mask) {
    validateReference(values.mask);
  }

  const fields: JsonObject = {
    model: emptyToUndefined(values.model),
    prompt: values.prompt,
    images: values.images,
    mask: values.mask,
    n: values.n,
    size: emptyToUndefined(values.size),
    quality: emptyToUndefined(values.quality),
    output_format: emptyToUndefined(values.output_format),
    output_compression: values.output_compression,
    background: emptyToUndefined(values.background),
    stream: values.stream,
  };
  return mergeAdvancedJson(fields, values.advancedJson);
}

// buildEditMultipartRequest 构造 OpenAI /images/edits 的 multipart/form-data 请求体。
export function buildEditMultipartRequest(values: EditMultipartValues): FormData {
  if (!values.images.length) {
    throw new Error("编辑上传模式至少需要一张图片");
  }

  const fields = mergeAdvancedJson(
    {
      model: emptyToUndefined(values.model),
      prompt: values.prompt,
      n: values.n,
      size: emptyToUndefined(values.size),
      quality: emptyToUndefined(values.quality),
      output_format: emptyToUndefined(values.output_format),
      output_compression: values.output_compression,
      background: emptyToUndefined(values.background),
      stream: values.stream,
    },
    values.advancedJson,
  );

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    appendFormValue(form, key, value);
  }
  for (const image of values.images) {
    form.append("image[]", image);
  }
  if (values.mask) {
    form.append("mask", values.mask);
  }
  return form;
}

function validateReference(reference: EditImageReference) {
  const hasURL = Boolean(reference.image_url);
  const hasFileID = Boolean(reference.file_id);
  if (hasURL === hasFileID) {
    throw new Error("每个图片引用必须且只能提供一种图片来源");
  }
}

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    form.append(key, String(value));
    return;
  }
  if (typeof value === "string") {
    form.append(key, value);
    return;
  }
  form.append(key, JSON.stringify(value));
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function removeUndefined(fields: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== ""),
  );
}

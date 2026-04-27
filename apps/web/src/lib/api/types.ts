import type { ProviderConfig } from "@/lib/db/schema";

export interface GenerationFormValues {
  model?: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  output_format?: string;
  output_compression?: number;
  background?: string;
  moderation?: string;
  stream?: boolean;
  advancedJson?: string;
}

export interface EditImageReference {
  image_url?: string;
  file_id?: string;
}

export interface EditFormValues {
  model?: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  output_format?: string;
  output_compression?: number;
  background?: string;
  stream?: boolean;
  images?: EditImageReference[];
  mask?: EditImageReference;
  advancedJson?: string;
}

export interface EditMultipartValues extends Omit<EditFormValues, "images" | "mask"> {
  images: File[];
  mask?: File;
}

export interface ProxyRequestOptions {
  provider: ProviderConfig;
  signal?: AbortSignal;
}

export interface ImagesResponseData {
  b64_json?: string;
  url?: string;
}

export interface ImagesResponse {
  created?: number;
  data: ImagesResponseData[];
  usage?: unknown;
}

export type ApiResponseKind = "json" | "sse";

export interface ApiResponseEnvelope {
  kind: ApiResponseKind;
  response: Response;
}

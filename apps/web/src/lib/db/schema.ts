import Dexie, { type Table } from "dexie";

export type TaskKind = "generation" | "edit";
export type TaskStatus = "running" | "succeeded" | "failed" | "canceled";
export type AuthType = "none" | "bearer";

// ProviderConfig 是用户本地保存的服务配置。Bearer Token 只存放在该表，不复制到任务历史。
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  authType: AuthType;
  bearerToken?: string;
  defaultModel?: string;
  createdAt: number;
  updatedAt: number;
}

// AppSettings 保存当前浏览器中的应用级偏好。
export interface AppSettings {
  id: "app";
  activeProviderId?: string;
  saveImagesByDefault: boolean;
  locale: "zh-CN";
  recentModels: string[];
  createdAt: number;
  updatedAt: number;
}

// PresetRecord 保存生成或编辑参数模板，values 是表单状态快照。
export interface PresetRecord {
  id: string;
  name: string;
  kind: TaskKind;
  values: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// PromptSnippetRecord 保存用户常用 Prompt 片段。
export interface PromptSnippetRecord {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// ProviderSnapshot 是任务历史中的非敏感服务快照，故意不包含 bearerToken。
export interface ProviderSnapshot {
  name: string;
  baseUrl: string;
  authType: AuthType;
}

// TaskRecord 记录一次生成或编辑任务。请求和响应快照用于本地重试与排查。
export interface TaskRecord {
  id: string;
  kind: TaskKind;
  status: TaskStatus;
  providerId?: string;
  providerSnapshot: ProviderSnapshot;
  requestSnapshot: unknown;
  responseMetadata?: unknown;
  imageIds: string[];
  errorSummary?: string;
  httpStatus?: number;
  streamed: boolean;
  createdAt: number;
  finishedAt?: number;
  durationMs?: number;
}

export type ImageSource = "b64_json" | "url" | "sse";
export type ImageStatus = "stored" | "remote-only" | "failed";

// ImageRecord 保存图片 Blob 或远程 URL 引用。远程 URL 下载失败时不会经由 Go 任意代理兜底。
export interface ImageRecord {
  id: string;
  taskId: string;
  source: ImageSource;
  status: ImageStatus;
  blob?: Blob;
  remoteUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  errorSummary?: string;
  createdAt: number;
}

export class ImagesToolDatabase extends Dexie {
  providers!: Table<ProviderConfig, string>;
  settings!: Table<AppSettings, string>;
  presets!: Table<PresetRecord, string>;
  promptSnippets!: Table<PromptSnippetRecord, string>;
  tasks!: Table<TaskRecord, string>;
  images!: Table<ImageRecord, string>;

  constructor(name = "openai-images-tool") {
    super(name);
    this.version(1).stores({
      providers: "id, name, baseUrl, updatedAt",
      settings: "id",
      presets: "id, kind, name, updatedAt",
      promptSnippets: "id, title, updatedAt",
      tasks: "id, kind, status, providerId, createdAt",
      images: "id, taskId, status, createdAt",
    });
  }
}

export function createDatabase(name?: string) {
  return new ImagesToolDatabase(name);
}

export const db = createDatabase();

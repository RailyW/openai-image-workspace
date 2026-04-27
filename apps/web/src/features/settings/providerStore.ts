import { db, type AppSettings, type ProviderConfig } from "@/lib/db/schema";
import { createId } from "@/lib/utils";

export const defaultModels = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "chatgpt-image-latest"];

export async function getAppSettings(): Promise<AppSettings> {
  const current = await db.settings.get("app");
  if (current) {
    return current;
  }
  const now = Date.now();
  const initial: AppSettings = {
    id: "app",
    saveImagesByDefault: true,
    locale: "zh-CN",
    recentModels: [...defaultModels],
    createdAt: now,
    updatedAt: now,
  };
  await db.settings.put(initial);
  return initial;
}

export async function listProviders() {
  return db.providers.orderBy("updatedAt").reverse().toArray();
}

export async function getActiveProvider() {
  const settings = await getAppSettings();
  if (settings.activeProviderId) {
    const active = await db.providers.get(settings.activeProviderId);
    if (active) {
      return active;
    }
  }
  const first = await db.providers.orderBy("updatedAt").reverse().first();
  return first;
}

export async function upsertProvider(input: Omit<ProviderConfig, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = Date.now();
  const existing = input.id ? await db.providers.get(input.id) : undefined;
  const provider: ProviderConfig = {
    id: input.id ?? createId("provider"),
    name: input.name.trim(),
    baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
    authType: input.authType,
    bearerToken: input.authType === "bearer" ? input.bearerToken?.trim() : undefined,
    defaultModel: input.defaultModel?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.providers.put(provider);
  const settings = await getAppSettings();
  if (!settings.activeProviderId) {
    await db.settings.put({ ...settings, activeProviderId: provider.id, updatedAt: now });
  }
  return provider;
}

export async function setActiveProvider(providerId: string) {
  const settings = await getAppSettings();
  await db.settings.put({ ...settings, activeProviderId: providerId, updatedAt: Date.now() });
}

export async function deleteProvider(providerId: string) {
  await db.providers.delete(providerId);
  const settings = await getAppSettings();
  if (settings.activeProviderId === providerId) {
    const next = await db.providers.orderBy("updatedAt").reverse().first();
    await db.settings.put({ ...settings, activeProviderId: next?.id, updatedAt: Date.now() });
  }
}

export async function rememberModel(model: string) {
  const trimmed = model.trim();
  if (!trimmed) {
    return;
  }
  const settings = await getAppSettings();
  const recentModels = [trimmed, ...settings.recentModels.filter((item) => item !== trimmed)].slice(0, 20);
  await db.settings.put({ ...settings, recentModels, updatedAt: Date.now() });
}

import { db, type PresetRecord, type PromptSnippetRecord, type TaskKind } from "@/lib/db/schema";
import { createId } from "@/lib/utils";

export async function savePreset(name: string, kind: TaskKind, values: Record<string, unknown>) {
  const now = Date.now();
  const record: PresetRecord = {
    id: createId("preset"),
    name,
    kind,
    values,
    createdAt: now,
    updatedAt: now,
  };
  await db.presets.add(record);
  return record;
}

export async function savePromptSnippet(title: string, content: string) {
  const now = Date.now();
  const record: PromptSnippetRecord = {
    id: createId("snippet"),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  await db.promptSnippets.add(record);
  return record;
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, type PresetRecord, type PromptSnippetRecord, type TaskKind } from "@/lib/db/schema";
import { savePreset, savePromptSnippet } from "./presetStore";

export function PresetsPage() {
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [snippets, setSnippets] = useState<PromptSnippetRecord[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TaskKind>("generation");
  const [json, setJson] = useState("{}");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetContent, setSnippetContent] = useState("");

  async function refresh() {
    const [presetItems, snippetItems] = await Promise.all([db.presets.toArray(), db.promptSnippets.toArray()]);
    setPresets(presetItems);
    setSnippets(snippetItems);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addPreset() {
    await savePreset(name || "未命名预设", kind, JSON.parse(json));
    setName("");
    setJson("{}");
    await refresh();
  }

  async function addSnippet() {
    await savePromptSnippet(snippetTitle || "未命名片段", snippetContent);
    setSnippetTitle("");
    setSnippetContent("");
    await refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>参数预设</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>名称</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <Label>类型</Label>
          <Select value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
            <option value="generation">生成</option>
            <option value="edit">编辑</option>
          </Select>
          <Label>参数 JSON</Label>
          <Textarea value={json} onChange={(event) => setJson(event.target.value)} />
          <Button onClick={addPreset}>保存预设</Button>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div key={preset.id} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <span>{preset.name}</span>
                  <Button variant="destructive" onClick={() => db.presets.delete(preset.id).then(refresh)}>
                    删除
                  </Button>
                </div>
                <pre className="mt-2 overflow-auto rounded bg-secondary p-2 text-xs">{JSON.stringify(preset.values, null, 2)}</pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Prompt 片段</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>标题</Label>
          <Input value={snippetTitle} onChange={(event) => setSnippetTitle(event.target.value)} />
          <Label>内容</Label>
          <Textarea value={snippetContent} onChange={(event) => setSnippetContent(event.target.value)} />
          <Button onClick={addSnippet}>保存片段</Button>
          {snippets.map((snippet) => (
            <div key={snippet.id} className="rounded-md border p-3 text-sm">
              <div className="flex justify-between">
                <span>{snippet.title}</span>
                <Button variant="destructive" onClick={() => db.promptSnippets.delete(snippet.id).then(refresh)}>
                  删除
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{snippet.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

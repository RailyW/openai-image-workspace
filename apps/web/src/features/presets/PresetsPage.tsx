import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, type PresetRecord, type PromptSnippetRecord, type TaskKind } from "@/lib/db/schema";
import { savePreset, savePromptSnippet } from "./presetStore";

/** PresetsPage 管理参数预设和 Prompt 片段，所有内容只保存到浏览器 IndexedDB。 */
export function PresetsPage() {
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [snippets, setSnippets] = useState<PromptSnippetRecord[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TaskKind>("generation");
  const [json, setJson] = useState("{}");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetContent, setSnippetContent] = useState("");

  /** refresh 从 IndexedDB 读取最新预设和 Prompt 片段。 */
  async function refresh() {
    const [presetItems, snippetItems] = await Promise.all([db.presets.toArray(), db.promptSnippets.toArray()]);
    setPresets(presetItems);
    setSnippets(snippetItems);
  }

  useEffect(() => {
    void refresh();
  }, []);

  /** addPreset 保存当前 JSON 参数快照；JSON 解析错误会交给浏览器控制台暴露。 */
  async function addPreset() {
    await savePreset(name || "未命名预设", kind, JSON.parse(json));
    setName("");
    setJson("{}");
    await refresh();
  }

  /** addSnippet 保存一段可复用 Prompt 文本。 */
  async function addSnippet() {
    await savePromptSnippet(snippetTitle || "未命名片段", snippetContent);
    setSnippetTitle("");
    setSnippetContent("");
    await refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>参数预设</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">名称</Label>
            <Input id="preset-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-kind">类型</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as TaskKind)}>
              <SelectTrigger id="preset-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generation">生成</SelectItem>
                <SelectItem value="edit">编辑</SelectItem>
              </SelectContent>
          </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-json">参数 JSON</Label>
            <Textarea id="preset-json" className="font-mono text-xs" value={json} onChange={(event) => setJson(event.target.value)} />
          </div>
          <Button onClick={addPreset}>
            <Save className="h-4 w-4" aria-hidden="true" />
            保存预设
          </Button>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div key={preset.id} className="rounded-md border bg-card p-3 text-sm shadow-sm">
                <div className="flex justify-between">
                  <span>{preset.name}</span>
                  <Button variant="destructive" onClick={() => db.presets.delete(preset.id).then(refresh)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    删除
                  </Button>
                </div>
                <pre className="mt-2 overflow-auto rounded bg-secondary p-2 text-xs">{JSON.stringify(preset.values, null, 2)}</pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Prompt 片段</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="snippet-title">标题</Label>
            <Input id="snippet-title" value={snippetTitle} onChange={(event) => setSnippetTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="snippet-content">内容</Label>
            <Textarea id="snippet-content" value={snippetContent} onChange={(event) => setSnippetContent(event.target.value)} />
          </div>
          <Button onClick={addSnippet}>
            <Save className="h-4 w-4" aria-hidden="true" />
            保存片段
          </Button>
          {snippets.map((snippet) => (
            <div key={snippet.id} className="rounded-md border bg-card p-3 text-sm shadow-sm">
              <div className="flex justify-between">
                <span>{snippet.title}</span>
                <Button variant="destructive" onClick={() => db.promptSnippets.delete(snippet.id).then(refresh)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
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

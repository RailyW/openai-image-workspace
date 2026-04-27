import { useEffect, useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderConfig, TaskRecord } from "@/lib/db/schema";
import type { GenerationFormValues } from "@/lib/api/types";
import { getActiveProvider, listProviders } from "@/features/settings/providerStore";
import { runGeneration } from "./generationRunner";

/** GenerationPage 管理图片生成表单、当前运行任务和本次会话内的结果列表。 */
export function GenerationPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providerId, setProviderId] = useState("");
  const [form, setForm] = useState<GenerationFormValues>({
    model: "gpt-image-1.5",
    prompt: "",
    n: 1,
    size: "1024x1024",
    quality: "high",
    output_format: "png",
    stream: true,
    advancedJson: "",
  });
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [partial, setPartial] = useState<string>();
  const [controllers, setControllers] = useState<Record<string, AbortController>>({});

  useEffect(() => {
    async function load() {
      const [items, active] = await Promise.all([listProviders(), getActiveProvider()]);
      setProviders(items);
      setProviderId(active?.id ?? "");
      setForm((current) => ({ ...current, model: active?.defaultModel ?? current.model }));
    }
    void load();
  }, []);

  /** submit 将表单值交给 runner，runner 负责请求代理、保存历史和图片 Blob。 */
  async function submit() {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) {
      alert("请先在设置中配置服务。");
      return;
    }
    const controller = new AbortController();
    const localId = crypto.randomUUID();
    setControllers((current) => ({ ...current, [localId]: controller }));
    const task = await runGeneration({
      provider,
      values: form,
      signal: controller.signal,
      onPartial: setPartial,
    });
    setControllers((current) => {
      const next = { ...current };
      delete next[localId];
      return next;
    });
    setTasks((current) => [task, ...current]);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>生成图片</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generation-provider">服务</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger id="generation-provider">
                <SelectValue placeholder="请选择服务" />
              </SelectTrigger>
              <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="generation-model">模型</Label>
            <Input id="generation-model" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="generation-prompt">Prompt</Label>
            <Textarea
              id="generation-prompt"
              className="min-h-36"
              value={form.prompt}
              onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="generation-size">尺寸</Label>
              <Input id="generation-size" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation-count">数量</Label>
              <Input
                id="generation-count"
                type="number"
                min={1}
                value={form.n}
                onChange={(event) => setForm({ ...form, n: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation-quality">质量</Label>
              <Input id="generation-quality" value={form.quality} onChange={(event) => setForm({ ...form, quality: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation-format">格式</Label>
              <Input
                id="generation-format"
                value={form.output_format}
                onChange={(event) => setForm({ ...form, output_format: event.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-secondary/60 p-3">
            <Checkbox
              id="generation-stream"
              checked={Boolean(form.stream)}
              onCheckedChange={(checked) => setForm({ ...form, stream: checked === true })}
            />
            <Label htmlFor="generation-stream" className="text-sm">
              启用流式预览
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="generation-advanced">高级 JSON</Label>
            <Textarea
              id="generation-advanced"
              className="font-mono text-xs"
              value={form.advancedJson}
              onChange={(event) => setForm({ ...form, advancedJson: event.target.value })}
            />
          </div>
          <Button type="button" className="w-full" onClick={submit}>
            <Play className="h-4 w-4" aria-hidden="true" />
            开始生成
          </Button>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>任务结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partial && (
            <div className="rounded-md border bg-secondary/40 p-3">
              <img className="max-h-80 w-full rounded-md object-contain" src={`data:image/png;base64,${partial}`} alt="流式预览" />
            </div>
          )}
          {Object.entries(controllers).map(([id, controller]) => (
            <div key={id} className="flex items-center justify-between rounded-md border bg-card p-3 shadow-sm">
              <span className="inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                任务运行中
              </span>
              <Button type="button" variant="destructive" onClick={() => controller.abort()}>
                <Square className="h-4 w-4" aria-hidden="true" />
                取消
              </Button>
            </div>
          ))}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border bg-card p-3 text-sm shadow-sm">
              <p>状态：{task.status}</p>
              {task.errorSummary && <p className="text-destructive">{task.errorSummary}</p>}
              <p className="text-muted-foreground">图片数量：{task.imageIds.length}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

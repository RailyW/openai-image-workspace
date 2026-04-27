import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderConfig, TaskRecord } from "@/lib/db/schema";
import type { GenerationFormValues } from "@/lib/api/types";
import { defaultModels, getActiveProvider, listProviders } from "@/features/settings/providerStore";
import { runGeneration } from "./generationRunner";

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
    <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>生成图片</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-1 block">
            <Label>服务</Label>
            <Select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
              <option value="">请选择服务</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 block">
            <Label>模型</Label>
            <Input list="generation-models" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
            <datalist id="generation-models">
              {defaultModels.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </label>
          <label className="space-y-1 block">
            <Label>Prompt</Label>
            <Textarea value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <Label>尺寸</Label>
              <Input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
            </label>
            <label className="space-y-1">
              <Label>数量</Label>
              <Input type="number" value={form.n} onChange={(event) => setForm({ ...form, n: Number(event.target.value) })} />
            </label>
            <label className="space-y-1">
              <Label>质量</Label>
              <Input value={form.quality} onChange={(event) => setForm({ ...form, quality: event.target.value })} />
            </label>
            <label className="space-y-1">
              <Label>格式</Label>
              <Input value={form.output_format} onChange={(event) => setForm({ ...form, output_format: event.target.value })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.stream)}
              onChange={(event) => setForm({ ...form, stream: event.target.checked })}
            />
            启用流式预览
          </label>
          <label className="space-y-1 block">
            <Label>高级 JSON</Label>
            <Textarea value={form.advancedJson} onChange={(event) => setForm({ ...form, advancedJson: event.target.value })} />
          </label>
          <Button type="button" onClick={submit}>
            开始生成
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>任务结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partial && <img className="max-h-80 rounded-md border object-contain" src={`data:image/png;base64,${partial}`} alt="流式预览" />}
          {Object.entries(controllers).map(([id, controller]) => (
            <div key={id} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">任务运行中</span>
              <Button type="button" variant="destructive" onClick={() => controller.abort()}>
                取消
              </Button>
            </div>
          ))}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border p-3 text-sm">
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

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderConfig, TaskRecord } from "@/lib/db/schema";
import { defaultModels, getActiveProvider, listProviders } from "@/features/settings/providerStore";
import { runEditing } from "./editingRunner";

export function EditingPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providerId, setProviderId] = useState("");
  const [mode, setMode] = useState<"multipart" | "json">("multipart");
  const [model, setModel] = useState("gpt-image-1.5");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileId, setFileId] = useState("");
  const [maskUrl, setMaskUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [mask, setMask] = useState<File | undefined>();
  const [stream, setStream] = useState(true);
  const [advancedJson, setAdvancedJson] = useState("");
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [partial, setPartial] = useState<string>();

  useEffect(() => {
    async function load() {
      const [items, active] = await Promise.all([listProviders(), getActiveProvider()]);
      setProviders(items);
      setProviderId(active?.id ?? "");
      setModel(active?.defaultModel ?? "gpt-image-1.5");
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
    const base = { model, prompt, stream, advancedJson };
    const task =
      mode === "multipart"
        ? await runEditing({
            mode,
            provider,
            values: { ...base, images, mask },
            signal: controller.signal,
            onPartial: setPartial,
          })
        : await runEditing({
            mode,
            provider,
            values: {
              ...base,
              images: [{ image_url: imageUrl || undefined, file_id: fileId || undefined }],
              mask: maskUrl ? { image_url: maskUrl } : undefined,
            },
            signal: controller.signal,
            onPartial: setPartial,
          });
    setTasks((current) => [task, ...current]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>编辑图片</CardTitle>
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
            <Input list="editing-models" value={model} onChange={(event) => setModel(event.target.value)} />
            <datalist id="editing-models">
              {defaultModels.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label className="space-y-1 block">
            <Label>Prompt</Label>
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </label>
          <label className="space-y-1 block">
            <Label>来源模式</Label>
            <Select value={mode} onChange={(event) => setMode(event.target.value as "multipart" | "json")}>
              <option value="multipart">上传图片</option>
              <option value="json">图片 URL / File ID</option>
            </Select>
          </label>
          {mode === "multipart" ? (
            <div className="space-y-3">
              <label className="space-y-1 block">
                <Label>源图</Label>
                <Input type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files ?? []))} />
              </label>
              <label className="space-y-1 block">
                <Label>Mask</Label>
                <Input type="file" accept="image/*" onChange={(event) => setMask(event.target.files?.[0])} />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="space-y-1 block">
                <Label>图片 URL</Label>
                <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
              </label>
              <label className="space-y-1 block">
                <Label>File ID</Label>
                <Input value={fileId} onChange={(event) => setFileId(event.target.value)} />
              </label>
              <label className="space-y-1 block">
                <Label>Mask URL</Label>
                <Input value={maskUrl} onChange={(event) => setMaskUrl(event.target.value)} />
              </label>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stream} onChange={(event) => setStream(event.target.checked)} />
            启用流式预览
          </label>
          <label className="space-y-1 block">
            <Label>高级 JSON</Label>
            <Textarea value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} />
          </label>
          <Button type="button" onClick={submit}>
            开始编辑
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>编辑结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partial && <img className="max-h-80 rounded-md border object-contain" src={`data:image/png;base64,${partial}`} alt="流式预览" />}
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

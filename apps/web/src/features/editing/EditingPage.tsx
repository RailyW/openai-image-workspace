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
import { getActiveProvider, listProviders } from "@/features/settings/providerStore";
import { runEditing } from "./editingRunner";

/** EditingPage 管理图片编辑表单，支持 multipart 上传和 JSON 引用两种官方请求体。 */
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
  const [controllers, setControllers] = useState<Record<string, AbortController>>({});

  useEffect(() => {
    async function load() {
      const [items, active] = await Promise.all([listProviders(), getActiveProvider()]);
      setProviders(items);
      setProviderId(active?.id ?? "");
      setModel(active?.defaultModel ?? "gpt-image-1.5");
    }
    void load();
  }, []);

  /** submit 根据来源模式构造编辑参数，并交由 runner 执行代理请求和本地保存。 */
  async function submit() {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) {
      alert("请先在设置中配置服务。");
      return;
    }
    const controller = new AbortController();
    const localId = crypto.randomUUID();
    setControllers((current) => ({ ...current, [localId]: controller }));
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
          <CardTitle>编辑图片</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editing-provider">服务</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger id="editing-provider">
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
            <Label htmlFor="editing-model">模型</Label>
            <Input id="editing-model" value={model} onChange={(event) => setModel(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editing-prompt">Prompt</Label>
            <Textarea id="editing-prompt" className="min-h-36" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editing-mode">来源模式</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as "multipart" | "json")}>
              <SelectTrigger id="editing-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multipart">上传图片</SelectItem>
                <SelectItem value="json">图片 URL / File ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "multipart" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="editing-images">源图</Label>
                <Input
                  id="editing-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setImages(Array.from(event.target.files ?? []))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editing-mask-file">Mask</Label>
                <Input id="editing-mask-file" type="file" accept="image/*" onChange={(event) => setMask(event.target.files?.[0])} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="editing-image-url">图片 URL</Label>
                <Input id="editing-image-url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editing-file-id">File ID</Label>
                <Input id="editing-file-id" value={fileId} onChange={(event) => setFileId(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editing-mask-url">Mask URL</Label>
                <Input id="editing-mask-url" value={maskUrl} onChange={(event) => setMaskUrl(event.target.value)} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-md border bg-secondary/60 p-3">
            <Checkbox id="editing-stream" checked={stream} onCheckedChange={(checked) => setStream(checked === true)} />
            <Label htmlFor="editing-stream" className="text-sm">
              启用流式预览
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editing-advanced">高级 JSON</Label>
            <Textarea
              id="editing-advanced"
              className="font-mono text-xs"
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
            />
          </div>
          <Button type="button" className="w-full" onClick={submit}>
            <Play className="h-4 w-4" aria-hidden="true" />
            开始编辑
          </Button>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>编辑结果</CardTitle>
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
                编辑任务运行中
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

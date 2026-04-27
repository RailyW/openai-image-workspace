import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { db, type ProviderConfig } from "@/lib/db/schema";
import { exportFileName, exportLocalDataZip, exportWarningText } from "@/lib/export/exportZip";
import { humanBytes } from "@/lib/utils";
import { deleteProvider, getAppSettings, listProviders, setActiveProvider, upsertProvider } from "./providerStore";

interface ProviderFormState {
  id?: string;
  name: string;
  baseUrl: string;
  authType: "none" | "bearer";
  bearerToken: string;
  defaultModel: string;
}

const emptyForm: ProviderFormState = {
  name: "",
  baseUrl: "",
  authType: "none",
  bearerToken: "",
  defaultModel: "gpt-image-1.5",
};

export function SettingsPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | undefined>();
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [storage, setStorage] = useState<{ usage?: number; quota?: number }>({});
  const [message, setMessage] = useState("");

  async function refresh() {
    const [items, settings] = await Promise.all([listProviders(), getAppSettings()]);
    setProviders(items);
    setActiveProviderId(settings.activeProviderId);
    if (navigator.storage?.estimate) {
      setStorage(await navigator.storage.estimate());
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function saveProvider() {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      setMessage("服务名称和 Base URL 必填。");
      return;
    }
    await upsertProvider(form);
    setForm(emptyForm);
    setMessage("服务配置已保存。");
    await refresh();
  }

  async function exportData() {
    if (!window.confirm(exportWarningText)) {
      return;
    }
    const blob = await exportLocalDataZip(db);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName();
    link.click();
    URL.revokeObjectURL(url);
  }

  async function clearAll() {
    if (!window.confirm("将清空本工具在当前浏览器中的全部本地数据，且无法从服务端恢复。确认继续？")) {
      return;
    }
    await db.transaction("rw", [db.providers, db.settings, db.presets, db.promptSnippets, db.tasks, db.images], async () => {
      await Promise.all([
        db.providers.clear(),
        db.settings.clear(),
        db.presets.clear(),
        db.promptSnippets.clear(),
        db.tasks.clear(),
        db.images.clear(),
      ]);
    });
    setMessage("本地数据已清空。");
    setForm(emptyForm);
    await refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>服务配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <Label>服务名称</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="space-y-1">
              <Label>默认模型</Label>
              <Input
                value={form.defaultModel}
                onChange={(event) => setForm({ ...form, defaultModel: event.target.value })}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <Label>Base URL</Label>
            <Input
              placeholder="http://192.168.1.50:8000/v1"
              value={form.baseUrl}
              onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <Label>鉴权方式</Label>
              <Select
                value={form.authType}
                onChange={(event) => setForm({ ...form, authType: event.target.value as "none" | "bearer" })}
              >
                <option value="none">无鉴权</option>
                <option value="bearer">Bearer Token</option>
              </Select>
            </label>
            <label className="space-y-1">
              <Label>Bearer Token</Label>
              <Input
                disabled={form.authType !== "bearer"}
                type="password"
                value={form.bearerToken}
                onChange={(event) => setForm({ ...form, bearerToken: event.target.value })}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={saveProvider}>
              保存服务
            </Button>
            <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
              新建
            </Button>
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>已保存服务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.length === 0 && <p className="text-sm text-muted-foreground">还没有服务配置。</p>}
            {providers.map((provider) => (
              <div key={provider.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="break-all text-xs text-muted-foreground">{provider.baseUrl}</p>
                  </div>
                  {activeProviderId === provider.id && <span className="text-xs text-primary">当前</span>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setActiveProvider(provider.id).then(refresh)}>
                    设为当前
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        id: provider.id,
                        name: provider.name,
                        baseUrl: provider.baseUrl,
                        authType: provider.authType,
                        bearerToken: provider.bearerToken ?? "",
                        defaultModel: provider.defaultModel ?? "",
                      })
                    }
                  >
                    编辑
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deleteProvider(provider.id).then(refresh)}>
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>本地数据</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>已用：{humanBytes(storage.usage)}</p>
            <p>配额：{humanBytes(storage.quota)}</p>
            <Button type="button" variant="outline" onClick={exportData}>
              导出本地数据
            </Button>
            <Button type="button" variant="destructive" onClick={clearAll}>
              清空全部本地数据
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

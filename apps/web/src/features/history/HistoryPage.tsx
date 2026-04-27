import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, type ImageRecord, type TaskRecord } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { clearImagesKeepTasks, clearTasksByStatus, deleteTask } from "./historyActions";

/** HistoryPage 读取本地任务和图片记录，并提供本地清理入口。 */
export function HistoryPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "generation" | "edit">("all");

  /** refresh 从 IndexedDB 加载任务和图片，页面不访问服务端历史。 */
  async function refresh() {
    const [taskItems, imageItems] = await Promise.all([
      db.tasks.orderBy("createdAt").reverse().toArray(),
      db.images.toArray(),
    ]);
    setTasks(taskItems);
    setImages(imageItems);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(
    () => tasks.filter((task) => filter === "all" || task.kind === filter),
    [filter, tasks],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            全部
          </Button>
          <Button variant={filter === "generation" ? "default" : "outline"} onClick={() => setFilter("generation")}>
            生成
          </Button>
          <Button variant={filter === "edit" ? "default" : "outline"} onClick={() => setFilter("edit")}>
            编辑
          </Button>
          <Button variant="outline" onClick={() => clearImagesKeepTasks().then(refresh)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            只清理图片
          </Button>
          <Button variant="outline" onClick={() => clearTasksByStatus("failed").then(refresh)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            清理失败任务
          </Button>
          <Button variant="destructive" onClick={() => clearTasksByStatus("succeeded").then(refresh)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            清理成功任务
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {filtered.map((task) => (
          <Card key={task.id} className="overflow-hidden">
            <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_220px]">
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{task.kind === "generation" ? "生成" : "编辑"}</p>
                  <Badge variant={task.status === "failed" ? "destructive" : "secondary"}>{task.status}</Badge>
                </div>
                <p className="text-muted-foreground">服务：{task.providerSnapshot.name}</p>
                <p className="text-muted-foreground">时间：{formatDateTime(task.createdAt)}</p>
                {task.errorSummary && <p className="text-destructive">{task.errorSummary}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground">参数快照</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-secondary p-2 text-xs">
                    {JSON.stringify(task.requestSnapshot, null, 2)}
                  </pre>
                </details>
                <Button variant="destructive" onClick={() => deleteTask(task.id).then(refresh)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  删除
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {images
                  .filter((image) => task.imageIds.includes(image.id))
                  .map((image) => (
                    <HistoryImage key={image.id} image={image} />
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">暂无历史记录。</p>}
      </div>
    </div>
  );
}

/** HistoryImage 将本地 Blob 或远程 URL 统一转成可展示的图片地址。 */
function HistoryImage({ image }: { image: ImageRecord }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (image.blob) {
      const objectUrl = URL.createObjectURL(image.blob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(image.remoteUrl);
  }, [image]);

  if (!url) {
    return <div className="rounded-md border p-2 text-xs text-muted-foreground">图片不可用</div>;
  }
  return <img src={url} alt="历史图片" className="h-28 w-full rounded-md border object-contain" />;
}

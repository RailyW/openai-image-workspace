import { db } from "@/lib/db/schema";

export async function deleteTask(taskId: string) {
  await db.transaction("rw", db.tasks, db.images, async () => {
    await db.tasks.delete(taskId);
    await db.images.where("taskId").equals(taskId).delete();
  });
}

export async function clearImagesKeepTasks() {
  await db.transaction("rw", db.tasks, db.images, async () => {
    await db.images.clear();
    const tasks = await db.tasks.toArray();
    await Promise.all(tasks.map((task) => db.tasks.put({ ...task, imageIds: [] })));
  });
}

export async function clearTasksByStatus(status: "succeeded" | "failed") {
  const tasks = await db.tasks.where("status").equals(status).toArray();
  await Promise.all(tasks.map((task) => deleteTask(task.id)));
}

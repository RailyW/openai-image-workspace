const navItems = ["生成", "编辑", "历史", "预设", "设置"];

export function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">OpenAI Images 工具</h1>
            <p className="text-sm text-muted-foreground">初始工程骨架已启动</p>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-medium">可运行前端已就绪</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            后续任务会逐步接入本地数据库、Go 代理、流式图片生成、编辑、历史、导出和清理功能。
          </p>
        </div>
      </section>
    </main>
  );
}

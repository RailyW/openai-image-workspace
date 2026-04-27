import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditingPage } from "@/features/editing/EditingPage";
import { GenerationPage } from "@/features/generation/GenerationPage";
import { HistoryPage } from "@/features/history/HistoryPage";
import { PresetsPage } from "@/features/presets/PresetsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { messages } from "@/lib/i18n/messages";

type ViewKey = "generation" | "editing" | "history" | "presets" | "settings";

const navItems: Array<{ key: ViewKey; label: string }> = [
  { key: "generation", label: messages.nav.generation },
  { key: "editing", label: messages.nav.editing },
  { key: "history", label: messages.nav.history },
  { key: "presets", label: messages.nav.presets },
  { key: "settings", label: messages.nav.settings },
];

export function App() {
  const [view, setView] = useState<ViewKey>("generation");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{messages.appTitle}</h1>
            <p className="text-sm text-muted-foreground">用户数据仅保存在当前浏览器，本服务端只做代理转发。</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant={view === item.key ? "default" : "ghost"}
                type="button"
                onClick={() => setView(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-6">
        {view === "generation" && <GenerationPage />}
        {view === "editing" && <EditingPage />}
        {view === "history" && <HistoryPage />}
        {view === "presets" && <PresetsPage />}
        {view === "settings" && <SettingsPage />}
      </section>
    </main>
  );
}

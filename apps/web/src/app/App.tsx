import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { History, ImagePlus, PencilLine, Settings, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditingPage } from "@/features/editing/EditingPage";
import { GenerationPage } from "@/features/generation/GenerationPage";
import { HistoryPage } from "@/features/history/HistoryPage";
import { PresetsPage } from "@/features/presets/PresetsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { messages } from "@/lib/i18n/messages";

type ViewKey = "generation" | "editing" | "history" | "presets" | "settings";

const navItems: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: "generation", label: messages.nav.generation, icon: ImagePlus },
  { key: "editing", label: messages.nav.editing, icon: PencilLine },
  { key: "history", label: messages.nav.history, icon: History },
  { key: "presets", label: messages.nav.presets, icon: SlidersHorizontal },
  { key: "settings", label: messages.nav.settings, icon: Settings },
];

/** App 负责应用级导航和当前页面切换，业务数据仍由各 feature 自己管理。 */
export function App() {
  const [view, setView] = useState<ViewKey>("generation");

  return (
    <main className="min-h-screen bg-background/95 text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1440px] gap-0 bg-background/80 backdrop-blur lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b bg-card/95 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground shadow-sm">
              {/* 品牌图标来自 public 下的本地 SVG，避免运行时依赖远程 CDN。 */}
              <img className="h-6 w-6" src="/openai-icon.svg" alt="OpenAI 标志" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">{messages.appTitle}</h1>
              <p className="text-xs text-muted-foreground">Images Console</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              // 导航使用按钮而非路由链接，保持第一版无路由库的本地视图切换模型。
              <Button
                key={item.key}
                variant={view === item.key ? "default" : "ghost"}
                className="h-10 shrink-0 justify-start px-3 lg:w-full"
                type="button"
                onClick={() => setView(item.key)}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {view === "generation" && <GenerationPage />}
          {view === "editing" && <EditingPage />}
          {view === "history" && <HistoryPage />}
          {view === "presets" && <PresetsPage />}
          {view === "settings" && <SettingsPage />}
        </section>
      </div>
    </main>
  );
}

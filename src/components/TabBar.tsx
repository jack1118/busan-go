export type TabKey = "itinerary" | "map" | "tools" | "settings";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "itinerary", label: "行程", icon: "🗓" },
  { key: "map", label: "地圖", icon: "🗺" },
  { key: "tools", label: "工具", icon: "🧰" },
  { key: "settings", label: "設定", icon: "⚙️" },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/70"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key} className="flex-1">
              <button
                onClick={() => onChange(t.key)}
                className="flex w-full flex-col items-center gap-0.5 py-2 transition-colors"
              >
                <span className="text-[22px] leading-none">{t.icon}</span>
                <span
                  className={
                    "text-[11px] font-medium " +
                    (on
                      ? "text-coral"
                      : "text-neutral-400 dark:text-neutral-500")
                  }
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

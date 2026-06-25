import { useState } from "react";
import type { PackingCategory } from "../types";

const STORAGE_KEY = "busan:packing";

function keyOf(category: string, text: string): string {
  return `${category}|${text}`;
}

function emojiFor(category: string): string {
  if (category.includes("證件")) return "🛂";
  if (category.includes("預訂")) return "📋";
  if (category.includes("打包")) return "🧳";
  if (category.includes("衣物")) return "👕";
  if (category.includes("登機") || category.includes("出發當天")) return "✈️";
  if (category.includes("APP")) return "📱";
  return "📦";
}

function loadStored(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, boolean>;
    }
    return {};
  } catch {
    return {};
  }
}

export default function PackingList({
  categories,
}: {
  categories: PackingCategory[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const stored = loadStored();
    const merged: Record<string, boolean> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        const k = keyOf(cat.category, item.text);
        merged[k] = k in stored ? stored[k] : item.done;
      }
    }
    return merged;
  });

  const toggle = (k: string) => {
    setChecked((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write failures (e.g. private mode)
      }
      return next;
    });
  };

  const allItems = categories.flatMap((c) =>
    c.items.map((it) => keyOf(c.category, it.text)),
  );
  const total = allItems.length;
  const packed = allItems.filter((k) => checked[k]).length;
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100);

  return (
    <div className="space-y-5">
      {/* overall progress */}
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">打包進度</span>
          <span className="text-[13px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
            已打包 {packed}/{total} 項
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-coral transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* categories */}
      {categories.map((cat) => {
        const catKeys = cat.items.map((it) => keyOf(cat.category, it.text));
        const catDone = catKeys.filter((k) => checked[k]).length;
        return (
          <section key={cat.category}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-[15px] font-semibold">
                <span className="mr-1.5">{emojiFor(cat.category)}</span>
                {cat.category}
              </h3>
              <span className="text-[13px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500">
                已勾 {catDone}/{cat.items.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
              {cat.items.map((item, i) => {
                const k = keyOf(cat.category, item.text);
                const isChecked = !!checked[k];
                return (
                  <button
                    key={k}
                    onClick={() => toggle(k)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition-colors active:bg-neutral-50 dark:active:bg-neutral-700/50 ${
                      i > 0
                        ? "border-t border-neutral-100 dark:border-neutral-700/60"
                        : ""
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors ${
                        isChecked
                          ? "bg-coral text-white"
                          : "ring-1 ring-neutral-300 dark:ring-neutral-600"
                      }`}
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                    <span
                      className={`text-[15px] leading-snug ${
                        isChecked
                          ? "text-neutral-400 line-through dark:text-neutral-500"
                          : "text-neutral-800 dark:text-neutral-100"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

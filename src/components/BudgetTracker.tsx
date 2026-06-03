import { useEffect, useState } from "react";
import type { Budget } from "../types";
import { getKrwToTwd, krwToTwd } from "../lib/currency";

type Mode = "estimate" | "ledger";

const CATEGORIES = ["餐飲", "交通", "購物", "門票", "其他"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLOR: Record<Category, string> = {
  餐飲: "bg-coral",
  交通: "bg-busan-blue",
  購物: "bg-busan-blue-deep",
  門票: "bg-amber-500",
  其他: "bg-neutral-400",
};

interface Expense {
  id: string;
  label: string;
  amountKrw: number;
  category: Category;
}

const EXPENSES_KEY = "busan:expenses";

function readExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Expense[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.label === "string" &&
        typeof e.amountKrw === "number" &&
        CATEGORIES.includes(e.category as Category)
    );
  } catch {
    return [];
  }
}

const krwFmt = new Intl.NumberFormat("zh-TW");

export default function BudgetTracker({ budget }: { budget: Budget }) {
  const [mode, setMode] = useState<Mode>("estimate");
  const [expenses, setExpenses] = useState<Expense[]>(() => readExpenses());
  const [rate, setRate] = useState<number>(0.023);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("餐飲");

  useEffect(() => {
    let active = true;
    getKrwToTwd().then((r) => {
      if (active) setRate(r);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch {
      // ignore write failures
    }
  }, [expenses]);

  function addExpense() {
    const amountKrw = Number(amount);
    if (!label.trim() || !Number.isFinite(amountKrw) || amountKrw <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: String(Date.now()), label: label.trim(), amountKrw, category },
    ]);
    setLabel("");
    setAmount("");
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const totalKrw = expenses.reduce((sum, e) => sum + e.amountKrw, 0);

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    krw: expenses
      .filter((e) => e.category === c)
      .reduce((sum, e) => sum + e.amountKrw, 0),
  })).filter((row) => row.krw > 0);
  const maxKrw = byCategory.reduce((m, r) => Math.max(m, r.krw), 0);

  return (
    <div className="space-y-4">
      {/* tabs */}
      <div className="flex rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {(
          [
            ["estimate", "預估"],
            ["ledger", "記帳"],
          ] as const
        ).map(([m, text]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "flex-1 rounded-xl py-2 text-[14px] font-semibold transition-colors " +
              (mode === m
                ? "bg-white text-busan-blue-deep shadow-sm dark:bg-neutral-700 dark:text-busan-blue"
                : "text-neutral-500 dark:text-neutral-400")
            }
          >
            {text}
          </button>
        ))}
      </div>

      {mode === "estimate" ? (
        <div className="space-y-2">
          {budget.items.map((item, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5"
            >
              <span className="text-[15px] font-medium leading-snug">
                {item.category}
              </span>
              <span className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-busan-blue-deep dark:text-busan-blue">
                {item.cost}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-busan-blue/10 p-4 ring-1 ring-busan-blue/20">
            <span className="text-[15px] font-bold">總預算</span>
            <span className="text-[18px] font-bold tabular-nums text-busan-blue-deep dark:text-busan-blue">
              {budget.total}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* add form */}
          <div className="space-y-2 rounded-2xl bg-white p-3 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="項目名稱（例：午餐）"
              className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-[14px] outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-busan-blue dark:bg-neutral-700"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400">
                  ₩
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="金額"
                  className="w-full rounded-xl bg-neutral-100 py-2 pl-7 pr-3 text-[14px] tabular-nums outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-busan-blue dark:bg-neutral-700"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-busan-blue dark:bg-neutral-700"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addExpense}
              className="w-full rounded-xl bg-busan-blue py-2.5 text-[14px] font-semibold text-white active:scale-[0.98]"
            >
              新增記帳
            </button>
          </div>

          {/* totals */}
          <div className="rounded-2xl bg-busan-blue/10 p-4 ring-1 ring-busan-blue/20">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">總支出</span>
              <span className="text-[18px] font-bold tabular-nums text-busan-blue-deep dark:text-busan-blue">
                ₩{krwFmt.format(totalKrw)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-[13px] text-neutral-500 dark:text-neutral-400">
              <span>≈ NT${krwFmt.format(krwToTwd(totalKrw, rate))}</span>
              <span className="tabular-nums">匯率 1₩ ≈ {rate.toFixed(4)} 元</span>
            </div>
          </div>

          {/* category bar chart */}
          {byCategory.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-white p-3 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
              <p className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                分類統計
              </p>
              {byCategory.map((row) => (
                <div key={row.category}>
                  <div className="mb-0.5 flex justify-between text-[12px]">
                    <span className="font-medium">{row.category}</span>
                    <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                      ₩{krwFmt.format(row.krw)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                    <div
                      className={
                        "h-full rounded-full " + CATEGORY_COLOR[row.category]
                      }
                      style={{
                        width: `${maxKrw > 0 ? (row.krw / maxKrw) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* expense rows */}
          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5"
                >
                  <span
                    className={
                      "h-2.5 w-2.5 shrink-0 rounded-full " +
                      CATEGORY_COLOR[e.category]
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{e.label}</p>
                    <p className="text-[12px] text-neutral-400">{e.category}</p>
                  </div>
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums">
                    ₩{krwFmt.format(e.amountKrw)}
                  </span>
                  <button
                    onClick={() => removeExpense(e.id)}
                    aria-label="刪除"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-400 active:scale-90 dark:hover:bg-neutral-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-[14px] text-neutral-400">
              還沒有記帳，從上方新增第一筆吧。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

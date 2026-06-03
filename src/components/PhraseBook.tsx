import { useState } from "react";
import phrases from "../data/phrases.json";
import SpeakCard from "./SpeakCard";

interface Phrase {
  zh: string;
  kr: string;
  rr: string;
}

export default function PhraseBook() {
  const cats = phrases.categories;
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Phrase | null>(null);
  const current = cats[active];

  return (
    <div>
      <p className="mb-3 rounded-xl bg-busan-blue/10 px-3 py-2 text-[12.5px] text-busan-blue-deep dark:text-busan-blue">
        💡 點句子放大，把韓文出示給對方看；下方羅馬拼音可以照著唸
      </p>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {cats.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setActive(i)}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors " +
              (i === active
                ? "bg-coral text-white"
                : "bg-white text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-300")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {current.items.map((p, i) => (
          <button
            key={i}
            onClick={() => setOpen(p)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] active:scale-[0.99] dark:bg-neutral-800 dark:ring-white/5"
          >
            <div className="min-w-0">
              <div className="text-[14px] text-neutral-500 dark:text-neutral-400">
                {p.zh}
              </div>
              <div className="text-[17px] font-bold leading-snug">{p.kr}</div>
              <div className="text-[12px] italic text-neutral-400">{p.rr}</div>
            </div>
            <span className="shrink-0 rounded-full bg-busan-blue/15 px-2.5 py-1 text-[12px] font-semibold text-busan-blue-deep dark:text-busan-blue">
              放大
            </span>
          </button>
        ))}
      </div>

      {open && (
        <SpeakCard
          open={!!open}
          zh={open.zh}
          kr={open.kr}
          rr={open.rr}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

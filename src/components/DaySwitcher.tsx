import type { Day } from "../types";

export default function DaySwitcher({
  days,
  activeId,
  onSelect,
}: {
  days: Day[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {days.map((d) => {
        const on = d.id === activeId;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={
              "flex shrink-0 flex-col items-center rounded-2xl px-4 py-2 transition-all " +
              (on
                ? "bg-coral text-white shadow-md shadow-coral/30"
                : "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300")
            }
          >
            <span className="text-sm font-bold">{d.id}</span>
            <span
              className={
                "text-[11px] " +
                (on ? "text-white/90" : "text-neutral-400")
              }
            >
              {d.date}
            </span>
          </button>
        );
      })}
    </div>
  );
}

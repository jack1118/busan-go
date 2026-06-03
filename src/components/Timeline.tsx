import type { Day, TimelineItem } from "../types";
import { ICON_EMOJI } from "../types";

export default function Timeline({
  day,
  onSelect,
}: {
  day: Day;
  onSelect: (item: TimelineItem) => void;
}) {
  return (
    <div className="relative">
      {day.items.map((item, i) => (
        <div key={i} className="flex gap-3">
          {/* time + rail */}
          <div className="flex w-14 shrink-0 flex-col items-end pt-1">
            <span className="text-[13px] font-semibold tabular-nums text-busan-blue-deep dark:text-busan-blue">
              {item.time}
            </span>
          </div>
          <div className="relative flex flex-col items-center">
            <span className="z-10 grid h-7 w-7 place-items-center rounded-full bg-white text-sm shadow-sm ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
              {ICON_EMOJI[item.icon]}
            </span>
            {i < day.items.length - 1 && (
              <span className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            )}
          </div>
          {/* card */}
          <button
            onClick={() => onSelect(item)}
            className="mb-3 flex-1 rounded-2xl bg-white p-3 text-left shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] transition-transform active:scale-[0.99] dark:bg-neutral-800 dark:ring-white/5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[15px] font-semibold leading-snug">
                {item.activity}
              </span>
              <span className="mt-0.5 shrink-0 text-neutral-300 dark:text-neutral-600">
                ›
              </span>
            </div>
            {item.note && (
              <p className="mt-1 line-clamp-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                {item.note}
              </p>
            )}
            {item.maps && (
              <span className="mt-1.5 inline-block text-[12px] font-medium text-busan-blue-deep dark:text-busan-blue">
                📍 有地圖
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

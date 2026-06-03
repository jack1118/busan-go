import { useEffect, useState } from "react";
import { fetchTripWeather, dateLabelToISO } from "../lib/weather";
import type { DayWeather } from "../lib/weather";

export default function WeatherBanner({ dateLabel }: { dateLabel: string }) {
  const [weather, setWeather] = useState<DayWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTripWeather()
      .then((all) => {
        if (!active) return;
        const iso = dateLabelToISO(dateLabel);
        setWeather(iso ? all[iso] ?? null : null);
      })
      .catch(() => {
        if (active) setWeather(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dateLabel]);

  if (loading) {
    return (
      <div className="mb-3 h-9 w-full animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-700/50" />
    );
  }

  if (!weather) return null;

  return (
    <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
      <div className="flex items-center gap-2 text-[15px]">
        <span className="text-lg">{weather.emoji}</span>
        <span className="font-semibold">{weather.label}</span>
        {weather.seasonal && (
          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:bg-neutral-700 dark:text-neutral-400">
            季節預估
          </span>
        )}
        <span className="font-medium tabular-nums text-neutral-600 dark:text-neutral-300">
          {weather.tMax}° / {weather.tMin}°
        </span>
        <span className="ml-auto text-[13px] font-medium tabular-nums text-busan-blue-deep dark:text-busan-blue">
          降雨 {weather.rainProb}%
        </span>
      </div>
      {weather.rainProb > 50 && (
        <p className="mt-1.5 text-[13px] font-medium text-coral">
          🌧 留意陣雨，記得帶雨具／準備雨天備案
        </p>
      )}
    </div>
  );
}

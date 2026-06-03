import { lazy, Suspense, useMemo, useRef, useState } from "react";
import raw from "./data/itinerary.json";
import type { Day, Itinerary, TimelineItem } from "./types";
import TabBar, { type TabKey } from "./components/TabBar";
import DaySwitcher from "./components/DaySwitcher";
import Timeline from "./components/Timeline";
import BottomSheet from "./components/BottomSheet";
import FlightCard from "./components/FlightCard";
import WeatherBanner from "./components/WeatherBanner";
import PackingList from "./components/PackingList";
import BudgetTracker from "./components/BudgetTracker";
import EmergencyCard from "./components/EmergencyCard";
import ExportButton from "./components/DayExport";

// Leaflet (~150KB) only loads when the map tab is opened.
const MapView = lazy(() => import("./components/MapView"));

const data = raw as Itinerary;

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div
      className="bg-gradient-to-b from-busan-blue/15 to-transparent px-4 pb-2"
      style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
    >
      <h1 className="text-[26px] font-extrabold tracking-tight">釜山去</h1>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
        {subtitle}
      </p>
    </div>
  );
}

function RainPlanCard({ plans }: { plans: string[] }) {
  return (
    <div className="rounded-2xl bg-busan-blue/10 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-busan-blue-deep dark:text-busan-blue">
        🌧 雨天備案
      </div>
      <ul className="space-y-2">
        {plans.map((r, i) => (
          <li
            key={i}
            className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300"
          >
            {r.replace(/^雨天備案[\sA-B]*[:：]?\s*/, "")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayView({
  day,
  onSelect,
}: {
  day: Day;
  onSelect: (item: TimelineItem) => void;
}) {
  const [rainMode, setRainMode] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const hasRain = day.rainPlan.length > 0;

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[20px] font-bold">
            {day.id} · {day.title}
          </h2>
          {day.theme && (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
              {day.theme}
            </p>
          )}
        </div>
        {hasRain && (
          <button
            onClick={() => setRainMode((v) => !v)}
            className={
              "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors " +
              (rainMode
                ? "bg-busan-blue text-white"
                : "bg-white text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-300")
            }
          >
            {rainMode ? "🌧 雨天備案" : "☀️ 正常行程"}
          </button>
        )}
      </div>

      <WeatherBanner dateLabel={day.date} />

      {rainMode && hasRain ? (
        <RainPlanCard plans={day.rainPlan} />
      ) : (
        <>
          <div ref={exportRef} className="bg-appbg pb-1 dark:bg-black">
            <Timeline day={day} onSelect={onSelect} />
          </div>
          {hasRain && <RainPlanCard plans={day.rainPlan} />}
          <div className="mt-3">
            <ExportButton
              targetRef={exportRef}
              filename={`釜山去-${day.id}.png`}
              className="w-full rounded-2xl bg-neutral-100 py-2.5 text-[14px] font-semibold text-neutral-600 active:scale-[0.99] dark:bg-neutral-800 dark:text-neutral-300"
            />
          </div>
        </>
      )}
    </div>
  );
}

function ItineraryPage() {
  const [activeId, setActiveId] = useState(data.days[0]?.id ?? "D1");
  const [selected, setSelected] = useState<TimelineItem | null>(null);
  const day = useMemo(
    () => data.days.find((d) => d.id === activeId) ?? data.days[0],
    [activeId]
  );

  return (
    <div className="px-4">
      {data.flights && (
        <div className="mb-4">
          <FlightCard flights={data.flights} />
        </div>
      )}

      <DaySwitcher days={data.days} activeId={activeId} onSelect={setActiveId} />

      {day && <DayView day={day} onSelect={setSelected} />}

      <BottomSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ToolsPage() {
  const [tool, setTool] = useState<"packing" | "budget" | "emergency">(
    "packing"
  );
  const tabs: { key: typeof tool; label: string }[] = [
    { key: "packing", label: "🧳 打包" },
    { key: "budget", label: "💰 預算" },
    { key: "emergency", label: "🚨 緊急" },
  ];
  return (
    <div className="px-4">
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className={
              "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors " +
              (tool === t.key
                ? "bg-coral text-white"
                : "bg-white text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-300")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {tool === "packing" && <PackingList categories={data.packing} />}
      {tool === "budget" && data.budget && (
        <BudgetTracker budget={data.budget} />
      )}
      {tool === "emergency" && (
        <EmergencyCard emergency={data.emergency} hotel={data.hotel} />
      )}
    </div>
  );
}

function SettingsPage() {
  const h = data.hotel;
  return (
    <div className="space-y-4 px-4">
      {h && (
        <section className="rounded-3xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-2 text-[15px] font-bold">🏨 住宿</h2>
          <p className="text-[15px] font-semibold">{h.name}</p>
          <p className="text-[13px] text-neutral-500">{h.nameKr}</p>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <Row k="地址" v={h.address} />
            <Row k="電話" v={h.phone} />
            <Row k="入住" v={h.checkIn} />
            <Row k="退房" v={h.checkOut} />
            <Row k="房型" v={h.room} />
            <Row k="費用" v={h.price} />
          </dl>
        </section>
      )}

      {data.flights && (
        <section className="rounded-3xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-2 text-[15px] font-bold">🧳 旅客</h2>
          <ul className="space-y-1 text-[13px]">
            {data.flights.passengers.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>{p.name}</span>
                <span className="text-neutral-400">{p.type}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <a
        href="https://gist.github.com/jack1118/b022f7b515b9ab6408a8063c7b4e92e7#comments"
        target="_blank"
        rel="noreferrer"
        className="block rounded-3xl bg-white p-4 text-center text-[15px] font-semibold text-busan-blue-deep shadow-sm active:scale-[0.99] dark:bg-neutral-800 dark:text-busan-blue"
      >
        💬 給朋友留言 / 建議
      </a>

      <p className="px-2 text-center text-[12px] text-neutral-400">
        資料來源：{data.generatedFrom} · 釜山去 v0.2（Phase 1-3）
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-12 shrink-0 text-neutral-400">{k}</dt>
      <dd className="flex-1">{v}</dd>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("itinerary");

  return (
    <div className="mx-auto min-h-full max-w-md">
      <Header subtitle={data.subtitle} />

      <main className="pb-[calc(5.5rem+var(--safe-bottom))] pt-2">
        {tab === "itinerary" && <ItineraryPage />}
        {tab === "map" && (
          <Suspense
            fallback={
              <div className="px-4 pt-24 text-center text-[14px] text-neutral-400">
                載入地圖中…
              </div>
            }
          >
            <MapView days={data.days} />
          </Suspense>
        )}
        {tab === "tools" && <ToolsPage />}
        {tab === "settings" && <SettingsPage />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

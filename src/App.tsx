import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppContext } from "./lib/appctx";
import Lightbox from "./components/Lightbox";
import raw from "./data/itinerary.json";
import type { Day, Itinerary, RainPlace, RainPlan, TimelineItem } from "./types";
import TaxiCard from "./components/TaxiCard";
import TabBar, { type TabKey } from "./components/TabBar";
import DaySwitcher from "./components/DaySwitcher";
import { useSwipe } from "./lib/useSwipe";
import { splitToBullets } from "./lib/text";
import Timeline from "./components/Timeline";
import BottomSheet from "./components/BottomSheet";
import RestaurantSheet from "./components/RestaurantSheet";
import FlightCard from "./components/FlightCard";
import WeatherBanner from "./components/WeatherBanner";
import PackingList from "./components/PackingList";
import BudgetTracker from "./components/BudgetTracker";
import EmergencyCard from "./components/EmergencyCard";
import ExportButton from "./components/DayExport";
import ReferenceView from "./components/ReferenceView";
import ShoppingPage from "./components/ShoppingPage";
import PhraseBook from "./components/PhraseBook";
import type { RefNode } from "./types";

// Leaflet (~150KB) only loads when the map tab is opened.
const MapView = lazy(() => import("./components/MapView"));

const data = raw as Itinerary;

function countdownLabel(): string | null {
  const start = new Date("2026-06-26T00:00:00+09:00");
  const end = new Date("2026-06-30T23:59:59+09:00");
  const now = new Date();
  if (now > end) return null;
  const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
  if (days > 0) return `距出發 ${days} 天`;
  return "旅程進行中 🎉";
}

function Header({ subtitle }: { subtitle: string }) {
  const cd = countdownLabel();
  return (
    <div
      className="bg-gradient-to-b from-busan-blue/15 to-transparent px-4 pb-2"
      style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-tight">釜山去</h1>
        {cd && (
          <span className="rounded-full bg-coral px-3 py-1 text-[12px] font-bold text-white shadow-sm shadow-coral/30">
            {cd}
          </span>
        )}
      </div>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
        {subtitle}
      </p>
    </div>
  );
}

function RainPlaceCard({ place }: { place: RainPlace }) {
  const [taxi, setTaxi] = useState(false);
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
      <div className="text-[14px] font-bold">{place.nameZh}</div>
      <div className="text-[13px] font-semibold text-busan-blue-deep dark:text-busan-blue">
        {place.nameKr}
      </div>
      {place.note && (
        <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {place.note}
        </p>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <a
          href={place.maps.naver}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-[#03c75a] py-1.5 text-center text-[12px] font-semibold text-white active:scale-[0.98]"
        >
          📍 Naver
        </a>
        <a
          href={place.maps.google}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-busan-blue py-1.5 text-center text-[12px] font-semibold text-white active:scale-[0.98]"
        >
          🗺 Google
        </a>
        <button
          onClick={() => setTaxi(true)}
          className="rounded-lg bg-neutral-900 py-1.5 text-center text-[12px] font-semibold text-white active:scale-[0.98] dark:bg-neutral-700"
        >
          🚕 給司機
        </button>
      </div>
      <TaxiCard
        open={taxi}
        nameZh={place.nameZh}
        nameKr={place.nameKr}
        mapG={place.maps.google}
        mapN={place.maps.naver}
        onClose={() => setTaxi(false)}
      />
    </div>
  );
}

function RainPlanCard({ plan }: { plan: RainPlan }) {
  return (
    <div className="rounded-2xl bg-busan-blue/10 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[14px] font-bold text-busan-blue-deep dark:text-busan-blue">
        🌧 雨天備案
      </div>
      <ul className="space-y-2">
        {plan.text
          .flatMap((r) =>
            splitToBullets(r.replace(/^雨天備案[\sA-B]*[:：]?\s*/, ""))
          )
          .map((line, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13.5px] leading-relaxed text-neutral-700 dark:text-neutral-200"
            >
              <span className="mt-[1px] shrink-0 text-busan-blue-deep dark:text-busan-blue">
                ·
              </span>
              <span className="min-w-0 flex-1">{line}</span>
            </li>
          ))}
      </ul>
      {plan.places.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[12px] font-semibold text-busan-blue-deep dark:text-busan-blue">
            室內備案地點（韓文 + 地圖）
          </div>
          {plan.places.map((p, i) => (
            <RainPlaceCard key={i} place={p} />
          ))}
        </div>
      )}
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
  const hasRain =
    day.rainPlan.text.length > 0 || day.rainPlan.places.length > 0;

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
        <RainPlanCard plan={day.rainPlan} />
      ) : (
        <>
          <div ref={exportRef} className="bg-appbg pb-1 dark:bg-black">
            <Timeline day={day} onSelect={onSelect} />
          </div>
          {hasRain && <RainPlanCard plan={day.rainPlan} />}
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

// Resolve a timeline stop's recommended-restaurant key to its full food node.
const foodByKey = new Map(
  (data.food?.nodes ?? []).filter((n) => n.key).map((n) => [n.key as string, n])
);

interface PendingStop {
  dayId: string;
  time: string;
  activity: string;
}

function ItineraryPage({
  pendingStop,
  onConsumed,
}: {
  pendingStop: PendingStop | null;
  onConsumed: () => void;
}) {
  const [activeId, setActiveId] = useState(data.days[0]?.id ?? "D1");
  const [dir, setDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<TimelineItem | null>(null);
  const [restaurantKey, setRestaurantKey] = useState<string | null>(null);
  const idx = data.days.findIndex((d) => d.id === activeId);

  // Jump here from a restaurant's schedule badge: switch day + open the stop.
  useEffect(() => {
    if (!pendingStop) return;
    const d = data.days.find((x) => x.id === pendingStop.dayId);
    const it = d?.items.find(
      (i) => i.time === pendingStop.time && i.activity === pendingStop.activity
    );
    if (d) setActiveId(d.id);
    setRestaurantKey(null);
    setSelected(it ?? null);
    onConsumed();
  }, [pendingStop, onConsumed]);
  const day = useMemo(
    () => data.days.find((d) => d.id === activeId) ?? data.days[0],
    [activeId]
  );

  const go = (delta: 1 | -1) => {
    const next = idx + delta;
    if (next < 0 || next >= data.days.length) return;
    setDir(delta);
    setActiveId(data.days[next].id);
  };
  const select = (id: string) => {
    const next = data.days.findIndex((d) => d.id === id);
    if (next === idx) return;
    setDir(next > idx ? 1 : -1);
    setActiveId(id);
  };
  const swipe = useSwipe(
    () => go(1),
    () => go(-1)
  );

  return (
    <div className="px-4">
      {data.flights && (
        <div className="mb-4">
          <FlightCard flights={data.flights} />
        </div>
      )}

      <DaySwitcher days={data.days} activeId={activeId} onSelect={select} />

      <div {...swipe} className="touch-pan-y">
        {day && (
          <div
            key={activeId}
            className={dir === 1 ? "animate-day-next" : "animate-day-prev"}
          >
            <DayView day={day} onSelect={setSelected} />
          </div>
        )}
      </div>

      <BottomSheet
        item={selected}
        onClose={() => setSelected(null)}
        onOpenRestaurant={setRestaurantKey}
      />
      <RestaurantSheet
        node={restaurantKey ? foodByKey.get(restaurantKey) ?? null : null}
        onClose={() => setRestaurantKey(null)}
      />
    </div>
  );
}

// Split the 行程參考 pocket list into themed buckets by section title.
const pocketNodes: RefNode[] = data.pocket?.nodes ?? [];
const byTitle = (re: RegExp) => pocketNodes.filter((n) => re.test(n.title));
const cafeNodes = byTitle(/咖啡廳/);
const spotNodes = byTitle(/景點/);
const airportNodes = byTitle(/機場/);
const shopNodes = pocketNodes.filter(
  (n) => n.title && !/咖啡廳|景點|機場/.test(n.title)
);

function FoodPage() {
  // 必吃美食 + 海景咖啡廳
  const nodes = [...(data.food?.nodes ?? []), ...cafeNodes];
  return (
    <div className="px-4">
      <ReferenceView nodes={nodes} speakable />
    </div>
  );
}

function ShopPage() {
  return <ShoppingPage shopping={data.shopping} moreNodes={shopNodes} />;
}

type ToolKey =
  | "phrases"
  | "packing"
  | "budget"
  | "emergency"
  | "spots"
  | "exhibitions"
  | "pretrip"
  | "airport"
  | "info";

function ToolsPage() {
  const [tool, setTool] = useState<ToolKey>("phrases");
  const tabs: { key: ToolKey; label: string }[] = [
    { key: "phrases", label: "💬 韓文" },
    { key: "packing", label: "🧳 打包" },
    { key: "budget", label: "💰 預算" },
    { key: "emergency", label: "🚨 緊急" },
    { key: "spots", label: "📍 景點" },
    { key: "exhibitions", label: "🎨 展覽" },
    { key: "pretrip", label: "📋 須知" },
    { key: "airport", label: "✈️ 機場" },
    { key: "info", label: "ℹ️ 資訊" },
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
      {tool === "phrases" && <PhraseBook />}
      {tool === "packing" && <PackingList categories={data.packing} />}
      {tool === "budget" && data.budget && (
        <BudgetTracker budget={data.budget} />
      )}
      {tool === "emergency" && (
        <EmergencyCard emergency={data.emergency} hotel={data.hotel} />
      )}
      {tool === "spots" && <ReferenceView nodes={spotNodes} speakable />}
      {tool === "exhibitions" && (
        <ReferenceView nodes={data.exhibitions?.nodes ?? []} />
      )}
      {tool === "pretrip" && (
        <ReferenceView nodes={data.preTrip?.nodes ?? []} />
      )}
      {tool === "airport" && <ReferenceView nodes={airportNodes} />}
      {tool === "info" && <InfoSection />}
    </div>
  );
}

function InfoSection() {
  const h = data.hotel;
  return (
    <div className="space-y-4">
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
        資料來源：{data.generatedFrom} · 釜山去 v0.3
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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pendingStop, setPendingStop] = useState<PendingStop | null>(null);

  const clearPendingStop = useCallback(() => setPendingStop(null), []);
  const goToStop = useCallback(
    (dayId: string, time: string, activity: string) => {
      setTab("itinerary");
      setPendingStop({ dayId, time, activity });
    },
    []
  );
  const ctx = useMemo(
    () => ({ openLightbox: setLightbox, goToStop }),
    [goToStop]
  );

  return (
    <AppContext.Provider value={ctx}>
      <div className="mx-auto flex h-[100dvh] max-w-md flex-col">
        <Header subtitle={data.subtitle} />

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pt-2">
          {tab === "itinerary" && (
            <ItineraryPage
              pendingStop={pendingStop}
              onConsumed={clearPendingStop}
            />
          )}
          {tab === "food" && <FoodPage />}
          {tab === "shop" && <ShopPage />}
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
        </main>

        <TabBar active={tab} onChange={setTab} />
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </AppContext.Provider>
  );
}

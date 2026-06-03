import { useState } from "react";
import type { RefNode, Shopping, ShopProduct, Venue } from "../types";
import ReferenceView from "./ReferenceView";

// public/ assets must be prefixed with the deploy base path.
const asset = (src: string) =>
  src.startsWith("http") ? src : import.meta.env.BASE_URL + src;

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 1500);
  };
  return { msg, show };
}

function copy(text: string, ok: () => void) {
  navigator.clipboard?.writeText(text).then(ok, () => {});
}

function groupBy<T>(arr: T[], key: (t: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of arr) {
    const k = key(it);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return [...map.entries()];
}

// Fullscreen "show this to staff" view: big photo + huge Korean name.
function ProductViewer({
  product,
  onClose,
}: {
  product: ShopProduct;
  onClose: () => void;
}) {
  const { msg, show } = useToast();
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-black px-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))] text-white">
      <p className="text-center text-[15px] text-neutral-300">
        {product.nameZh}
      </p>
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5">
        {product.img && (
          <img
            src={asset(product.img)}
            alt={product.nameZh}
            className="max-h-[45vh] w-auto rounded-2xl bg-white object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <p className="text-center text-4xl font-extrabold leading-tight">
          {product.nameKr}
        </p>
        {(product.store || product.price) && (
          <p className="text-center text-[15px] text-neutral-400">
            {product.store}
            {product.store && product.price ? " · " : ""}
            {product.price}
          </p>
        )}
      </div>
      {msg && (
        <div className="mb-3 rounded-full bg-white/90 px-4 py-1.5 text-[13px] font-semibold text-black">
          {msg}
        </div>
      )}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={() => copy(product.nameKr, () => show("已複製韓文名！"))}
          className="rounded-2xl bg-coral py-3 text-[15px] font-semibold active:scale-[0.98]"
        >
          📋 複製韓文名給店員
        </button>
        <button
          onClick={onClose}
          className="rounded-2xl bg-neutral-800 py-3 text-[15px] font-semibold text-neutral-200 active:scale-[0.98]"
        >
          關閉
        </button>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: ShopProduct;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] active:scale-[0.98] dark:bg-neutral-800 dark:ring-white/5"
    >
      <div className="grid aspect-square w-full place-items-center overflow-hidden bg-neutral-100 dark:bg-neutral-700">
        {product.img ? (
          <img
            src={asset(product.img)}
            alt={product.nameZh}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="text-3xl">🛍</span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-[14px] font-semibold leading-tight">
          {product.nameZh}
        </div>
        <div className="mt-0.5 text-[13px] font-medium text-busan-blue-deep dark:text-busan-blue">
          {product.nameKr}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
          <span>{product.store}</span>
          <span>{product.price}</span>
        </div>
      </div>
    </button>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const { msg, show } = useToast();
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
      <div className="text-[15px] font-bold">{venue.nameZh}</div>
      <button
        onClick={() => copy(venue.nameKr, () => show("已複製！給司機/店員看"))}
        className="mt-0.5 text-[14px] font-medium text-busan-blue-deep active:opacity-60 dark:text-busan-blue"
      >
        {venue.nameKr} 📋
      </button>
      {venue.note && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {venue.note}
        </p>
      )}
      <div className="mt-2.5 flex gap-2">
        <a
          href={venue.mapG}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-xl bg-busan-blue py-2 text-center text-[13px] font-semibold text-white active:scale-[0.98]"
        >
          🗺 Google
        </a>
        <a
          href={venue.mapN}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-xl bg-[#03c75a] py-2 text-center text-[13px] font-semibold text-white active:scale-[0.98]"
        >
          📍 Naver
        </a>
      </div>
      {msg && (
        <div className="mt-2 text-center text-[12px] font-semibold text-coral">
          {msg}
        </div>
      )}
    </div>
  );
}

export default function ShoppingPage({
  shopping,
  moreNodes,
}: {
  shopping: Shopping;
  moreNodes: RefNode[];
}) {
  const [view, setView] = useState<"products" | "venues" | "more">("products");
  const [opened, setOpened] = useState<ShopProduct | null>(null);

  const tabs: { key: typeof view; label: string }[] = [
    { key: "products", label: "🛍 必買商品" },
    { key: "venues", label: "📍 購物地點" },
    { key: "more", label: "📖 更多介紹" },
  ];

  return (
    <div className="px-4">
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={
              "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors " +
              (view === t.key
                ? "bg-coral text-white"
                : "bg-white text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-300")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "products" && (
        <>
          <p className="mb-3 rounded-xl bg-busan-blue/10 px-3 py-2 text-[12.5px] text-busan-blue-deep dark:text-busan-blue">
            💡 點商品看大圖 + 韓文名，拿給店員找最快
          </p>
          {groupBy(shopping.products, (p) => p.category).map(([cat, items]) => (
            <section key={cat} className="mb-4">
              <h3 className="mb-2 text-[14px] font-bold text-neutral-500 dark:text-neutral-400">
                {cat}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map((p) => (
                  <ProductCard
                    key={p.slug}
                    product={p}
                    onOpen={() => setOpened(p)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {view === "venues" &&
        groupBy(shopping.venues, (v) => v.category).map(([cat, items]) => (
          <section key={cat} className="mb-4">
            <h3 className="mb-2 text-[14px] font-bold text-neutral-500 dark:text-neutral-400">
              {cat}
            </h3>
            <div className="space-y-3">
              {items.map((v, i) => (
                <VenueCard key={i} venue={v} />
              ))}
            </div>
          </section>
        ))}

      {view === "more" && <ReferenceView nodes={moreNodes} withTabs />}

      {opened && (
        <ProductViewer product={opened} onClose={() => setOpened(null)} />
      )}
    </div>
  );
}

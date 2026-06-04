import { useState } from "react";
import type { Block, MapLinks, RefNode } from "../types";
import TaxiCard from "./TaxiCard";

function firstKorean(text: string): string | null {
  const m = text.match(/[가-힣][가-힣\s·,()]*[가-힣]/);
  return m ? m[0].trim() : null;
}

// Prefer the full official Korean name embedded in the node's Naver link query
// (the md author put the complete name there) over a partial title extraction.
function nodeKorean(node: RefNode): string | null {
  const nav = node.maps?.naver;
  if (nav) {
    const m = nav.match(/search\/([^?]+)/);
    if (m) {
      try {
        const dec = decodeURIComponent(m[1]);
        if (/[가-힣]/.test(dec)) return dec;
      } catch {
        /* fall through */
      }
    }
  }
  return firstKorean(node.title);
}

function MapButtons({ maps }: { maps: MapLinks | null | undefined }) {
  if (!maps || (!maps.google && !maps.naver)) return null;
  return (
    <div className="mt-2 flex gap-2">
      {maps.google && (
        <a
          href={maps.google}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-busan-blue/15 px-3 py-1 text-[12px] font-semibold text-busan-blue-deep dark:text-busan-blue"
        >
          🗺 Google
        </a>
      )}
      {maps.naver && (
        <a
          href={maps.naver}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#03c75a]/15 px-3 py-1 text-[12px] font-semibold text-[#03a64a]"
        >
          📍 Naver
        </a>
      )}
    </div>
  );
}

const asset = (src: string) =>
  src.startsWith("http") ? src : import.meta.env.BASE_URL + src;

function Thumb({ src }: { src: string }) {
  return (
    <img
      src={asset(src)}
      alt=""
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

// Horizontal strip of real food photos for a store (Google Places).
function Gallery({ photos }: { photos: string[] }) {
  return (
    <div className="no-scrollbar -mx-1 my-2 flex gap-2 overflow-x-auto px-1">
      {photos.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className="h-32 w-44 shrink-0 rounded-2xl object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
}

function MiniMaps({ maps }: { maps?: MapLinks | null }) {
  if (!maps || (!maps.google && !maps.naver)) return null;
  return (
    <div className="mt-1 flex gap-1.5">
      {maps.naver && (
        <a
          href={maps.naver}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-[#03c75a]/15 px-2 py-0.5 text-[11px] font-semibold text-[#03a64a]"
        >
          📍 N
        </a>
      )}
      {maps.google && (
        <a
          href={maps.google}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-busan-blue/15 px-2 py-0.5 text-[11px] font-semibold text-busan-blue-deep dark:text-busan-blue"
        >
          🗺 G
        </a>
      )}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "image":
      return (
        <img
          src={block.url}
          alt={block.alt || ""}
          loading="lazy"
          className="my-2 max-h-56 w-full rounded-2xl object-cover"
        />
      );
    case "subheading":
      return (
        <div className="mt-3">
          <h4 className="text-[15px] font-bold">{block.text}</h4>
          <MapButtons maps={block.maps} />
        </div>
      );
    case "note":
      return (
        <p className="my-2 rounded-xl bg-busan-blue/10 px-3 py-2 text-[13px] leading-relaxed text-busan-blue-deep dark:text-busan-blue">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="my-1.5 space-y-2">
          {block.items?.map((it, i) => (
            <li key={i} className="flex gap-2.5">
              {it.photo ? (
                <Thumb src={it.photo} />
              ) : (
                <span className="mt-0.5 text-busan-blue-deep dark:text-busan-blue">
                  ·
                </span>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {it.text}
                </span>
                <MiniMaps maps={it.maps} />
              </div>
            </li>
          ))}
        </ul>
      );
    case "table": {
      const meta = block.rowsMeta || [];
      const hasMeta = meta.some((m) => m && (m.photo || m.maps));
      return (
        <div className="my-2 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-neutral-400">
                {block.headers?.map((h, i) => (
                  <th key={i} className="py-1 pr-3 font-medium">
                    {h}
                  </th>
                ))}
                {hasMeta && <th className="py-1 font-medium">圖／地圖</th>}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, ri) => {
                const m = meta[ri];
                return (
                  <tr
                    key={ri}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    {row.map((c, ci) => (
                      <td
                        key={ci}
                        className={
                          "py-1.5 pr-3 align-top " +
                          (ci === 0
                            ? "font-medium text-neutral-800 dark:text-neutral-100"
                            : "text-neutral-500 dark:text-neutral-400")
                        }
                      >
                        {c}
                      </td>
                    ))}
                    {hasMeta && (
                      <td className="py-1.5 align-top">
                        {m?.photo && <Thumb src={m.photo} />}
                        <MiniMaps maps={m?.maps} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    default:
      return (
        <p className="my-1.5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {block.text}
          <MapButtons maps={block.maps} />
        </p>
      );
  }
}

function NodeCard({
  node,
  speakable,
}: {
  node: RefNode;
  speakable?: boolean;
}) {
  const [taxiOpen, setTaxiOpen] = useState(false);
  const kr = speakable ? nodeKorean(node) : null;
  return (
    <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
      {node.title && (
        <div className="mb-1">
          <h3 className="text-[16px] font-bold leading-snug">{node.title}</h3>
          <MapButtons maps={node.maps} />
        </div>
      )}
      {node.gallery && node.gallery.length > 0 && (
        <Gallery photos={node.gallery} />
      )}
      {node.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      {kr && (
        <button
          onClick={() => setTaxiOpen(true)}
          className="mt-2 w-full rounded-2xl bg-neutral-900 py-2.5 text-[14px] font-semibold text-white active:scale-[0.99] dark:bg-neutral-700"
        >
          🚕 給司機 / 店員看（韓文）
        </button>
      )}
      {kr && (
        <TaxiCard
          open={taxiOpen}
          nameZh={node.title}
          nameKr={kr}
          mapG={
            node.maps?.google ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              kr
            )}`
          }
          mapN={`https://map.naver.com/p/search/${encodeURIComponent(kr)}`}
          onClose={() => setTaxiOpen(false)}
        />
      )}
    </section>
  );
}

export default function ReferenceView({
  nodes,
  withTabs = false,
  speakable = false,
}: {
  nodes: RefNode[];
  withTabs?: boolean;
  speakable?: boolean;
}) {
  const visible = nodes.filter(
    (n) => n.title || n.blocks.some((b) => b.type !== "text" || b.text)
  );
  const [active, setActive] = useState(0);

  if (!visible.length) {
    return (
      <p className="px-4 pt-16 text-center text-[14px] text-neutral-400">
        （此區段沒有內容）
      </p>
    );
  }

  if (withTabs) {
    const titled = visible.filter((n) => n.title);
    const intro = visible.find((n) => !n.title);
    const current = titled[Math.min(active, titled.length - 1)];
    return (
      <div>
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {titled.map((n, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors " +
                (i === active
                  ? "bg-coral text-white"
                  : "bg-white text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-300")
              }
            >
              {n.title.replace(/（.*?）/g, "").slice(0, 12)}
            </button>
          ))}
        </div>
        {intro && active === 0 && <NodeCard node={intro} speakable={speakable} />}
        {current && <NodeCard node={current} speakable={speakable} />}
      </div>
    );
  }

  return (
    <div>
      {visible.map((n, i) => (
        <NodeCard key={i} node={n} speakable={speakable} />
      ))}
    </div>
  );
}

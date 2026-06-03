import { useState } from "react";
import type { Block, MapLinks, RefNode } from "../types";

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
        <ul className="my-1.5 space-y-1">
          {block.items?.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300"
            >
              <span className="text-busan-blue-deep dark:text-busan-blue">·</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "table":
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
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, ri) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return (
        <p className="my-1.5 text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {block.text}
          <MapButtons maps={block.maps} />
        </p>
      );
  }
}

function NodeCard({ node }: { node: RefNode }) {
  return (
    <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5">
      {node.title && (
        <div className="mb-1">
          <h3 className="text-[16px] font-bold leading-snug">{node.title}</h3>
          <MapButtons maps={node.maps} />
        </div>
      )}
      {node.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </section>
  );
}

export default function ReferenceView({
  nodes,
  withTabs = false,
}: {
  nodes: RefNode[];
  withTabs?: boolean;
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
        {intro && active === 0 && <NodeCard node={intro} />}
        {current && <NodeCard node={current} />}
      </div>
    );
  }

  return (
    <div>
      {visible.map((n, i) => (
        <NodeCard key={i} node={n} />
      ))}
    </div>
  );
}

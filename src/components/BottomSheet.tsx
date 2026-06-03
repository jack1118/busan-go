import { useEffect, useState } from "react";
import type { TimelineItem } from "../types";
import { ICON_EMOJI, ICON_LABEL } from "../types";
import QRViewer from "./QRViewer";
import TaxiCard from "./TaxiCard";

function slug(s: string) {
  return s.replace(/[^\w一-龥가-힣]+/g, "-").slice(0, 40);
}

export default function BottomSheet({
  item,
  onClose,
}: {
  item: TimelineItem | null;
  onClose: () => void;
}) {
  // Keep the last item mounted during the close animation.
  const [shown, setShown] = useState<TimelineItem | null>(item);
  const [qrOpen, setQrOpen] = useState(false);
  const [taxiOpen, setTaxiOpen] = useState(false);
  useEffect(() => {
    if (item) setShown(item);
  }, [item]);

  const open = !!item;
  const data = item ?? shown;

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!data) return null;

  return (
    <div
      className={
        "fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-300 " +
        (open ? "opacity-100" : "pointer-events-none opacity-0")
      }
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* sheet */}
      <div
        className={
          "relative w-full max-w-md rounded-t-3xl bg-white pb-[calc(1.25rem+var(--safe-bottom))] shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-900 " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        onTransitionEnd={() => {
          if (!open) setShown(null);
        }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 pt-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-busan-blue/15 text-lg">
              {ICON_EMOJI[data.icon]}
            </span>
            <span className="rounded-full bg-busan-blue/15 px-2.5 py-0.5 text-[12px] font-medium text-busan-blue-deep dark:text-busan-blue">
              {ICON_LABEL[data.icon]}
            </span>
            <span className="ml-auto text-[13px] font-semibold tabular-nums text-neutral-400">
              {data.time}
            </span>
          </div>

          <h2 className="text-[20px] font-bold leading-snug">
            {data.activity}
          </h2>

          {data.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.tags.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-coral/10 px-2.5 py-1 text-[12px] font-medium text-coral-deep dark:text-coral"
                >
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>
          )}

          {data.note && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              {data.note}
            </p>
          )}

          {(data.voucher || data.coord || /[가-힣]/.test(data.activity)) && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {data.voucher && (
                <button
                  onClick={() => setQrOpen(true)}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-coral py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
                >
                  🎫 出示憑證 / QR
                </button>
              )}
              <button
                onClick={() => setTaxiOpen(true)}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-neutral-900 py-3 text-[15px] font-semibold text-white active:scale-[0.98] dark:bg-neutral-700"
              >
                🚕 放大地址給司機看
              </button>
            </div>
          )}

          {data.maps && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {data.maps.google && (
                <a
                  href={data.maps.google}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-busan-blue py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
                >
                  🗺 Google Maps
                </a>
              )}
              {data.maps.naver && (
                <a
                  href={data.maps.naver}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#03c75a] py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
                >
                  📍 Naver Map
                </a>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-3 w-full rounded-2xl bg-neutral-100 py-3 text-[15px] font-semibold text-neutral-600 active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-300"
          >
            關閉
          </button>
        </div>
      </div>

      <QRViewer
        open={qrOpen}
        label={data.activity}
        code={data.voucher?.code || undefined}
        storageKey={`busan:voucher:${slug(data.activity)}`}
        onClose={() => setQrOpen(false)}
      />
      <TaxiCard
        open={taxiOpen}
        name={data.coord?.name || data.activity}
        address={data.coord ? data.activity : undefined}
        onClose={() => setTaxiOpen(false)}
      />
    </div>
  );
}

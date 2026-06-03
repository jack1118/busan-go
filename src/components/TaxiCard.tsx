import { useState } from "react";

// Full-screen card to show a taxi driver. Korean is primary (the driver reads
// 한글); Chinese is secondary (so the traveller knows what it is). Includes the
// Korean address and Google/Naver map links.
export default function TaxiCard({
  open,
  nameZh,
  nameKr,
  addr,
  mapG,
  mapN,
  onClose,
}: {
  open: boolean;
  nameZh: string;
  nameKr?: string | null;
  addr?: string | null;
  mapG?: string;
  mapN?: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  if (!open) return null;

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1500);
  };
  const copyText = [nameKr, addr].filter(Boolean).join("\n") || nameZh;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white px-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))] text-neutral-900">
      <p className="text-center text-[14px] font-medium text-neutral-400">
        🚕 請出示給司機看 · 기사님께 보여주세요
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {nameKr ? (
          <>
            <p className="text-center text-5xl font-black leading-tight tracking-tight">
              {nameKr}
            </p>
            {addr && (
              <p className="text-center text-2xl font-bold leading-snug text-neutral-700">
                {addr}
              </p>
            )}
            <p className="mt-1 text-center text-[15px] text-neutral-400">
              （{nameZh}）
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-4xl font-black leading-tight">
              {nameZh}
            </p>
            <p className="text-center text-[14px] text-neutral-400">
              此地點沒有韓文名，請用下方地圖出示位置
            </p>
          </>
        )}
      </div>

      {toast && (
        <div className="mb-3 self-center rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(mapG || mapN) && (
          <div className="grid grid-cols-2 gap-3">
            {mapN && (
              <a
                href={mapN}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#03c75a] py-3.5 text-center text-[16px] font-bold text-white active:scale-[0.98]"
              >
                📍 Naver 地圖
              </a>
            )}
            {mapG && (
              <a
                href={mapG}
                target="_blank"
                rel="noreferrer"
                className={
                  "rounded-2xl bg-busan-blue py-3.5 text-center text-[16px] font-bold text-white active:scale-[0.98] " +
                  (mapN ? "" : "col-span-2")
                }
              >
                🗺 Google 地圖
              </a>
            )}
          </div>
        )}
        <button
          onClick={() =>
            navigator.clipboard
              ?.writeText(copyText)
              .then(() => showToast("已複製！"), () => {})
          }
          className="rounded-2xl bg-coral py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
        >
          📋 複製韓文地址
        </button>
        <button
          onClick={onClose}
          className="rounded-2xl bg-neutral-100 py-3 text-[15px] font-semibold text-neutral-600 active:scale-[0.98]"
        >
          關閉
        </button>
      </div>
    </div>
  );
}

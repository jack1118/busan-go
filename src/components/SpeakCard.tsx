import { useState } from "react";

// Full-screen "show this to a local" card: big Korean primary, Chinese
// secondary, romanization to attempt pronunciation, and a copy button.
export default function SpeakCard({
  open,
  zh,
  kr,
  rr,
  onClose,
}: {
  open: boolean;
  zh: string;
  kr: string;
  rr?: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white px-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))] text-neutral-900">
      <p className="text-center text-[14px] font-medium text-neutral-400">
        出示給對方看 · 상대방에게 보여주세요
      </p>
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <p className="text-center text-[17px] text-neutral-500">{zh}</p>
        <p className="text-center text-[40px] font-black leading-tight tracking-tight">
          {kr}
        </p>
        {rr && (
          <p className="text-center text-[16px] italic text-neutral-400">
            {rr}
          </p>
        )}
      </div>
      {toast && (
        <div className="mb-3 self-center rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-semibold text-white">
          已複製！
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button
          onClick={() =>
            navigator.clipboard?.writeText(kr).then(
              () => {
                setToast(true);
                window.setTimeout(() => setToast(false), 1500);
              },
              () => {}
            )
          }
          className="rounded-2xl bg-coral py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
        >
          📋 複製韓文
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

import { useEffect, useState } from "react";

export default function TaxiCard({
  open,
  name,
  address,
  onClose,
}: {
  open: boolean;
  name: string;
  address?: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState(false);

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Auto-hide the copied toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!open) return null;

  function copy() {
    const text = `${name}\n${address ?? ""}`.trim();
    navigator.clipboard.writeText(text).then(() => setToast(true));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 py-8 text-white">
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="text-4xl font-bold leading-snug">{name}</p>
        {address && (
          <p className="mt-6 text-2xl leading-relaxed">{address}</p>
        )}
      </div>

      <div className="mt-6 flex w-full max-w-md flex-col gap-3">
        <button
          onClick={copy}
          className="rounded-2xl bg-busan-blue py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
        >
          📋 複製
        </button>
        <button
          onClick={onClose}
          className="rounded-2xl bg-neutral-800 py-3 text-[15px] font-semibold text-neutral-200 active:scale-[0.98]"
        >
          關閉
        </button>
      </div>

      {toast && (
        <div className="absolute bottom-24 rounded-full bg-coral px-5 py-2 text-[15px] font-semibold text-white shadow-lg">
          已複製！
        </div>
      )}
    </div>
  );
}

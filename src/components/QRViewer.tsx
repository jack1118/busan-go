import { useEffect, useRef, useState } from "react";

export default function QRViewer({
  open,
  label,
  code,
  storageKey,
  onClose,
}: {
  open: boolean;
  label: string;
  code?: string;
  storageKey: string;
  onClose: () => void;
}) {
  const [stored, setStored] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load any persisted image when opened.
  useEffect(() => {
    if (!open) return;
    setStored(localStorage.getItem(storageKey));
  }, [open, storageKey]);

  // Generate a QR code when there is no stored image but a code is given.
  useEffect(() => {
    if (!open || stored || !code) {
      setQr(null);
      return;
    }
    let alive = true;
    // Dynamic import keeps the qrcode lib out of the initial bundle.
    import("qrcode")
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(code, { margin: 1, width: 512 })
      )
      .then((url) => {
        if (alive) setQr(url);
      })
      .catch(() => {
        if (alive) setQr(null);
      });
    return () => {
      alive = false;
    };
  }, [open, stored, code]);

  // Lock background scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      localStorage.setItem(storageKey, url);
      setStored(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removeImage() {
    localStorage.removeItem(storageKey);
    setStored(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 py-8 text-white">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <p className="mb-4 text-center text-lg font-semibold">{label}</p>

      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        {stored ? (
          <img
            src={stored}
            alt={label}
            className="max-h-[60vh] w-full rounded-2xl object-contain"
          />
        ) : qr ? (
          <div className="rounded-2xl bg-white p-5">
            <img src={qr} alt={label} className="h-64 w-64" />
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-400">
            尚未上傳憑證圖片，請點下方「上傳圖片」。
          </p>
        )}
      </div>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-neutral-300">
        📱 請手動將螢幕亮度調到最大，方便掃描／出示
      </p>

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3">
        {stored ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl bg-busan-blue py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
            >
              更換圖片
            </button>
            <button
              onClick={removeImage}
              className="rounded-2xl bg-neutral-700 py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
            >
              移除
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl bg-busan-blue py-3 text-[15px] font-semibold text-white active:scale-[0.98]"
          >
            上傳圖片
          </button>
        )}

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

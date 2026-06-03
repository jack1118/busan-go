import { useState } from "react";

export async function exportElement(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  // Dynamic import keeps html2canvas (~200KB) out of the initial bundle.
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#F5F5F7",
    useCORS: true,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) return;

  const file = new File([blob], filename, { type: "image/png" });

  // Prefer the native share sheet when it can handle files.
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      // User cancelled or share failed — fall back to download.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportButton({
  targetRef,
  filename,
  className,
}: {
  targetRef: { current: HTMLElement | null };
  filename: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const el = targetRef.current;
    if (!el || busy) return;
    setBusy(true);
    try {
      await exportElement(el, filename);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={className}
    >
      {busy ? "匯出中…" : "🖼 匯出此日行程圖"}
    </button>
  );
}

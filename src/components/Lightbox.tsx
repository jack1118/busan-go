import { useEffect } from "react";

// Full-screen image viewer. Tap anywhere (or the ✕) to close.
export default function Lightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = src ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="關閉"
        className="absolute right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl text-white backdrop-blur"
        style={{ top: "calc(var(--safe-top) + 0.75rem)" }}
      >
        ✕
      </button>
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

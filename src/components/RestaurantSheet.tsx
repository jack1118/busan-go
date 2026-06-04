import { useEffect, useState } from "react";
import type { RefNode } from "../types";
import { NodeCard } from "./ReferenceView";

// Bottom sheet that shows a restaurant's full 美食-tab card (gallery + dishes +
// maps + 給司機). Opened by tapping a recommended store on a timeline stop.
export default function RestaurantSheet({
  node,
  onClose,
}: {
  node: RefNode | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState<RefNode | null>(node);
  useEffect(() => {
    if (node) setShown(node);
  }, [node]);

  const open = !!node;
  const data = node ?? shown;
  if (!data) return null;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 " +
        (open ? "opacity-100" : "pointer-events-none opacity-0")
      }
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={
          "relative w-full max-w-md rounded-t-3xl bg-appbg pb-[calc(1rem+var(--safe-bottom))] shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-900 " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        onTransitionEnd={() => {
          if (!open) setShown(null);
        }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 pt-3">
          <NodeCard node={data} speakable />
          <button
            onClick={onClose}
            className="mb-1 w-full rounded-2xl bg-neutral-100 py-3 text-[15px] font-semibold text-neutral-600 active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-300"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

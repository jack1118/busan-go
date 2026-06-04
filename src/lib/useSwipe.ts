import { useRef } from "react";

// Horizontal-swipe detector for day switching. Fires onLeft / onRight only when
// the gesture is clearly horizontal (|dx| > THRESHOLD and |dx| > |dy| * RATIO),
// so it never hijacks vertical scrolling of the timeline.
const THRESHOLD = 60; // px
const RATIO = 1.5;

export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * RATIO)
        return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}

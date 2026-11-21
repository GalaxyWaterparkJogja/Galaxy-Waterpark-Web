"use client";

import { useEffect } from "react";
import type { EmblaCarouselType } from "embla-carousel";

/** Feed wheel distance into Embla's loop physics instead of a finite DOM scroll range. */
export function useReviewWheel(api: EmblaCarouselType | undefined) {
  useEffect(() => {
    if (!api) return;
    const root = api.rootNode();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    function wheel(event: WheelEvent) {
      // Preserve browser pinch-to-zoom and let a non-overflowing rail scroll the page.
      if (event.ctrlKey || (!api!.canScrollNext() && !api!.canScrollPrev())) return;
      const distance = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      if (!distance) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientWidth : 1;
      const delta = Math.max(-root.clientWidth, Math.min(root.clientWidth, distance * unit));
      event.preventDefault();

      // Embla 8's plugin API keeps its target, inertia and looping translations in sync.
      // Fractional trackpad deltas stay fractional; mouse-wheel impulses ease to the target.
      const engine = api!.internalEngine();
      engine.scrollBody.useBaseFriction().useDuration(reducedMotion.matches ? 0 : 20);
      engine.scrollTo.distance(-delta, false);
    }

    root.addEventListener("wheel", wheel, { passive: false });
    return () => root.removeEventListener("wheel", wheel);
  }, [api]);
}

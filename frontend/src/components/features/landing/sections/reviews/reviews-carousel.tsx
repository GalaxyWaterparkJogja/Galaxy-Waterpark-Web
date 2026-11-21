"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { LandingCarouselLabels } from "@/types/landing";
import styles from "./reviews.module.css";
import { useReviewWheel } from "./use-review-wheel";

export function ReviewsCarousel({ children, label, labels }: {
  children: ReactNode;
  label: string;
  labels: LandingCarouselLabels;
}) {
  const items = Children.toArray(children);
  const looping = items.length > 1;
  const [viewport, api] = useEmblaCarousel({
    loop: looping,
    align: "center",
    startIndex: Math.min(1, Math.max(0, items.length - 1)),
    containScroll: false,
    dragFree: true,
    skipSnaps: true,
    breakpoints: {
      "(min-width: 600px)": { align: "start", startIndex: 0 },
      "(prefers-reduced-motion: reduce)": { duration: 0 },
    },
  });
  useReviewWheel(api);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    if (!api) return;
    function sync() {
      setScrollable(api!.canScrollNext() || api!.canScrollPrev());
    }
    sync();
    api.on("reInit", sync);
    return () => { api.off("reInit", sync); };
  }, [api]);

  // Small sets need extra room to loop when three cards fit on desktop.
  // Ten-review fixtures render once; any required copies stay hidden and inert.
  const copies = looping && items.length < 4 ? [0, 1] : [0];
  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={viewport}
        className={styles.viewport}
        tabIndex={scrollable ? 0 : undefined}
        aria-label={`${label}. ${labels.instructions}`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !scrollable) return;
          const jump = matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            if (event.key === "ArrowRight") api?.scrollNext(jump);
            else api?.scrollPrev(jump);
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            api?.scrollTo(event.key === "Home" ? 0 : items.length - 1, jump);
          }
        }}
      >
        <div className={styles.track}>
          {copies.flatMap((copy) => items.map((item, index) => (
            <div
              key={`${copy}/${index}`}
              className={styles.slide}
              aria-hidden={copy ? true : undefined}
              inert={copy ? true : undefined}
            >
              {item}
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}

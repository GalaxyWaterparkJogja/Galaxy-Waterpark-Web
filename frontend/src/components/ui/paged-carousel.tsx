"use client";

import { Children, useId, type ReactNode } from "react";
import { useScrollCarousel } from "./use-scroll-carousel";
import styles from "./paged-carousel.module.css";

type Props = {
  label: string;
  labels: { page: string; instructions: string };
  children: ReactNode;
  trackClassName?: string;
  paginationClassName?: string;
  initialPage?: number;
};

/** A rail paged across its available scroll range, with caller-owned card layout. */
export function PagedCarousel({
  label,
  labels,
  children,
  trackClassName = "",
  paginationClassName = "",
  initialPage = 0,
}: Props) {
  const { track, active, pages, goTo, onKeyDown } = useScrollCarousel({
    navigation: "pages",
    itemCount: Children.count(children),
    initialPage,
  });
  const trackId = useId();

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
    >
      <div
        className={`${styles.track} flex ${trackClassName}`}
        id={trackId}
        tabIndex={pages > 1 ? 0 : undefined}
        ref={track}
        aria-label={pages > 1 ? `${label}. ${labels.instructions}` : label}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
      {pages > 1 && (
        <div
          className={`${styles.pagination} flex justify-center ${paginationClassName}`}
          aria-label={label}
        >
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${label}, ${labels.page} ${index + 1}`}
              aria-controls={trackId}
              aria-current={active === index ? "true" : undefined}
              onClick={() => goTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

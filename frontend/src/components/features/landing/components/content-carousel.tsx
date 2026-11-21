"use client";

import { Children, useId, type ReactNode } from "react";
import Link from "next/link";
import { useScrollCarousel } from "@/components/ui/use-scroll-carousel";
import type { LandingAction, LandingCarouselLabels } from "@/types/landing";
import { DesignAsset } from "./design-asset";
import styles from "./content-carousel.module.css";

type Props = {
  label: string;
  labels: LandingCarouselLabels;
  children: ReactNode;
  className?: string;
  trackClassName: string;
  slideClassName?: string;
} & (
  | { loop?: false; endAction?: LandingAction }
  | { loop: true; endAction?: never }
);

export function ContentCarousel({
  label,
  labels,
  children,
  className = "",
  trackClassName,
  slideClassName = "",
  loop = false,
  endAction,
}: Props) {
  const items = Children.toArray(children);
  const count = items.length + (endAction ? 1 : 0);
  const repeating = loop && count > 1;
  const { track, scrollable, onKeyDown } = useScrollCarousel({
    navigation: "slides",
    itemCount: count,
    loop: repeating,
  });
  const trackId = useId();

  const copies = repeating ? [0, 1, 2] : [0];
  return (
    <div
      className={className}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        ref={track}
        id={trackId}
        data-single={items.length <= 1 ? true : undefined}
        className={`${styles.track} ${trackClassName}`}
        tabIndex={scrollable ? 0 : undefined}
        aria-label={`${label}. ${labels.instructions}`}
        onKeyDown={onKeyDown}
      >
        {copies.flatMap((copy) =>
          items.map((child, index) => (
            <div
              key={`${copy}-${index}`}
              className={`${styles.slide} ${slideClassName}`}
              aria-hidden={repeating && copy !== 1 ? true : undefined}
              inert={repeating && copy !== 1 ? true : undefined}
            >
              {child}
            </div>
          )),
        )}
        {endAction && (
          <div
            className={`${styles.slide} ${slideClassName} ${styles.endSlide}`}
          >
            <Link className={styles.moreLink} href={endAction.href}>
              <DesignAsset name="more" />
              {endAction.mobile_label ?? endAction.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

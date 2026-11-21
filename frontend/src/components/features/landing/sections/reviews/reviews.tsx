import Link from "next/link";
import type {
  LandingAction,
  LandingCarouselLabels,
  LandingReview,
} from "@/types/landing";
import { SectionHeading } from "../../components/section-heading";
import { LandingReveal } from "../../components/landing-reveal";
import { ReviewsInteractiveList } from "./reviews-list";
import styles from "./reviews.module.css";
import {
  sectionFrameClassName,
  desktopSectionFrameClassName,
} from "../../lib/section-frame";

export function Reviews({
  title,
  items,
  action,
  carouselLabels,
  ratingSuffix,
}: {
  title: string;
  items: LandingReview[];
  action: LandingAction;
  carouselLabels: LandingCarouselLabels;
  ratingSuffix: string;
}) {
  if (!items.length) return null;
  return (
    <section
      id="reviews"
      className={styles.section}
      aria-labelledby="reviews-heading"
    >
      <div className={sectionFrameClassName}>
        <SectionHeading id="reviews-heading" title={title} centered />
      </div>
      <LandingReveal revealId="reviews/cards" className={`mt-3 desktop:mt-10 ${desktopSectionFrameClassName}`}>
        <ReviewsInteractiveList
          title={title}
          items={items}
          carouselLabels={carouselLabels}
          ratingSuffix={ratingSuffix}
        />
      </LandingReveal>
      <div className="flex justify-center">
        <Link
          href={action.href}
          target={action.href.startsWith("http") ? "_blank" : undefined}
          rel={action.href.startsWith("http") ? "noreferrer" : undefined}
          className={`${styles.action} flex items-center justify-center font-medium desktop:font-semibold`}
        >
          {action.label}
        </Link>
      </div>
    </section>
  );
}

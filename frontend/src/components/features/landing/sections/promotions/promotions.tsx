import Link from "next/link";
import { StoredImage } from "@/components/ui";
import type {
  LandingAction,
  LandingCarouselLabels,
  LandingPromotion,
} from "@/types/landing";
import { ContentCarousel } from "../../components/content-carousel";
import { SectionHeading } from "../../components/section-heading";
import { LandingReveal } from "../../components/landing-reveal";
import styles from "./promotions.module.css";
import {
  sectionFrameClassName,
  desktopSectionFrameClassName,
} from "../../lib/section-frame";

export function Promotions({
  title,
  items,
  action,
  carouselLabels,
}: {
  title: string;
  items: LandingPromotion[];
  action: LandingAction;
  carouselLabels: LandingCarouselLabels;
}) {
  if (!items.length) return null;
  return (
    <section
      id="promo"
      className={styles.section}
      aria-labelledby="promo-heading"
    >
      <div className={sectionFrameClassName}>
        <SectionHeading id="promo-heading" title={title} action={action} />
      </div>
      <ContentCarousel
        endAction={action}
        label={title}
        labels={carouselLabels}
        trackClassName={`${styles.track} flex gap-4 desktop:grid desktop:grid-cols-4 desktop:gap-[25px]`}
        slideClassName={styles.slide}
        className={`mt-3 desktop:mt-10 ${desktopSectionFrameClassName}`}
      >
        {items.map((item, index) => (
          <LandingReveal key={item.id} revealId={`promo/${item.id}`} index={index}>
            <Link
              href={item.href}
              aria-label={item.title}
              className={`${styles.poster} relative block overflow-hidden`}
            >
              <StoredImage
                src={item.image_url}
                alt={item.image_alt}
              />
            </Link>
          </LandingReveal>
        ))}
      </ContentCarousel>
    </section>
  );
}

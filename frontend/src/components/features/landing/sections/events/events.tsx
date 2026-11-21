import Link from "next/link";
import { StoredImage } from "@/components/ui";
import type {
  LandingAction,
  LandingCarouselLabels,
  LandingEvent,
} from "@/types/landing";
import { ContentCarousel } from "../../components/content-carousel";
import { DesignAsset } from "../../components/design-asset";
import { SectionHeading } from "../../components/section-heading";
import { LandingReveal } from "../../components/landing-reveal";
import styles from "./events.module.css";
import {
  sectionFrameClassName,
  desktopSectionFrameClassName,
} from "../../lib/section-frame";

export function Events({
  title,
  items,
  action,
  carouselLabels,
}: {
  title: string;
  items: LandingEvent[];
  action: LandingAction;
  carouselLabels: LandingCarouselLabels;
}) {
  if (!items.length) return null;
  return (
    <section
      id="event"
      className={`${styles.section} relative z-[1]`}
      aria-labelledby="event-heading"
    >
      <div className={sectionFrameClassName}>
        <SectionHeading id="event-heading" title={title} action={action} />
      </div>
      <ContentCarousel
        endAction={action}
        label={title}
        labels={carouselLabels}
        trackClassName={`${styles.track} flex gap-4 desktop:grid desktop:grid-cols-2 desktop:gap-x-6 desktop:gap-y-[60px]`}
        slideClassName={styles.slide}
        className={`mt-3 desktop:mt-10 ${desktopSectionFrameClassName}`}
      >
        {items.map((item, index) => (
          <LandingReveal key={item.id} revealId={`event/${item.id}`} index={index} className="h-full">
            <Link
              href={item.href}
              className={`${styles.card} relative block`}
            >
              <div className={`${styles.poster} relative overflow-hidden`}>
                <StoredImage
                  src={item.image_url}
                  alt={item.image_alt}
                />
              </div>
              <div className={styles.body}>
                <h3 className="font-bold text-[length:var(--type-label-size)] leading-5 mb-1 tablet:text-[length:var(--type-section-size)] tablet:leading-(--type-section-leading)">{item.title}</h3>
                <p className={`${styles.excerpt} tablet:hidden desktop:hidden`}>
                  {item.excerpt}
                </p>
                <p className={`${styles.description} hidden tablet:block desktop:block`}>
                  {item.description}
                </p>
              </div>
              <span className={styles.arrow}>
                <DesignAsset name="event" />
              </span>
            </Link>
          </LandingReveal>
        ))}
      </ContentCarousel>
    </section>
  );
}

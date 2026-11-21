import type { LandingCarouselLabels, LandingPartners } from "@/types/landing";
import { sectionTitleClassName } from "../../components/section-heading";
import { PartnersCarousel } from "./partners-carousel";
import styles from "./partners.module.css";

export function Partners({ content, carouselLabels }: {
  content: LandingPartners;
  carouselLabels: LandingCarouselLabels;
}) {
  if (!content.items.length) return null;
  return (
    <section
      id="partners"
      className={`${styles.section} text-center`}
      aria-labelledby="partners-heading"
    >
      <h2 id="partners-heading" className={sectionTitleClassName}>
        {content.title}
      </h2>
      <p className={styles.description}>{content.description}</p>
      <PartnersCarousel items={content.items} labels={carouselLabels} />
    </section>
  );
}

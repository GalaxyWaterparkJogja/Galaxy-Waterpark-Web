import type { LandingLocation } from "@/types/landing";
import { DesignAsset } from "../../components/design-asset";
import { SectionHeading } from "../../components/section-heading";
import styles from "./visit.module.css";
import { sectionFrameClassName } from "../../lib/section-frame";

export function Visit({ content }: { content: LandingLocation }) {
  return (
    <section
      id="location"
      className={`${styles.section} ${sectionFrameClassName}`}
      aria-labelledby="location-heading"
    >
      <SectionHeading id="location-heading" title={content.title} />
      <div className={styles.panel}>
        <div className={`${styles.map} relative overflow-hidden`}>
          <iframe
            src={content.embed_url}
            title={content.map_label}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className={styles.mapLink}
            href={content.href}
            target="_blank"
            rel="noreferrer"
          >
            <strong className="block">Galaxy Waterpark · Google Maps ↗</strong>
            {content.address}
          </a>
        </div>
        <ul className={`${styles.features} grid`}>
          {content.features.map((feature) => (
            <li
              key={feature.id}
              className={`${styles.feature} flex items-center`}
            >
              <span
                className={`${styles.icon} grid shrink-0 place-items-center`}
              >
                <DesignAsset name={feature.icon} />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold desktop:font-semibold">
                  <span className="desktop:hidden">
                    {feature.mobile_title ?? feature.title}
                  </span>
                  <span className="hidden desktop:inline">{feature.title}</span>
                </h3>
                <p>
                  <span className="desktop:hidden">
                    {feature.mobile_description ?? feature.description}
                  </span>
                  <span className="hidden desktop:inline">
                    {feature.description}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

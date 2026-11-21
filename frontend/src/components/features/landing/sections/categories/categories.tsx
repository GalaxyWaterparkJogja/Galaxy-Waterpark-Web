import Image from "next/image";
import Link from "next/link";
import type { LandingCategory } from "@/types/landing";
import { landingFont } from "../../lib/landing-font";
import { LandingReveal } from "../../components/landing-reveal";
import { categoryArtworkStyle } from "./category-artwork";
import { CategoryImage } from "./category-image";
import styles from "./categories.module.css";

export function Categories({
  title,
  items,
}: {
  title: string;
  items: LandingCategory[];
}) {
  if (!items.length) return null;
  return (
    <section
      id="katalog"
      className={`${styles.section} ${landingFont.className}`}
      aria-label={title}
    >
      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3 desktop:gap-[22px] tablet:grid-cols-3 tablet:gap-4">
        {items.map((category, index) => (
          <LandingReveal key={category.id} revealId={`category/${category.id}`} index={index}>
            <Link
              href={category.href}
              className={`${styles.card} relative isolate flex flex-col justify-end overflow-hidden`}
              style={categoryArtworkStyle(category.image_url)}
            >
              <div className={styles.picture}>
                <CategoryImage key={category.image_url} src={category.image_url} />
              </div>
              <span className={styles.overlay} aria-hidden="true" />
              <span className={styles.name}>{category.label}</span>
              <span
                className={`${styles.arrow} grid place-items-center`}
                aria-hidden="true"
              >
                <Image
                  className="desktop:hidden"
                  src="/images/figma/category-arrow-mobile.svg"
                  alt=""
                  width={23.1453}
                  height={23.1453}
                />
                <Image
                  className="hidden desktop:block"
                  src="/images/figma/category-arrow-desktop.svg"
                  alt=""
                  width={37.5}
                  height={37.5}
                />
              </span>
            </Link>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
}

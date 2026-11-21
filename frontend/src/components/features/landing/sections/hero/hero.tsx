import Image from "next/image";
import Link from "next/link";
import type { LandingHero as LandingHeroContent } from "@/types/landing";
import { HeroImage } from "./hero-image";
import { LandingReveal } from "../../components/landing-reveal";
import { landingFont } from "../../lib/landing-font";
import styles from "./hero.module.css";

const actionClass = "flex min-w-[136px] min-h-[44px] items-center justify-center rounded-[var(--radius-control-large)] px-4 py-2 text-center text-sm font-semibold no-underline transition-opacity duration-[150ms] ease-[ease] hover:opacity-[0.85] tablet:w-[240px] tablet:min-h-[48px] tablet:text-[length:var(--type-section-size)] tablet:leading-(--type-section-leading) desktop:w-[217px] desktop:min-h-[41.75px] desktop:rounded-[var(--radius-control-large)] desktop:p-[7.614px] desktop:text-[18.27px] desktop:leading-[24.365px] desktop:font-semibold desktop:tracking-[-0.15px]";

export function LandingHero({ hero }: { hero: LandingHeroContent }) {
  return (
    <section
      className={`${styles.hero} ${landingFont.className} relative isolate flex flex-col items-center overflow-hidden text-center`}
      id="beranda"
      aria-labelledby="welcome-heading"
    >
      <HeroImage key={hero.image_url} src={hero.image_url} />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={`${styles.content} relative z-[2] flex w-full flex-col items-center`}>
        <LandingReveal revealId="hero/title" kind="hero" className="w-full">
          <h1
            id="welcome-heading"
            tabIndex={-1}
            className="text-[28px] font-bold leading-[36px] tracking-[-0.2px] text-background [@media(max-width:359px)]:text-[26px] desktop:text-[clamp(40px,4.444vw,64px)] desktop:leading-[1.125] desktop:tracking-[-0.8px]"
          >
            {hero.title}
          </h1>
        </LandingReveal>
        <LandingReveal
          revealId="hero/actions"
          kind="hero"
          index={1}
          className="mt-[21px] flex w-full justify-center gap-[10px] desktop:mt-[22.7px] desktop:gap-6"
        >
          <Link className={`${actionClass} ${styles.primaryAction}`} href={hero.cta_href}>
            {hero.cta_label}
          </Link>
          {hero.secondary_cta_label && hero.secondary_cta_href && (
            <Link
              className={`${actionClass} gap-2 py-[3px] desktop:py-[6.853px] ${styles.secondaryAction}`}
              href={hero.secondary_cta_href}
            >
              {hero.secondary_cta_label}
              <span className="grid size-[13.333px] shrink-0 place-items-center desktop:size-[23.604px]" aria-hidden="true">
                <Image className="desktop:hidden" src="/images/figma/hero-arrow-mobile.svg" alt="" width={11.1094} height={8.88889} />
                <Image className="hidden desktop:block" src="/images/figma/hero-arrow-desktop.svg" alt="" width={15.7343} height={11.8018} />
              </span>
            </Link>
          )}
        </LandingReveal>
      </div>
    </section>
  );
}

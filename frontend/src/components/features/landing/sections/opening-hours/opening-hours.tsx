import Image from "next/image";
import type { LandingSchedule } from "@/types/landing";
import { LandingReveal } from "../../components/landing-reveal";
import styles from "./opening-hours.module.css";

export function OpeningHours({ schedule }: { schedule: LandingSchedule }) {
  return (
    <section className={styles.hours} aria-labelledby="hours-heading">
      <LandingReveal revealId="hours/schedule">
        <h2 id="hours-heading" className={`${styles.heading} text-center font-bold text-foreground`}>
          {schedule.title}
        </h2>
        <div className={`${styles.card} mx-auto`}>
          <div className={`${styles.schedule} relative grid grid-cols-2 items-center`}>
            <p className="flex flex-col px-[8px] text-center">
              <span className={`${styles.label} font-medium text-(color:--color-text-secondary)`}>
                {schedule.weekday_label}
              </span>
              <strong className={`${styles.time} font-bold text-(color:--hours-ink)`}>
                {schedule.weekday_hours}
              </strong>
            </p>
            <span className={styles.divider} aria-hidden="true">
              <Image className="max-w-none desktop:hidden" src="/images/figma/hours-divider-mobile.svg" alt="" width={59.6524} height={1.07482} />
              <Image className="hidden max-w-none desktop:block" src="/images/figma/hours-divider-desktop.svg" alt="" width={80.8491} height={2} />
            </span>
            <p className="flex flex-col px-[8px] text-center">
              <span className={`${styles.label} font-medium text-(color:--color-text-secondary)`}>
                {schedule.weekend_label}
              </span>
              <strong className={`${styles.time} font-bold text-(color:--hours-ink)`}>
                {schedule.weekend_hours}
              </strong>
            </p>
          </div>
          <p className={`${styles.closedDay} flex items-center justify-center px-[12px] py-[6px] text-center font-bold desktop:py-[10px]`}>
            <span className={`${styles.alert} grid place-items-center`} aria-hidden="true">
              <Image className="desktop:hidden" src="/images/figma/hours-alert-mobile.svg" alt="" width={9.61509} height={9.61508} />
              <Image className="hidden desktop:block" src="/images/figma/hours-alert-desktop.svg" alt="" width={15.8646} height={15.8646} />
            </span>
            <span>{schedule.closed_label}</span>
          </p>
        </div>
      </LandingReveal>
    </section>
  );
}

import type { LandingCarouselLabels, LandingTicket } from "@/types/landing";
import { PagedCarousel } from "@/components/ui/paged-carousel";
import { LandingReveal } from "../../components/landing-reveal";
import { landingFont } from "../../lib/landing-font";
import styles from "./tickets.module.css";

export function Tickets({
  title,
  items,
  weekdayLabel,
  weekendLabel,
  carouselLabels,
}: {
  title: string;
  items: LandingTicket[];
  weekdayLabel: string;
  weekendLabel: string;
  carouselLabels: LandingCarouselLabels;
}) {
  if (!items.length) return null;
  return (
    <section
      id="tiket"
      className={`${styles.section} ${landingFont.className}`}
      aria-labelledby="tickets-heading"
    >
      <div className={styles.inner}>
        <h2 id="tickets-heading" className={styles.title}>
          {title}
        </h2>
        <PagedCarousel
          initialPage={0}
          label={title}
          labels={carouselLabels}
          trackClassName={`${styles.track} desktop:grid desktop:grid-cols-4`}
          paginationClassName={`${styles.pagination} desktop:hidden`}
        >
          {items.map((ticket, index) => (
            <LandingReveal key={ticket.id} revealId={`ticket/${ticket.id}`} index={index} className="flex">
              <article
                className={`${styles.ticketCard} flex flex-1 flex-col`}
                data-ticket={ticket.id}
              >
                <div
                  className={`${styles.ticketHeader} flex flex-col items-center justify-center`}
                >
                  <h3 className={styles.ticketLabel}>{ticket.label}</h3>
                  <p className={styles.ticketAge}>{ticket.age}</p>
                </div>
                <div
                  className={`${styles.ticketPricing} flex flex-1 flex-col justify-between`}
                >
                  <div className={`${styles.ticketPriceRow} flex flex-col`}>
                    <span className={styles.ticketPriceLabel}>
                      {weekdayLabel}
                    </span>
                    <div
                      className={`${styles.ticketBadge} ${styles.weekdayBadge} flex items-center justify-center`}
                    >
                      <span className={styles.ticketBadgeValue}>
                        {ticket.weekday}
                      </span>
                    </div>
                  </div>
                  <div className={`${styles.ticketPriceRow} flex flex-col`}>
                    <span className={styles.ticketPriceLabel}>
                      {weekendLabel}
                    </span>
                    <div
                      className={`${styles.ticketBadge} ${styles.weekendBadge} flex items-center justify-center`}
                    >
                      <span className={styles.ticketBadgeValue}>
                        {ticket.weekend}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </LandingReveal>
          ))}
        </PagedCarousel>
      </div>
    </section>
  );
}

import type { LandingContent } from "@/types/landing";
import { LandingHero } from "./sections/hero/hero";
import { OpeningHours } from "./sections/opening-hours/opening-hours";
import { Categories } from "./sections/categories/categories";
import { Tickets } from "./sections/tickets/tickets";
import { Promotions } from "./sections/promotions/promotions";
import { Events } from "./sections/events/events";
import { About } from "./sections/about/about";
import { Partners } from "./sections/partners/partners";
import { Reviews } from "./sections/reviews/reviews";
import { Visit } from "./sections/visit/visit";
import { landingFont } from "./lib/landing-font";

export function LandingSections({ content }: { content: LandingContent }) {
  return (
    <>
      <LandingHero hero={content.hero} />
      <OpeningHours schedule={content.schedule} />
      <Categories
        title={content.labels.categories}
        items={content.categories}
      />
      <Tickets
        title={content.labels.tickets}
        items={content.tickets}
        weekdayLabel={content.labels.weekday}
        weekendLabel={content.labels.weekend}
        carouselLabels={content.carousel_labels}
      />
      <div
        className={`${landingFont.className} flow-root overflow-clip bg-water text-(--color-text-primary) [container-type:inline-size] [font-optical-sizing:none]`}
      >
        <Promotions
          title={content.labels.promos}
          items={content.promos}
          action={content.more_promos}
          carouselLabels={content.carousel_labels}
        />
        <Events
          title={content.labels.events}
          items={content.events}
          action={content.more_events}
          carouselLabels={content.carousel_labels}
        />
        <About content={content.about} />
        <Partners content={content.partners} carouselLabels={content.carousel_labels} />
        <Reviews
          title={content.labels.reviews}
          items={content.reviews}
          action={content.review_action}
          carouselLabels={content.carousel_labels}
          ratingSuffix={content.labels.rating_suffix}
        />
        <Visit content={content.location} />
      </div>
    </>
  );
}

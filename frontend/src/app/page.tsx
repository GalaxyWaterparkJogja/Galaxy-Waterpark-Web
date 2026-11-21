import { LandingPage } from "@/components/features/landing/landing-page";
import {
  BUSINESS_ADDRESS,
  BUSINESS_GEO,
  buildAggregateRating,
  buildOpeningHoursSpecification,
  buildPriceRange,
  getSiteUrl,
  normalizePhoneForSchema,
  parseRupiahAmount,
  toAbsoluteSiteUrl,
} from "@/lib/seo";
import { getSafeLandingContent } from "@/services/content-service";
import { fetchPublicProfile } from "@/services/landing-service";
import type { LandingReview, LandingTicket } from "@/types/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const siteUrl = getSiteUrl();
  const [content, profile] = await Promise.all([
    getSafeLandingContent(),
    fetchPublicProfile(),
  ]);

  const rawReviews = content.reviews;
  const reviewItems: LandingReview[] = Array.isArray(rawReviews)
    ? rawReviews
    : (rawReviews as unknown as { items?: LandingReview[] })?.items || [];

  const rawTickets = content.tickets;
  const tickets: LandingTicket[] = Array.isArray(rawTickets) ? rawTickets : [];

  const ticketOffers = tickets.flatMap((ticket) => {
    const weekdayPrice = parseRupiahAmount(ticket.weekday);
    const weekendPrice = parseRupiahAmount(ticket.weekend);
    const offers = [];

    if (weekdayPrice !== null) {
      offers.push({
        "@type": "Offer" as const,
        name: `Tiket ${ticket.label}${ticket.age ? ` (${ticket.age})` : ""} - ${content.schedule.weekday_label}`,
        price: String(weekdayPrice),
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
        url: `${siteUrl}/#tiket`,
      });
    }
    if (weekendPrice !== null) {
      offers.push({
        "@type": "Offer" as const,
        name: `Tiket ${ticket.label}${ticket.age ? ` (${ticket.age})` : ""} - ${content.schedule.weekend_label}`,
        price: String(weekendPrice),
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
        url: `${siteUrl}/#tiket`,
      });
    }
    return offers;
  });

  const openingHoursSpecification = buildOpeningHoursSpecification(content.schedule);
  const priceRange = buildPriceRange(tickets);
  const aggregateRating = buildAggregateRating(reviewItems);
  const telephone = normalizePhoneForSchema(profile?.whatsapp_number);
  const sameAs = [
    "https://instagram.com/galaxywaterpark",
    content.location.href,
  ].filter((href): href is string => Boolean(href && /^https?:\/\//i.test(href)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["WaterPark", "TouristAttraction"],
    name: profile?.name?.trim() || "Galaxy Waterpark Yogyakarta",
    description:
      profile?.description?.trim() ||
      "Taman rekreasi air keluarga di Banguntapan, Bantul, Daerah Istimewa Yogyakarta dengan wahana kolam ombak, kolam arus, perosotan seru, dan kolam renang olympic.",
    url: siteUrl,
    image: toAbsoluteSiteUrl("/images/figma/hero-final.png", siteUrl),
    ...(telephone ? { telephone } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      ...BUSINESS_ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      ...BUSINESS_GEO,
    },
    ...(openingHoursSpecification.length > 0
      ? { openingHoursSpecification }
      : {}),
    ...(priceRange ? { priceRange } : {}),
    isAccessibleForFree: false,
    publicAccess: true,
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviewItems.length > 0
      ? {
          review: reviewItems.slice(0, 10).map((r) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: r.name,
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: r.text.replace(/^"|"$/g, ""),
          })),
        }
      : {}),
    ...(ticketOffers.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Daftar Tiket Masuk Galaxy Waterpark",
            itemListElement: ticketOffers,
          },
          offers: ticketOffers,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage content={content} />
    </>
  );
}

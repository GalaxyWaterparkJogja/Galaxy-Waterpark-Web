import type { Metadata } from "next";
import { EventPage as EventView } from "@/components/features/event/event-page";
import { BUSINESS_ADDRESS, getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";
import { getSafeEvents } from "@/services/content-service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Event & Agenda Kegiatan",
  description:
    "Ikuti keseruan event spesial, perlombaan renang, hiburan musik akhir pekan, dan agenda liburan keluarga di Galaxy Waterpark Yogyakarta.",
  keywords: [
    "Event Galaxy Waterpark",
    "Acara Waterpark Jogja",
    "Lomba Renang Bantul",
    "Hiburan Keluarga Jogja",
    "Agenda Galaxy Waterpark",
  ],
  alternates: {
    canonical: "/event",
  },
  openGraph: {
    title: "Event & Agenda Kegiatan | Galaxy Waterpark Yogyakarta",
    description:
      "Jadwal acara terbaru, kompetisi, dan hiburan keluarga di Galaxy Waterpark Yogyakarta.",
    url: "/event",
    images: ["/images/figma/event-final.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Event & Agenda Kegiatan | Galaxy Waterpark Yogyakarta",
    description:
      "Jadwal acara terbaru, kompetisi, dan hiburan keluarga di Galaxy Waterpark Yogyakarta.",
    images: ["/images/figma/event-final.png"],
  },
};

export default async function EventPage() {
  const siteUrl = getSiteUrl();
  const events = await getSafeEvents();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Event",
        item: `${siteUrl}/event`,
      },
    ],
  };

  const eventListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Agenda & Event Galaxy Waterpark Yogyakarta",
    description:
      "Jadwal event spesial, lomba renang, dan pertunjukan hiburan di Galaxy Waterpark Yogyakarta.",
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        description: event.description || event.title,
        image: toAbsoluteSiteUrl(event.image_url, siteUrl),
        ...(event.start_date ? { startDate: event.start_date } : {}),
        ...(event.end_date ? { endDate: event.end_date } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: "Galaxy Waterpark Yogyakarta",
          address: {
            "@type": "PostalAddress",
            ...BUSINESS_ADDRESS,
          },
        },
        organizer: {
          "@type": "Organization",
          name: "Galaxy Waterpark Yogyakarta",
          url: siteUrl,
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListJsonLd) }}
      />
      <EventView items={events} />
    </>
  );
}

import landingFixture from "@/fixtures/landing.json";
import type { LandingContent, LandingLocationIcon } from "@/types/landing";
import {
  fetchPublicEvents,
  fetchPublicPromotions,
  toEventCard,
  toPromotionCard,
} from "./promo-event-service";
import { apiClient, resolveApiAssetUrl } from "./api-client";

const PUBLIC_LANDING_REVALIDATE_SECONDS = 60;

export interface PublicProfileRecord {
  name: string;
  description: string | null;
  operating_hours: string | null;
  holiday_info: string | null;
  maps_embed_url: string | null;
  whatsapp_number: string | null;
  image_path: string | null;
}

interface PublicReviewRecord {
  id: number | string;
  reviewer_name: string;
  rating: number | string;
  comment_text: string;
  created_at?: string | null;
}

interface PublicTicketRecord {
  id: number;
  category_name: string;
  price: number | string;
  weekday_price: number | string | null;
  weekend_price: number | string | null;
  age_min: number | null;
  age_max: number | null;
}

interface PublicScheduleRecord {
  operating_hours: string | null;
  holiday_info: string | null;
}

interface PublicPartnerResponse {
  description: string | null;
  items: {
    id: number | string;
    name: string;
    logo_url: string | null;
    website_url?: string | null;
  }[];
}

function formatRupiah(value: number | string | null): string {
  const amount = Number(value ?? 0);
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatAge(min: number | null, max: number | null): string {
  if (min === null && max === null) return "";
  if (min !== null && max !== null) return `${min}-${max} Tahun`;
  if (min !== null) return `> ${min} Tahun`;
  return `0-${max} Tahun`;
}

function ticketCategoryRank(label: string): number {
  const normalized = label.trim().toLocaleLowerCase("id-ID");
  if (normalized === "bayi") return 0;
  if (normalized === "anak") return 1;
  if (normalized === "dewasa") return 2;
  if (normalized === "lansia") return 3;
  return 4;
}

function parseSchedule(raw: PublicScheduleRecord | null) {
  const fallback = landingFixture.schedule;
  if (!raw) return fallback;

  try {
    if (raw.operating_hours?.trim().startsWith("{")) {
      const data = JSON.parse(raw.operating_hours) as {
        weekday_label?: string;
        weekday_open?: string;
        weekday_close?: string;
        weekend_label?: string;
        weekend_open?: string;
        weekend_close?: string;
      };
      return {
        title: fallback.title,
        weekday_label: data.weekday_label || fallback.weekday_label,
        weekday_hours: `${data.weekday_open || "09.00"}-${data.weekday_close || "16.00"} WIB`,
        weekend_label: data.weekend_label || fallback.weekend_label,
        weekend_hours: `${data.weekend_open || "08.00"}-${data.weekend_close || "16.00"} WIB`,
        closed_label: raw.holiday_info || fallback.closed_label,
      };
    }
  } catch {
    // Use the fallback schedule when the stored JSON is invalid.
  }

  return {
    ...fallback,
    weekday_hours: raw.operating_hours || fallback.weekday_hours,
    closed_label: raw.holiday_info || fallback.closed_label,
  };
}

function locationIcon(value: string): LandingLocationIcon {
  if (value === "bus" || value === "clock" || value === "parking") return value;
  throw new Error(`Unknown landing location icon: ${value}`);
}

export async function fetchPublicProfile(): Promise<PublicProfileRecord | null> {
  try {
    const response = await apiClient<PublicProfileRecord>("/public/profile", {
      cache: "no-store",
    });
    return response.data ?? null;
  } catch {
    return null;
  }
}

// The landing fixture remains the source for static sections; dynamic content
// is refreshed from the public content API with 60s ISR revalidation.
export async function getLandingContent(): Promise<LandingContent> {
  const [
    promotions,
    events,
    profile,
    ticketsResponse,
    scheduleResponse,
    partnersResponse,
    reviewsResponse,
  ] = await Promise.all([
    fetchPublicPromotions(),
    fetchPublicEvents(),
    fetchPublicProfile(),
    apiClient<PublicTicketRecord[]>("/public/tickets", {
      next: { revalidate: PUBLIC_LANDING_REVALIDATE_SECONDS },
    }),
    apiClient<PublicScheduleRecord>("/public/schedule", {
      next: { revalidate: PUBLIC_LANDING_REVALIDATE_SECONDS },
    }).catch(() => ({ data: null as PublicScheduleRecord | null })),
    apiClient<PublicPartnerResponse>("/public/partners", {
      next: { revalidate: PUBLIC_LANDING_REVALIDATE_SECONDS },
    }).catch(() => ({
      data: { description: null, items: [] } as PublicPartnerResponse,
    })),
    apiClient<PublicReviewRecord[]>("/public/reviews", {
      params: { limit: 10 },
      next: { revalidate: PUBLIC_LANDING_REVALIDATE_SECONDS },
    }).catch(() => ({ data: [] as PublicReviewRecord[] })),
  ]);
  const tickets = ticketsResponse.data
    .map((record) => ({
      id: String(record.id),
      label: record.category_name,
      age: formatAge(record.age_min, record.age_max),
      weekday: formatRupiah(record.weekday_price ?? record.price),
      weekend: formatRupiah(record.weekend_price ?? record.price),
    }))
    .sort((a, b) => {
      const rankDifference =
        ticketCategoryRank(a.label) - ticketCategoryRank(b.label);
      if (rankDifference !== 0) return rankDifference;

      const idDifference = Number(a.id) - Number(b.id);
      return Number.isFinite(idDifference) ? idDifference : a.id.localeCompare(b.id);
    });
  const partnerItems = partnersResponse.data.items.map((partner) => ({
    id: String(partner.id),
    name: partner.name,
    image_url: resolveApiAssetUrl(partner.logo_url) || null,
  }));
  const liveReviews = reviewsResponse.data.map((record) => ({
    id: String(record.id),
    name: record.reviewer_name,
    text: record.comment_text,
    rating: Math.max(0.5, Math.min(5, Number(record.rating) || 5)),
  }));
  const content = {
    ...landingFixture,
    schedule: parseSchedule(scheduleResponse.data),
    about: {
      ...landingFixture.about,
      paragraphs: profile?.description?.trim()
        ? profile.description
            .split(/\n\s*\n/)
            .map((text) => ({ text: text.trim() }))
            .filter((paragraph) => paragraph.text)
        : landingFixture.about.paragraphs,
      image_url:
        (profile?.image_path && resolveApiAssetUrl(profile.image_path)) ||
        landingFixture.about.image_url,
    },
    tickets: tickets.length > 0 ? tickets : landingFixture.tickets,
    reviews: liveReviews.length > 0 ? liveReviews : landingFixture.reviews,
    partners: {
      ...landingFixture.partners,
      description:
        partnersResponse.data.description || landingFixture.partners.description,
      items: partnerItems,
    },
    promos: promotions.map((record) => {
      const item = toPromotionCard(record);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        image_alt: item.image_alt,
        href: "/promo",
      };
    }),
    events: events.map((record) => {
      const item = toEventCard(record);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        excerpt: item.excerpt,
        image_url: item.image_url,
        image_alt: item.image_alt,
        href: "/event",
      };
    }),
    location: {
      ...landingFixture.location,
      features: landingFixture.location.features.map((feature) => ({
        ...feature,
        icon: locationIcon(feature.icon),
      })),
    },
  } satisfies LandingContent;
  return structuredClone(content);
}

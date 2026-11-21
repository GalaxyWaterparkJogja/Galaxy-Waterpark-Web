import { apiClient, resolveApiAssetUrl } from "./api-client";
import type { EventCard, PromotionCard } from "@/types/public-pages";

export interface PublicPromoEvent {
  id: number | string;
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  terms?: string | null;
}

function formatPeriod(startDate: string | null, endDate: string | null): string {
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `Mulai ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;
  return "";
}

function toExcerpt(description: string): string {
  const normalized = description.trim();
  if (normalized.length <= 100) return normalized;
  return `${normalized.slice(0, 97).trimEnd()}...`;
}

const PUBLIC_PROMO_EVENT_REVALIDATE_SECONDS = 60;

export function toPromotionCard(record: PublicPromoEvent): PromotionCard {
  const description = record.description || "";
  const terms = record.terms || description;

  return {
    id: String(record.id),
    title: record.title,
    subtitle: formatPeriod(record.starts_at, record.ends_at),
    description,
    benefit: record.title,
    benefit_description: terms,
    image_url: resolveApiAssetUrl(record.image_url) || null,
    image_alt: `Poster promo ${record.title}`,
  };
}

export function toEventCard(record: PublicPromoEvent): EventCard {
  const description = record.description || "";

  return {
    id: String(record.id),
    title: record.title,
    description,
    excerpt: toExcerpt(description),
    image_url: resolveApiAssetUrl(record.image_url) || null,
    image_alt: `Poster event ${record.title}`,
    start_date: record.starts_at || undefined,
    end_date: record.ends_at || undefined,
  };
}

export async function fetchPublicPromotions(): Promise<PublicPromoEvent[]> {
  const response = await apiClient<PublicPromoEvent[]>("/public/promotions", {
    next: { revalidate: PUBLIC_PROMO_EVENT_REVALIDATE_SECONDS },
  });
  return response.data;
}

export async function fetchPublicEvents(): Promise<PublicPromoEvent[]> {
  const response = await apiClient<PublicPromoEvent[]>("/public/events", {
    next: { revalidate: PUBLIC_PROMO_EVENT_REVALIDATE_SECONDS },
  });
  return response.data;
}

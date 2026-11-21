import { getLandingContent } from "./landing-service";
import { getPromotions } from "./promo-service";
import { getEvents } from "./event-service";
import { getGalleryPhotos } from "./gallery-service";
import { getCatalogGroups } from "./catalog-service";
import { getSiteContent } from "./site-service";
import landingFixture from "@/fixtures/landing.json";
import promoFixture from "@/fixtures/promo.json";
import eventFixture from "@/fixtures/events.json";
import galleryFixture from "@/fixtures/gallery.json";
import catalogFixture from "@/fixtures/catalog.json";
import siteFixture from "@/fixtures/site.json";
import type { LandingContent, LandingLocationIcon } from "@/types/landing";
import type {
  PromotionCard,
  EventCard,
  GalleryPhoto,
  CatalogGroupData,
} from "@/types/public-pages";
import type { SiteContent } from "@/types/site";

function locationIcon(value: string): LandingLocationIcon {
  if (value === "bus" || value === "clock" || value === "parking") return value;
  return "clock";
}

function getFallbackLandingContent(): LandingContent {
  return structuredClone({
    ...landingFixture,
    location: {
      ...landingFixture.location,
      features: landingFixture.location.features.map((feature) => ({
        ...feature,
        icon: locationIcon(feature.icon),
      })),
    },
  } satisfies LandingContent);
}

/**
 * Resilient content loader that catches unexpected errors and falls back safely,
 * while emitting descriptive warnings in development mode so data regressions are visible.
 */
export async function loadContentWithFallback<T>(
  loader: () => Promise<T>,
  fallbackValue: T | (() => T),
  contextName: string
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[content-service] Warning: Failed to load ${contextName}. Falling back to default data.`,
        error
      );
    }
    return typeof fallbackValue === "function"
      ? (fallbackValue as () => T)()
      : structuredClone(fallbackValue);
  }
}

export async function getSafeLandingContent(): Promise<LandingContent> {
  return loadContentWithFallback(
    getLandingContent,
    getFallbackLandingContent,
    "landing content"
  );
}

export async function getSafePromotions(): Promise<PromotionCard[]> {
  return loadContentWithFallback(
    getPromotions,
    () => structuredClone(promoFixture satisfies PromotionCard[]),
    "promotions"
  );
}

export async function getSafeEvents(): Promise<EventCard[]> {
  return loadContentWithFallback(
    getEvents,
    () => structuredClone(eventFixture satisfies EventCard[]),
    "events"
  );
}

export async function getSafeGalleryPhotos(): Promise<GalleryPhoto[]> {
  return loadContentWithFallback(
    getGalleryPhotos,
    () => structuredClone(galleryFixture satisfies GalleryPhoto[]),
    "gallery photos"
  );
}

export async function getSafeCatalogGroups(): Promise<CatalogGroupData[]> {
  return loadContentWithFallback(
    getCatalogGroups,
    () => structuredClone(catalogFixture as CatalogGroupData[]),
    "catalog groups"
  );
}

export function getSafeSiteContent(): SiteContent {
  try {
    return getSiteContent();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[content-service] Warning: Failed to load site content. Falling back to default data.",
        error
      );
    }
    return structuredClone(siteFixture satisfies SiteContent);
  }
}

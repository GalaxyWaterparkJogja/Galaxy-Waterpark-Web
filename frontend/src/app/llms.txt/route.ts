import { catalogGroups } from "@/components/features/katalog/catalog-data";
import { renderLlmsTxt } from "@/lib/llms-txt";
import { getSiteUrl } from "@/lib/seo";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
} from "@/services/catalog-service";
import {
  getSafeEvents,
  getSafeLandingContent,
  getSafePromotions,
} from "@/services/content-service";
import { fetchPublicProfile } from "@/services/landing-service";

export const revalidate = 60;

export async function GET() {
  const [content, profile, catalogRecords, promos, events] = await Promise.all([
    getSafeLandingContent(),
    fetchPublicProfile(),
    fetchAllPublicCatalogs(),
    getSafePromotions(),
    getSafeEvents(),
  ]);

  const markdown = renderLlmsTxt({
    siteUrl: getSiteUrl(),
    businessName: profile?.name?.trim() || "Galaxy Waterpark Yogyakarta",
    description:
      profile?.description?.trim() ||
      "Taman rekreasi air keluarga di Banguntapan, Bantul, Daerah Istimewa Yogyakarta dengan wahana seluncuran, kolam arus, kolam olympic, dan fasilitas keluarga lengkap.",
    whatsappNumber: profile?.whatsapp_number,
    mapsHref: content.location.href,
    instagramHref: "https://instagram.com/galaxywaterpark",
    schedule: content.schedule,
    tickets: content.tickets,
    catalogSections: catalogGroups.map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      items: resolveCatalogItemsForGroup(group, catalogRecords),
    })),
    promos,
    events,
  });

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

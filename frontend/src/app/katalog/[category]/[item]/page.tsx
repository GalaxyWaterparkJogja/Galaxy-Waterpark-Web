import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KatalogPage as KatalogView } from "@/components/features/katalog/katalog-page";
import {
  catalogGroups,
  catalogItems,
} from "@/components/features/katalog/catalog-data";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
} from "@/services/catalog-service";
import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";

export const revalidate = 60;

type Props = {
  params: Promise<{ category: string; item: string }>;
};

export function generateStaticParams() {
  return catalogGroups.flatMap((group) =>
    catalogItems(group).map((entry) => ({
      category: group.id,
      item: entry.id,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, item: itemId } = await params;
  const group = catalogGroups.find((entry) => entry.id === category);
  if (!group) return {};

  const recordsMap = await fetchAllPublicCatalogs();
  const item = resolveCatalogItemsForGroup(group, recordsMap).find(
    (entry) => entry.id === itemId,
  );
  if (!item) {
    return {
      title: group.title,
      description: group.description,
      alternates: { canonical: `/katalog/${group.id}/${itemId}` },
    };
  }

  const description = item.description?.trim() || `${item.title} di kategori ${group.title}. ${group.description}`;

  return {
    title: `${item.title} (${group.title})`,
    description,
    keywords: [
      item.title,
      group.title,
      `Wahana ${item.title}`,
      "Galaxy Waterpark Yogyakarta",
      "Wahana Air Jogja",
    ],
    alternates: {
      canonical: `/katalog/${group.id}/${item.id}`,
    },
    openGraph: {
      title: `${item.title} — ${group.title} | Galaxy Waterpark`,
      description,
      url: `/katalog/${group.id}/${item.id}`,
      ...(item.image ? { images: [item.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.title} — ${group.title} | Galaxy Waterpark`,
      description,
      ...(item.image ? { images: [item.image] } : {}),
    },
  };
}

export default async function KatalogItemPage({ params }: Props) {
  const { category, item: itemId } = await params;
  const group = catalogGroups.find((entry) => entry.id === category);
  if (!group) notFound();

  const siteUrl = getSiteUrl();
  const initialCatalogRecords = await fetchAllPublicCatalogs();
  const item = resolveCatalogItemsForGroup(group, initialCatalogRecords).find(
    (entry) => entry.id === itemId,
  );

  const description = item?.description?.trim() || group.description;

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
        name: "Wahana & Fasilitas",
        item: `${siteUrl}/katalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: group.title,
        item: `${siteUrl}/katalog/${group.id}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: item?.title ?? itemId,
        item: `${siteUrl}/katalog/${group.id}/${itemId}`,
      },
    ],
  };

  const attractionJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: `${item?.title ?? itemId} — Galaxy Waterpark Yogyakarta`,
    description,
    url: `${siteUrl}/katalog/${group.id}/${itemId}`,
    image: toAbsoluteSiteUrl(item?.image, siteUrl),
    isAccessibleForFree: false,
    ...(typeof item?.price === "number" && item.price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: String(Math.round(item.price)),
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    containedInPlace: {
      "@type": "WaterPark",
      name: "Galaxy Waterpark Yogyakarta",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(attractionJsonLd) }}
      />
      <KatalogView
        categoryId={group.id}
        itemId={itemId}
        initialCatalogRecords={initialCatalogRecords}
      />
    </>
  );
}

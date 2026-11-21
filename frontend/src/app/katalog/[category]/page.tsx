import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KatalogPage as KatalogView } from "@/components/features/katalog/katalog-page";
import { catalogGroups } from "@/components/features/katalog/catalog-data";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
} from "@/services/catalog-service";
import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";

export const revalidate = 60;

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return catalogGroups.map((group) => ({ category: group.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const group = catalogGroups.find((item) => item.id === category);
  if (!group) return {};

  const image = group.images[0]
    ? `/images/figma/catalog/${group.images[0]}`
    : "/images/figma/family-desktop.png";

  return {
    title: `${group.title} — Wahana & Fasilitas`,
    description: group.description,
    keywords: [
      group.title,
      `Wahana ${group.title}`,
      `Fasilitas ${group.title}`,
      "Galaxy Waterpark Yogyakarta",
      "Wisata Air Jogja",
    ],
    alternates: {
      canonical: `/katalog/${group.id}`,
    },
    openGraph: {
      title: `${group.title} | Galaxy Waterpark Yogyakarta`,
      description: group.description,
      url: `/katalog/${group.id}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${group.title} | Galaxy Waterpark Yogyakarta`,
      description: group.description,
      images: [image],
    },
  };
}

export default async function KatalogCategoryPage({ params }: Props) {
  const { category } = await params;
  const group = catalogGroups.find((item) => item.id === category);
  if (!group) notFound();

  const siteUrl = getSiteUrl();
  const initialCatalogRecords = await fetchAllPublicCatalogs();
  const items = resolveCatalogItemsForGroup(group, initialCatalogRecords);

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
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${group.title} — Galaxy Waterpark Yogyakarta`,
    description: group.description,
    url: `${siteUrl}/katalog/${group.id}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Galaxy Waterpark Yogyakarta",
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "TouristAttraction",
          name: entry.title,
          description: entry.description?.trim() || group.description,
          url: `${siteUrl}/katalog/${group.id}/${entry.id}`,
          image: toAbsoluteSiteUrl(entry.image, siteUrl),
        },
      })),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <KatalogView
        categoryId={group.id}
        initialCatalogRecords={initialCatalogRecords}
      />
    </>
  );
}

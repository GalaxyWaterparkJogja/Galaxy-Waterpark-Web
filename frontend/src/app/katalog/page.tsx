import type { Metadata } from "next";
import { KatalogPage as KatalogView } from "@/components/features/katalog/katalog-page";
import { catalogGroups } from "@/components/features/katalog/catalog-data";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
} from "@/services/catalog-service";
import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wahana & Fasilitas",
  description:
    "Jelajahi wahana seluncuran keluarga, kolam arus, kolam renang olympic, gazebo, dan fasilitas penunjang lengkap di Galaxy Waterpark Yogyakarta.",
  keywords: [
    "Wahana Galaxy Waterpark",
    "Fasilitas Galaxy Waterpark",
    "Kolam Renang Olympic Jogja",
    "Water Slide Jogja",
    "Gazebo Galaxy Waterpark",
  ],
  alternates: {
    canonical: "/katalog",
  },
  openGraph: {
    title: "Wahana & Fasilitas | Galaxy Waterpark Yogyakarta",
    description:
      "Daftar lengkap wahana permainan air keluarga, kolam olahraga olympic, dan fasilitas di Galaxy Waterpark Yogyakarta.",
    url: "/katalog",
    images: ["/images/figma/family-desktop.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wahana & Fasilitas | Galaxy Waterpark Yogyakarta",
    description:
      "Daftar lengkap wahana permainan air keluarga, kolam olahraga olympic, dan fasilitas di Galaxy Waterpark Yogyakarta.",
    images: ["/images/figma/family-desktop.png"],
  },
};

export default async function KatalogPage() {
  const siteUrl = getSiteUrl();
  const initialCatalogRecords = await fetchAllPublicCatalogs();

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
    ],
  };

  const allEntries = catalogGroups.flatMap((group) =>
    resolveCatalogItemsForGroup(group, initialCatalogRecords).map((entry) => ({
      group,
      entry,
    })),
  );

  const catalogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Daftar Wahana & Fasilitas Galaxy Waterpark Yogyakarta",
    numberOfItems: allEntries.length,
    itemListElement: allEntries.map(({ group, entry }, index) => ({
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
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogListJsonLd) }}
      />
      <KatalogView initialCatalogRecords={initialCatalogRecords} />
    </>
  );
}

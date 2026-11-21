import type { MetadataRoute } from "next";
import { catalogGroups } from "@/components/features/katalog/catalog-data";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
} from "@/services/catalog-service";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const catalogRecords = await fetchAllPublicCatalogs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/katalog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/promo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/event`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/galeri`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = catalogGroups.map((group) => ({
    url: `${siteUrl}/katalog/${group.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const itemRoutes: MetadataRoute.Sitemap = catalogGroups.flatMap((group) =>
    resolveCatalogItemsForGroup(group, catalogRecords).map((item) => ({
      url: `${siteUrl}/katalog/${group.id}/${item.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  );

  return [...staticRoutes, ...categoryRoutes, ...itemRoutes];
}

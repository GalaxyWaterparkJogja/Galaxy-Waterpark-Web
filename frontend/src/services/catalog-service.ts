import catalogFixture from "@/fixtures/catalog.json";
import {
  catalogItems,
  type CatalogGroup,
  type CatalogItem,
} from "@/components/features/katalog/catalog-data";
import type { CatalogGroupData, CatalogItemData } from "@/types/public-pages";
import { apiClient, resolveApiAssetUrl } from "./api-client";

const imageRoot = "/images/figma/catalog";
const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60;

export type PublicCatalogRecordsMap = Partial<
  Record<CatalogGroup["id"], PublicCatalogRecord[]>
>;

export async function getCatalogGroups(): Promise<CatalogGroupData[]> {
  return structuredClone(catalogFixture as CatalogGroupData[]);
}

export async function getCatalogGroup(
  id: string,
): Promise<CatalogGroupData | undefined> {
  const groups = await getCatalogGroups();
  return groups.find((group) => group.id === id);
}

export function getCatalogItems(group: CatalogGroupData): CatalogItemData[] {
  return Array.from({ length: 9 }, (_, index) => ({
    id: `${group.id}-${index + 1}`,
    title: `${group.itemName} ${index + 1}`,
    mobileTitle: `${group.mobileItemName} ${index + 1}`,
    image: `${imageRoot}/${group.images[index % group.images.length]}`,
  }));
}

export interface PublicCatalogRecord {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  height_requirement?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
  is_featured?: boolean;
}

export async function fetchPublicCatalog(
  type: "wahana" | "fasilitas" | "hydrotherapy",
): Promise<PublicCatalogRecord[]> {
  const endpoint =
    type === "wahana"
      ? "/public/attractions"
      : type === "fasilitas"
        ? "/public/facilities"
        : "/public/hydrotherapy";
  const response = await apiClient<PublicCatalogRecord[]>(endpoint, {
    next: { revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS },
  });
  return response.data;
}

export async function fetchAllPublicCatalogs(): Promise<PublicCatalogRecordsMap> {
  const [wahana, hydrotherapy, fasilitas] = await Promise.allSettled([
    fetchPublicCatalog("wahana"),
    fetchPublicCatalog("hydrotherapy"),
    fetchPublicCatalog("fasilitas"),
  ]);

  const records: PublicCatalogRecordsMap = {};
  if (wahana.status === "fulfilled") records.family = wahana.value;
  if (hydrotherapy.status === "fulfilled") {
    records["sports-wellness"] = hydrotherapy.value;
  }
  if (fasilitas.status === "fulfilled") records.facilities = fasilitas.value;

  return records;
}

export function toCatalogItem(
  record: PublicCatalogRecord,
  _group?: CatalogGroupData,
): CatalogItemData {
  void _group;
  return {
    id: String(record.id),
    title: record.name,
    mobileTitle: record.name,
    image: resolveApiAssetUrl(record.image_url) || null,
    description: record.description,
    heightRequirement: record.height_requirement,
    price: record.price,
    durationMinutes: record.duration_minutes,
  };
}

export function resolveCatalogItemsForGroup(
  group: CatalogGroup,
  recordsMap?: PublicCatalogRecordsMap,
): CatalogItem[] {
  const records = recordsMap?.[group.id];
  if (!records) return catalogItems(group);
  return records.map((record) => toCatalogItem(record));
}

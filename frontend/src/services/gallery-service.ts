import type { GalleryPhoto } from "@/types/public-pages";
import { apiClient, resolveApiAssetUrl } from "./api-client";

interface PublicGalleryRecord {
  id: number | string;
  title: string | null;
  category?: string | null;
  image_url: string | null;
  alt_text: string | null;
  event_date?: string | null;
}

const PUBLIC_GALLERY_REVALIDATE_SECONDS = 60;

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const response = await apiClient<PublicGalleryRecord[]>("/public/gallery", {
    next: { revalidate: PUBLIC_GALLERY_REVALIDATE_SECONDS },
  });

  return response.data.map((record) => ({
    id: String(record.id),
    image_url: resolveApiAssetUrl(record.image_url) || null,
    alt: record.alt_text || record.title || "Dokumentasi Galaxy Waterpark",
  }));
}

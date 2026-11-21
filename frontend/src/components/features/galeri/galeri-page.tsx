import { getSafeGalleryPhotos } from "@/services/content-service";
import type { GalleryPhoto } from "@/types/public-pages";
import { Gallery } from "./gallery";

export async function GaleriPage({
  photos,
}: {
  photos?: GalleryPhoto[];
} = {}) {
  return <Gallery photos={photos ?? (await getSafeGalleryPhotos())} />;
}
export default GaleriPage;

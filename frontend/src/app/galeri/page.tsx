import type { Metadata } from "next";
import { GaleriPage as GaleriView } from "@/components/features/galeri/galeri-page";
import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";
import { getSafeGalleryPhotos } from "@/services/content-service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Galeri Foto Wahana & Suasana",
  description:
    "Lihat dokumentasi foto wahana perosotan, kolam arus, kolam anak, dan keseruan pengunjung di Galaxy Waterpark Yogyakarta.",
  keywords: [
    "Foto Galaxy Waterpark",
    "Galeri Wahana Air Jogja",
    "Suasana Galaxy Waterpark",
    "Foto Kolam Renang Bantul",
    "Dokumentasi Wisata Air",
  ],
  alternates: {
    canonical: "/galeri",
  },
  openGraph: {
    title: "Galeri Foto | Galaxy Waterpark Yogyakarta",
    description:
      "Kumpulan foto suasana wahana air, kolam keluarga, dan fasilitas di Galaxy Waterpark Yogyakarta.",
    url: "/galeri",
    images: ["/images/figma/gallery/lazy-river.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galeri Foto | Galaxy Waterpark Yogyakarta",
    description:
      "Kumpulan foto suasana wahana air, kolam keluarga, dan fasilitas di Galaxy Waterpark Yogyakarta.",
    images: ["/images/figma/gallery/lazy-river.webp"],
  },
};

export default async function GaleriPage() {
  const siteUrl = getSiteUrl();
  const photos = await getSafeGalleryPhotos();

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
        name: "Galeri",
        item: `${siteUrl}/galeri`,
      },
    ],
  };

  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Galeri Foto Wahana & Suasana Galaxy Waterpark",
    description:
      "Dokumentasi foto wahana perosotan, kolam arus, kolam anak, dan keseruan pengunjung di Galaxy Waterpark Yogyakarta.",
    url: `${siteUrl}/galeri`,
    image: photos
      .filter((photo): photo is typeof photo & { image_url: string } =>
        Boolean(photo.image_url),
      )
      .map((photo) => ({
        "@type": "ImageObject",
        contentUrl: toAbsoluteSiteUrl(photo.image_url, siteUrl),
        caption: photo.alt,
        name: photo.alt,
        ...(photo.width ? { width: photo.width } : {}),
        ...(photo.height ? { height: photo.height } : {}),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryJsonLd) }}
      />
      <GaleriView photos={photos} />
    </>
  );
}

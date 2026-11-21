import type { Metadata } from "next";
import { PromoPage as PromoView } from "@/components/features/promo/promo-page";
import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/seo";
import { getSafePromotions } from "@/services/content-service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Promo Tiket & Penawaran Spesial",
  description:
    "Dapatkan promo tiket masuk terbaru, diskon pelajar, paket rombongan keluarga, dan penawaran spesial liburan di Galaxy Waterpark Yogyakarta.",
  keywords: [
    "Promo Galaxy Waterpark",
    "Diskon Tiket Waterpark Jogja",
    "Promo Liburan Sekolah",
    "Paket Rombongan Galaxy Waterpark",
    "Voucher Galaxy Waterpark",
  ],
  alternates: {
    canonical: "/promo",
  },
  openGraph: {
    title: "Promo Tiket & Penawaran Spesial | Galaxy Waterpark Yogyakarta",
    description:
      "Dapatkan promo tiket masuk terbaru, diskon pelajar, paket rombongan keluarga, dan penawaran spesial liburan di Galaxy Waterpark Yogyakarta.",
    url: "/promo",
    images: ["/images/figma/promo-final.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promo Tiket & Penawaran Spesial | Galaxy Waterpark Yogyakarta",
    description:
      "Cek daftar promo aktif, diskon tiket masuk, dan voucher spesial di Galaxy Waterpark Yogyakarta.",
    images: ["/images/figma/promo-final.png"],
  },
};

export default async function PromoPage() {
  const siteUrl = getSiteUrl();
  const promos = await getSafePromotions();

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
        name: "Promo",
        item: `${siteUrl}/promo`,
      },
    ],
  };

  const promoListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Daftar Promo & Penawaran Spesial Galaxy Waterpark",
    description:
      "Promo tiket masuk dan diskon spesial terkini di Galaxy Waterpark Yogyakarta.",
    numberOfItems: promos.length,
    itemListElement: promos.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Offer",
        name: item.subtitle ? `${item.title} — ${item.subtitle}` : item.title,
        description:
          item.description || item.benefit_description || item.title,
        image: toAbsoluteSiteUrl(item.image_url, siteUrl),
        url: `${siteUrl}/promo#${item.id}`,
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "WaterPark",
          name: "Galaxy Waterpark Yogyakarta",
          url: siteUrl,
        },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(promoListJsonLd) }}
      />
      <PromoView items={promos} />
    </>
  );
}

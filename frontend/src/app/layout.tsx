import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppLayout } from "@/components/layout";
import "./globals.css";

const inter = localFont({
  src: "../assets/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://galaxywaterpark.id"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Galaxy Waterpark Yogyakarta — Taman Rekreasi Air Keluarga",
    template: "%s | Galaxy Waterpark Yogyakarta",
  },
  description:
    "Informasi resmi Galaxy Waterpark Yogyakarta: harga tiket masuk, jam operasional, wahana air keluarga, kolam renang olympic, promo spesial, dan event seru di Bantul, Yogyakarta.",
  keywords: [
    "Galaxy Waterpark",
    "Galaxy Waterpark Jogja",
    "Waterpark Yogyakarta",
    "Kolam Renang Bantul",
    "Wisata Air Keluarga Jogja",
    "Harga Tiket Galaxy Waterpark",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Galaxy Waterpark Yogyakarta",
    title: "Galaxy Waterpark Yogyakarta — Taman Rekreasi Air Keluarga",
    description:
      "Destinasi rekreasi air keluarga di Bantul, Yogyakarta dengan wahana seluncuran, kolam arus, kolam olympic, dan fasilitas keluarga lengkap.",
    url: "/",
    images: [
      {
        url: "/images/figma/hero-final.png",
        width: 1440,
        height: 900,
        alt: "Suasana wahana air di Galaxy Waterpark Yogyakarta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galaxy Waterpark Yogyakarta — Taman Rekreasi Air Keluarga",
    description:
      "Informasi resmi tiket masuk, jam buka, wahana air, dan promo spesial Galaxy Waterpark Yogyakarta.",
    images: ["/images/figma/hero-final.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

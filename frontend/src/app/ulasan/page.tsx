import type { Metadata } from "next";
import { ReviewFormPage } from "@/components/features/ulasan/review-form-page";

export const metadata: Metadata = {
  title: "Berikan Ulasan Anda",
  description:
    "Bagikan pengalaman dan penilaian Anda selama berkunjung ke Galaxy Waterpark Yogyakarta.",
  alternates: {
    canonical: "/ulasan",
  },
};

export default function UlasanPage() {
  return <ReviewFormPage />;
}

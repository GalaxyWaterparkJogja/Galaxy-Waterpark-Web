import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "404 — Halaman Tidak Ditemukan",
  description:
    "Halaman yang Anda cari di Galaxy Waterpark Yogyakarta tidak ditemukan atau telah dipindahkan.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main
      style={{
        padding: "80px 24px",
        minHeight: "65vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmptyState
        title="Halaman Tidak Ditemukan (404)"
        description="Maaf, halaman atau wahana yang Anda tuju tidak ditemukan atau alamat URL telah dipindahkan."
        iconName="clock"
        action={{ label: "Kembali ke Beranda", href: "/" }}
      />
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime errors for observability and dev diagnostics
    console.error("[GlobalError] Unhandled error captured:", error);
  }, [error]);

  return (
    <main
      role="alert"
      aria-live="assertive"
      style={{
        padding: "64px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <EmptyState
        title="Halaman Gagal Dimuat"
        description="Terjadi kendala teknis saat memuat data halaman ini. Silakan muat ulang atau kembali ke beranda."
        iconName="clock"
        action={{ label: "Coba Muat Ulang", onClick: () => reset() }}
        secondaryAction={{ label: "Kembali ke Beranda", href: "/" }}
      />
    </main>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { NullImage, StoredImage } from "@/components/ui";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageReveal } from "@/components/ui/page-reveal";
import { AppIcon } from "@/components/ui/icons";
import type { GalleryPhoto } from "@/types/public-pages";
import styles from "./galeri.module.css";

export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const current = selected === null ? null : photos[selected];

  function move(direction: number) {
    setSelected((index) =>
      index === null ? null : (index + direction + photos.length) % photos.length,
    );
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    if (touchStartX.current === null || !touch) return;
    const diff = touch.clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      move(diff > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  return (
    <section className={styles.page} data-content-page aria-labelledby="gallery-heading">
      <div className={styles.container}>
        <h1 id="gallery-heading" className={styles.heading}>
          Galeri Galaxy Waterpark
        </h1>
        {photos.length ? (
          <>
            <div className={styles.grid}>
              {photos.map((photo, index) => (
                <PageReveal
                  key={photo.id}
                  index={index}
                  className={styles.masonryItem}
                >
                  <button
                    type="button"
                    className={styles.photoCard}
                    onClick={() => setSelected(index)}
                    aria-label={`Perbesar foto: ${photo.alt}`}
                  >
                    <div
                      className={
                        photo.image_url
                          ? styles.photoWrapper
                          : `${styles.photoWrapper} ${styles.emptyPhoto}`
                      }
                    >
                      {photo.image_url ? (
                        <Image
                          src={photo.image_url}
                          alt={photo.alt}
                          width={photo.width ?? 800}
                          height={photo.height ?? 600}
                          sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
                          className={styles.photoImg}
                          loading={index < 4 ? "eager" : "lazy"}
                        />
                      ) : (
                        <NullImage />
                      )}
                    </div>
                    <div className={styles.captionOverlay}>
                      <span>{photo.alt}</span>
                    </div>
                  </button>
                </PageReveal>
              ))}
            </div>
            <p className={styles.farewell}>Sampai jumpa di Galaxy Waterpark!</p>
          </>
        ) : (
          <EmptyState
            title="Galeri Belum Tersedia"
            description="Dokumentasi foto keseruan di Galaxy Waterpark akan segera diunggah. Kunjungi kembali dalam waktu dekat."
            iconName="ticket"
            action={{ label: "Kembali ke Beranda", href: "/" }}
          />
        )}
      </div>

      <DetailDialog
        open={Boolean(current)}
        title={current?.alt ?? "Foto Galaxy Waterpark"}
        onClose={() => setSelected(null)}
        className={styles.lightbox}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {current && (
          <div
            className={styles.lightboxContent}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {current.image_url ? (
              <Image
                className={styles.largeImage}
                src={current.image_url}
                alt={current.alt}
                width={current.width ?? 1600}
                height={current.height ?? 1200}
                sizes="(min-width: 1024px) 1000px, 90vw"
                priority
              />
            ) : (
              <div className={styles.largeEmpty}>
                <StoredImage src={null} alt={current.alt} />
              </div>
            )}
            <div className={styles.photoControls}>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Foto sebelumnya"
              >
                <AppIcon name="chevron-right" className={styles.previous} />
              </button>
              <p aria-live="polite">
                {current.alt}
                <span>
                  {(selected ?? 0) + 1} / {photos.length}
                </span>
              </p>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Foto berikutnya"
              >
                <AppIcon name="chevron-right" />
              </button>
            </div>
          </div>
        )}
      </DetailDialog>
    </section>
  );
}

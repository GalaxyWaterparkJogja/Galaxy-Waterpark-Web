"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { AppIcon } from "@/components/ui/icons";
import type { LandingCarouselLabels, LandingReview } from "@/types/landing";
import { DesignAsset } from "../../components/design-asset";
import { ReviewsCarousel } from "./reviews-carousel";
import { formatReviewFullText, formatReviewPreview } from "./review-text";
import styles from "./reviews.module.css";

const DRAG_CLICK_THRESHOLD_PX = 8;

function formatRatingValue(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(".", ",");
}

export function ReviewRating({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) {
  const clamped = Math.max(0, Math.min(5, Math.round(value * 2) / 2));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = Math.max(0, 5 - full - (hasHalf ? 1 : 0));
  const formatted = formatRatingValue(clamped);

  return (
    <div
      className={styles.rating}
      role="img"
      aria-label={`${formatted} ${suffix}`}
    >
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: full }, (_, index) => (
          <DesignAsset key={`full-${index}`} name="star" />
        ))}
        {hasHalf && <DesignAsset name="half" />}
        {Array.from({ length: empty }, (_, index) => (
          <DesignAsset key={`empty-${index}`} name="emptyStar" />
        ))}
      </span>
      <span className={styles.ratingValue} aria-hidden="true">
        {formatted}
      </span>
    </div>
  );
}

export function ReviewsInteractiveList({
  title,
  items,
  carouselLabels,
  ratingSuffix,
}: {
  title: string;
  items: LandingReview[];
  carouselLabels: LandingCarouselLabels;
  ratingSuffix: string;
}) {
  const [selected, setSelected] = useState<LandingReview | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const dialogTitleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selected && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.open = true;
    } else if (!selected && dialog.open) {
      dialog.close();
    }
  }, [selected]);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    draggedRef.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const origin = pointerOriginRef.current;
    if (!origin) return;
    if (
      Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >
      DRAG_CLICK_THRESHOLD_PX
    ) {
      draggedRef.current = true;
    }
  };

  const handlePointerEnd = () => {
    pointerOriginRef.current = null;
  };

  const openReview = (item: LandingReview, isKeyboardClick: boolean) => {
    if (!isKeyboardClick && draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    draggedRef.current = false;
    setSelected(item);
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (dialog && typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      setSelected(null);
    }
  };

  return (
    <>
      <ReviewsCarousel label={title} labels={carouselLabels}>
        {items.map((item) => {
          const preview = formatReviewPreview(item.text);
          return (
            <figure
              key={item.id}
              className={`${styles.card} ${
                preview.isTruncated ? styles.cardInteractive : ""
              } flex flex-col`}
              onPointerDown={preview.isTruncated ? handlePointerDown : undefined}
              onPointerMove={preview.isTruncated ? handlePointerMove : undefined}
              onPointerUp={preview.isTruncated ? handlePointerEnd : undefined}
              onPointerCancel={preview.isTruncated ? handlePointerEnd : undefined}
            >
              <ReviewRating value={item.rating} suffix={ratingSuffix} />
              <blockquote className={styles.quote}>
                <span className={styles.quoteText}>{preview.excerpt}</span>
              </blockquote>
              {preview.isTruncated && (
                <button
                  type="button"
                  className={styles.readMore}
                  aria-haspopup="dialog"
                  aria-label={`Lihat ulasan lengkap dari ${item.name}`}
                  onClick={(event) => openReview(item, event.detail === 0)}
                >
                  Lihat selengkapnya...
                </button>
              )}
              <figcaption className={styles.author}>{item.name}</figcaption>
            </figure>
          );
        })}
      </ReviewsCarousel>

      <dialog
        ref={dialogRef}
        className={styles.modal}
        aria-labelledby={dialogTitleId}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.clientX === 0 && event.clientY === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;
          if (outside) closeDialog();
        }}
      >
        {selected && (
          <>
            <header className={styles.modalHeader}>
              <h3 id={dialogTitleId} className="sr-only">
                Ulasan lengkap dari {selected.name}
              </h3>
              <ReviewRating value={selected.rating} suffix={ratingSuffix} />
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Tutup ulasan"
                onClick={closeDialog}
              >
                <AppIcon name="close" size={20} />
              </button>
            </header>

            <div className={styles.modalBody}>
              <blockquote className={styles.modalQuote}>
                {formatReviewFullText(selected.text)}
              </blockquote>
            </div>

            <footer className={styles.modalFooter}>
              <div className={styles.modalAuthorGroup}>
                <p className={styles.modalAuthor}>{selected.name}</p>
                <p className={styles.modalRole}>Pengunjung Galaxy Waterpark</p>
              </div>
              <button
                type="button"
                className={styles.modalDoneButton}
                onClick={closeDialog}
              >
                Tutup
              </button>
            </footer>
          </>
        )}
      </dialog>
    </>
  );
}

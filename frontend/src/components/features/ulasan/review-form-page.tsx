"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { RequiredMark, Spinner } from "@/components/ui";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_NAME_MAX_LENGTH,
  ReviewSubmissionError,
  submitPublicReview,
  validateReviewInput,
  type ReviewFieldErrors,
} from "@/services/review-service";
import styles from "./ulasan.module.css";

const STAR_OPTIONS = [1, 2, 3, 4, 5] as const;
const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
const STAR_PATH =
  "M19.7953 4.95023L23.6728 14.4542L33.9193 15.2132L26.0653 21.8462L28.5238 31.8122L19.7953 26.4002L11.0668 31.8122L13.5253 21.8462L5.67131 15.2132L15.9178 14.4542L19.7953 4.95023Z";

const RATING_LABELS: Record<number, string> = {
  1: "Sangat kurang",
  2: "Kurang",
  3: "Cukup",
  4: "Baik",
  5: "Sangat puas",
};

function StarGlyph({
  rating,
  starValue,
}: {
  rating: number;
  starValue: number;
}) {
  const fill =
    rating >= starValue
      ? "full"
      : rating >= starValue - 0.5
        ? "half"
        : "empty";

  return (
    <span className={styles.starGlyph} aria-hidden="true">
      {fill !== "full" && (
        <svg
          className={styles.starIconInactive}
          viewBox="0 0 39.6 39.6"
          width="26"
          height="26"
          fill="none"
        >
          <path
            d={STAR_PATH}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="3.3"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {fill !== "empty" && (
        <svg
          className={`${styles.starIconActive} ${fill === "half" ? styles.starIconHalf : ""}`}
          viewBox="0 0 39.6 39.6"
          width="26"
          height="26"
          fill="none"
        >
          <path
            d={STAR_PATH}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="3.3"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export function ReviewFormPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const successDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = successDialogRef.current;
    if (!dialog) return;

    if (isSubmitted && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.open = true;
    } else if (!isSubmitted && dialog.open) {
      dialog.close();
    }
  }, [isSubmitted]);

  const displayedRating = hoveredRating ?? rating;

  const selectRating = (next: number) => {
    setRating(next);
    if (submitError) setSubmitError("");
    setFieldErrors((prev) => {
      if (!prev.rating) return prev;
      const copy = { ...prev };
      delete copy.rating;
      return copy;
    });
  };

  const handleStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentValue: number) => {
    let nextIndex: number | null = null;
    const currentIndex = RATING_STEPS.findIndex(
      (step) => step === (rating || currentValue),
    );

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextIndex = Math.min(RATING_STEPS.length - 1, currentIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = RATING_STEPS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextValue = RATING_STEPS[nextIndex];
      selectRating(nextValue);
      starRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const { payload, errors } = validateReviewInput({
      reviewer_name: reviewerName,
      rating,
      comment_text: commentText,
    });

    if (!payload) {
      setFieldErrors(errors);
      setSubmitError("Mohon lengkapi semua kolom wajib sebelum mengirim ulasan.");
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitPublicReview(payload);
      setIsSubmitted(true);
    } catch (reason) {
      if (reason instanceof ReviewSubmissionError) {
        setFieldErrors(reason.fieldErrors);
        setSubmitError(reason.message);
      } else {
        setSubmitError(
          reason instanceof Error
            ? reason.message
            : "Ulasan gagal dikirim. Silakan coba lagi.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToLanding = () => {
    setIsSubmitted(false);
    router.push("/#reviews");
  };

  return (
    <section
      className={styles.page}
      data-content-page
      aria-labelledby="review-form-heading"
    >
      <div className={styles.shell}>
        <header className={styles.headerCard}>
          <h1 id="review-form-heading" className={styles.title}>
            Berikan Ulasan Anda
          </h1>
          <p className={styles.subtitle}>
            Bantu kami meningkatkan kualitas pelayanan dan wahana di Galaxy
            Waterpark
          </p>
        </header>

        <div className={styles.formCard}>
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
          >
            {submitError && (
              <div className={styles.errorBanner} role="alert">
                {submitError}
              </div>
            )}

            <fieldset className={styles.fieldset} disabled={isSubmitting}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <span id="review-rating-label" className={styles.label}>
                    Rating Bintang
                    <RequiredMark />
                  </span>
                  <span className={styles.ratingHint} aria-live="polite">
                    {displayedRating > 0
                      ? `${displayedRating.toString().replace(".", ",")} / 5 — ${
                          RATING_LABELS[Math.ceil(displayedRating)]
                        }`
                      : "Pilih 0,5–5 bintang"}
                  </span>
                </div>

                <div
                  className={styles.starGrid}
                  role="radiogroup"
                  aria-labelledby="review-rating-label"
                  aria-describedby={
                    fieldErrors.rating ? "review-rating-error" : undefined
                  }
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {STAR_OPTIONS.map((starValue) => {
                    const selected = displayedRating >= starValue - 0.5;

                    return (
                      <div
                        key={starValue}
                        className={`${styles.starButton} ${
                          selected ? styles.starButtonSelected : ""
                        }`}
                      >
                        <StarGlyph rating={displayedRating} starValue={starValue} />
                        {([starValue - 0.5, starValue] as const).map(
                          (optionValue) => {
                            const optionIndex = RATING_STEPS.findIndex(
                              (step) => step === optionValue,
                            );
                            const checked = rating === optionValue;

                            return (
                              <button
                                key={optionValue}
                                ref={(element) => {
                                  starRefs.current[optionIndex] = element;
                                }}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                aria-label={`${optionValue.toString().replace(".", ",")} dari 5 bintang (${
                                  RATING_LABELS[Math.ceil(optionValue)]
                                })`}
                                tabIndex={
                                  rating === 0
                                    ? optionValue === 0.5
                                      ? 0
                                      : -1
                                    : checked
                                      ? 0
                                      : -1
                                }
                                className={`${styles.starHalfButton} ${
                                  optionValue < starValue
                                    ? styles.starHalfButtonLeft
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setHoveredRating(optionValue)
                                }
                                onClick={() => selectRating(optionValue)}
                                onKeyDown={(event) =>
                                  handleStarKeyDown(event, optionValue)
                                }
                              />
                            );
                          },
                        )}
                      </div>
                    );
                  })}
                </div>

                {fieldErrors.rating && (
                  <p
                    id="review-rating-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.rating}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="review-name">
                  Nama
                  <RequiredMark />
                </label>
                <input
                  id="review-name"
                  name="reviewer_name"
                  type="text"
                  autoComplete="name"
                  className={styles.input}
                  placeholder="Nama Anda"
                  value={reviewerName}
                  maxLength={REVIEW_NAME_MAX_LENGTH}
                  required
                  aria-invalid={Boolean(fieldErrors.reviewer_name)}
                  aria-describedby={
                    fieldErrors.reviewer_name ? "review-name-error" : undefined
                  }
                  onChange={(event) => {
                    setReviewerName(event.target.value);
                    if (submitError) setSubmitError("");
                    if (fieldErrors.reviewer_name) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.reviewer_name;
                        return copy;
                      });
                    }
                  }}
                />
                {fieldErrors.reviewer_name && (
                  <p
                    id="review-name-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.reviewer_name}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="review-comment">
                    Ulasan &amp; Pengalaman
                    <RequiredMark />
                  </label>
                  <span className={styles.counter} aria-hidden="true">
                    {commentText.length} / {REVIEW_COMMENT_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  name="comment_text"
                  className={styles.textarea}
                  placeholder="Tulis ulasan atau saran di sini..."
                  value={commentText}
                  maxLength={REVIEW_COMMENT_MAX_LENGTH}
                  rows={5}
                  required
                  aria-invalid={Boolean(fieldErrors.comment_text)}
                  aria-describedby={
                    fieldErrors.comment_text ? "review-comment-error" : undefined
                  }
                  onChange={(event) => {
                    setCommentText(event.target.value);
                    if (submitError) setSubmitError("");
                    if (fieldErrors.comment_text) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.comment_text;
                        return copy;
                      });
                    }
                  }}
                />
                {fieldErrors.comment_text && (
                  <p
                    id="review-comment-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.comment_text}
                  </p>
                )}
              </div>

              <div className={styles.actions}>
                {isSubmitting ? (
                  <button
                    type="button"
                    className={styles.cancelButton}
                    disabled
                  >
                    Batal
                  </button>
                ) : (
                  <Link href="/#reviews" className={styles.cancelButton}>
                    Batal
                  </Link>
                )}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size={16} />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    "Kirim Ulasan"
                  )}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>

      <dialog
        ref={successDialogRef}
        className={styles.successDialog}
        aria-labelledby="review-success-title"
        aria-describedby="review-success-desc"
        onClose={returnToLanding}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.clientX === 0 && event.clientY === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;
          if (outside) returnToLanding();
        }}
      >
        <div className={styles.successBody}>
          <h2 id="review-success-title" className={styles.successTitle}>
            Ulasan Berhasil Dikirim
          </h2>
          <p id="review-success-desc" className={styles.successText}>
            Masukanmu sangat berarti untuk peningkatan keseruan di Galaxy
            Waterpark.
          </p>
          <div className={styles.successBadge} aria-hidden="true">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className={styles.moderationNote}>
            Ulasan akan tampil di halaman utama setelah ditinjau oleh admin.
          </p>
          <button
            type="button"
            className={styles.successAction}
            onClick={returnToLanding}
          >
            Kembali ke Beranda
          </button>
        </div>
      </dialog>
    </section>
  );
}

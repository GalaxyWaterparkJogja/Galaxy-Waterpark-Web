"use client";

import { useCallback, useEffect, useState } from "react";
import adminStyles from "../admin.module.css";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import styles from "./ulasan.module.css";

type ReviewStatus = "pending" | "approved" | "rejected";
type ReviewTab = ReviewStatus;

interface Review {
  id: number;
  reviewer_name: string;
  rating: number | string;
  comment_text: string;
  status: ReviewStatus;
  created_at: string | null;
}

const TABS: { status: ReviewTab; label: string }[] = [
  { status: "pending", label: "Menunggu" },
  { status: "approved", label: "Dipublikasi" },
  { status: "rejected", label: "Ditolak" },
];

function formatReviewDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default function AdminUlasanPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewTab>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminApiRequest<Review[]>("/admin/reviews", session.token);
      setReviews(data);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ulasan tidak dapat dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const handleUpdateStatus = async (
    review: Review,
    status: Extract<ReviewStatus, "approved" | "rejected">,
  ) => {
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    setProcessingId(review.id);
    setError("");
    try {
      const updated = await adminApiRequest<Review>(
        `/admin/reviews/${review.id}`,
        session.token,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setReviews((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status ulasan gagal diperbarui.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => review.status === activeTab);

  return (
    <div>
      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>Seleksi Ulasan</h1>
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
          {!isLoading && reviews.length === 0 && (
            <button type="button" onClick={() => {
              setIsLoading(true);
              void loadReviews();
            }}>
              Coba lagi
            </button>
          )}
        </p>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.tabPillBar} role="tablist" aria-label="Status ulasan">
            {TABS.map(({ status, label }) => {
              const count = reviews.filter((review) => review.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === status}
                  className={`${styles.tabPill} ${
                    activeTab === status ? styles.tabPillActive : ""
                  }`}
                  onClick={() => setActiveTab(status)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <table className={adminStyles.table}>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Nama Pengunjung</th>
              <th style={{ width: "15%" }}>Rating</th>
              <th style={{ width: "35%" }}>Isi ulasan</th>
              <th style={{ width: "15%" }}>Tanggal Kirim</th>
              <th style={{ width: "15%" }}>Moderasi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className={styles.tableMessage}>Memuat ulasan...</td>
              </tr>
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.tableMessage}>
                  Tidak ada ulasan pada kategori ini.
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => {
                const rating = Number(review.rating);

                return (
                  <tr key={review.id}>
                    <td style={{ fontWeight: 600, color: "#062e44" }}>
                      {review.reviewer_name}
                    </td>
                    <td>
                      <div
                        className={styles.starRating}
                        aria-label={`${rating.toString().replace(".", ",")} bintang`}
                      >
                        {Array.from({ length: 5 }).map((_, index) => (
                          <svg
                            key={index}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <defs>
                              <clipPath id={`review-star-${review.id}-${index}`}>
                                <rect
                                  width={24 * Math.max(0, Math.min(1, rating - index))}
                                  height="24"
                                />
                              </clipPath>
                            </defs>
                            <polygon
                              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                              fill="currentColor"
                              clipPath={`url(#review-star-${review.id}-${index})`}
                            />
                            <polygon
                              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td>{review.comment_text}</td>
                    <td style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {formatReviewDate(review.created_at)}
                    </td>
                    <td>
                      {review.status === "pending" ? (
                        <div className={styles.moderationActions}>
                          <button
                            type="button"
                            className={styles.btnTolak}
                            disabled={processingId === review.id}
                            onClick={() => void handleUpdateStatus(review, "rejected")}
                          >
                            {processingId === review.id ? "Menyimpan..." : "Tolak"}
                          </button>
                          <button
                            type="button"
                            className={styles.btnPublikasi}
                            disabled={processingId === review.id}
                            onClick={() => void handleUpdateStatus(review, "approved")}
                          >
                            {processingId === review.id ? "Menyimpan..." : "Publikasi"}
                          </button>
                        </div>
                      ) : (
                        <span
                          className={
                            review.status === "approved"
                              ? adminStyles.badgeGreen
                              : styles.rejectedBadge
                          }
                        >
                          {review.status === "approved" ? "Dipublikasi" : "Ditolak"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

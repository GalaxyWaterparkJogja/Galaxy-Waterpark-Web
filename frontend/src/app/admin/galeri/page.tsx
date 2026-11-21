"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ImageField } from "@/components/admin/image-editor";
import { BusyOverlay, RequiredMark, Spinner, StoredImage } from "@/components/ui";
import { PencilEditIcon } from "@/components/ui/icons";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import { IMAGE_FRAMES } from "@/lib/image-frames";
import type { ProcessedImage } from "@/lib/image-processing";
import { resolveApiAssetUrl } from "@/services/api-client";
import adminStyles from "../admin.module.css";
import styles from "./galeri.module.css";

const GALLERY_CATEGORIES = ["Wahana", "Fasilitas", "Keluarga", "Event"] as const;

interface GalleryRecord {
  id: number;
  title: string | null;
  category: string;
  image_path: string;
  caption: string | null;
  is_active: boolean | number;
  sort_order: number;
  uploaded_at?: string | null;
}

export default function AdminGaleriPage() {
  const [photos, setPhotos] = useState<GalleryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "add" | "edit">("list");
  const [editingPhoto, setEditingPhoto] = useState<GalleryRecord | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>(GALLERY_CATEGORIES[0]);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<ProcessedImage | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadGallery = useCallback(async () => {
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const items = await adminApiRequest<GalleryRecord[]>(
        "/admin/gallery",
        session.token,
      );
      setPhotos(items);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Galeri tidak dapat dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadGallery);
  }, [loadGallery]);

  const resetForm = useCallback(() => {
    setViewMode("list");
    setEditingPhoto(null);
    setTitle("");
    setCaption("");
    setCategory(GALLERY_CATEGORIES[0]);
    setIsActive(true);
    setImage(null);
    setError("");
  }, []);

  useEffect(() => {
    if (viewMode === "list") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        resetForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isSaving, resetForm]);

  const beginAdd = () => {
    setEditingPhoto(null);
    setTitle("");
    setCaption("");
    setCategory(GALLERY_CATEGORIES[0]);
    setIsActive(true);
    setImage(null);
    setError("");
    setViewMode("add");
  };

  const beginEdit = (photo: GalleryRecord) => {
    setEditingPhoto(photo);
    setTitle(photo.title ?? "");
    setCaption(photo.caption ?? "");
    setCategory(photo.category || GALLERY_CATEGORIES[0]);
    setIsActive(Boolean(photo.is_active));
    setImage(null);
    setError("");
    setViewMode("edit");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    const isEditing = viewMode === "edit" && editingPhoto !== null;
    if (!isEditing && !image) {
      setError("Pilih foto terlebih dahulu sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("caption", caption.trim());
      body.append("category", category.trim() || GALLERY_CATEGORIES[0]);
      body.append("is_active", isActive ? "1" : "0");

      if (image) {
        body.append("image", image.file, image.file.name);
      }

      if (!isEditing) {
        const nextOrder =
          photos.reduce((highest, item) => Math.max(highest, item.sort_order), -1) + 1;
        body.append("sort_order", String(nextOrder));
      } else {
        body.append("sort_order", String(editingPhoto.sort_order));
      }

      // Note: `/admin/gallery/{id}` is a direct POST endpoint in backend/routes/api.php.
      const saved = await adminApiRequest<GalleryRecord>(
        isEditing ? `/admin/gallery/${editingPhoto.id}` : "/admin/gallery",
        session.token,
        { method: "POST", body },
      );

      setPhotos((items) => {
        const updated = isEditing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved];
        return updated.sort(
          (first, second) => first.sort_order - second.sort_order || first.id - second.id,
        );
      });

      resetForm();
      showToast(
        isEditing ? "Foto galeri berhasil diperbarui." : "Foto galeri berhasil diunggah.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Foto galeri gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (photo: GalleryRecord) => {
    const displayName = photo.title || photo.caption || `Foto #${photo.id}`;
    if (!window.confirm(`Hapus foto "${displayName}" dari galeri?`)) return;

    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    setDeletingId(photo.id);
    setError("");
    try {
      await adminApiRequest<unknown>(`/admin/gallery/${photo.id}`, session.token, {
        method: "DELETE",
      });
      setPhotos((items) => items.filter((item) => item.id !== photo.id));
      showToast("Foto galeri berhasil dihapus.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Foto galeri gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const categoryOptions = GALLERY_CATEGORIES.includes(
    category as (typeof GALLERY_CATEGORIES)[number],
  )
    ? [...GALLERY_CATEGORIES]
    : [...GALLERY_CATEGORIES, category];

  if (viewMode === "add" || (viewMode === "edit" && editingPhoto)) {
    const isEditing = viewMode === "edit" && editingPhoto !== null;
    return (
      <section className={styles.section} aria-labelledby="gallery-form-title">
        <div className={styles.formHeading}>
          <button
            type="button"
            className={styles.backButton}
            onClick={resetForm}
            disabled={isSaving}
            aria-label="Kembali ke galeri"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 id="gallery-form-title" className={styles.formTitle}>
            {isEditing ? "Edit Foto" : "Tambah Foto"}
          </h1>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            <span>{error}</span>
          </div>
        )}

        <form
          className={styles.formCard}
          onSubmit={handleSubmit}
          aria-busy={isSaving}
        >
          <fieldset className={styles.formFieldset} disabled={isSaving}>
            <div className={styles.field}>
              <label htmlFor="gallery-image">
                Foto Galeri
                {!isEditing && <RequiredMark />}
              </label>
              <div className={styles.imageStage}>
                <ImageField
                  id="gallery-image"
                  label="Foto galeri"
                  frame={IMAGE_FRAMES.gallery}
                  allowCrop={false}
                  value={image}
                  onChange={setImage}
                  currentUrl={
                    isEditing ? resolveApiAssetUrl(editingPhoto.image_path) || null : undefined
                  }
                  required={!isEditing}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className={styles.metaGrid}>
              <label className={styles.field} htmlFor="gallery-title">
                <span>Judul Foto</span>
                <input
                  id="gallery-title"
                  type="text"
                  placeholder="Contoh: Suasana Kolam Olympic"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </label>

              <label className={styles.field} htmlFor="gallery-category">
                <span>
                  Kategori
                  <RequiredMark />
                </span>
                <select
                  id="gallery-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.field} htmlFor="gallery-caption">
              <span>Keterangan / Alt Text</span>
              <input
                id="gallery-caption"
                type="text"
                placeholder="Contoh: Pengunjung bermain di kolam arus"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={255}
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Tampilkan di galeri publik
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={resetForm}
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSaving || (!isEditing && !image)}
              >
                {isSaving ? (
                  <>
                    <Spinner size={14} /> Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </fieldset>

          <BusyOverlay active={isSaving}>
            {image
              ? "Mengunggah foto dan menyimpan dokumentasi..."
              : "Menyimpan perubahan foto..."}
          </BusyOverlay>
        </form>
      </section>
    );
  }

  return (
    <div className={styles.section}>
      {toastMessage && (
        <div className={styles.toast} role="status">
          ✓ {toastMessage}
        </div>
      )}

      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>Upload Galeri Dokumentasi</h1>
        <button
          type="button"
          className={adminStyles.btnOrange}
          onClick={beginAdd}
        >
          + Tambah Foto Baru
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadGallery()}>
            Coba lagi
          </button>
        </div>
      )}

      <button
        type="button"
        className={styles.uploadCard}
        onClick={beginAdd}
        aria-label="Tambahkan Foto ke Galeri Dokumentasi"
      >
        <svg
          className={styles.uploadIcon}
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="4"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M20 10v20M10 20h20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <strong className={styles.uploadTitle}>Tambahkan Foto</strong>
        <span className={styles.uploadHint}>
          JPG, PNG, WebP, atau AVIF — rasio asli dipertahankan dan dikompres otomatis ke WebP
        </span>
      </button>

      <h2 className={styles.sectionHeading}>Galeri</h2>

      {isLoading ? (
        <p className={styles.stateMessage} role="status">
          Memuat galeri dokumentasi...
        </p>
      ) : photos.length === 0 ? (
        <p className={styles.stateMessage}>
          Belum ada foto dokumentasi. Klik &ldquo;Tambahkan Foto&rdquo; untuk mengunggah foto baru.
        </p>
      ) : (
        <div className={styles.photoGrid}>
          {photos.map((photo) => {
            const label = photo.title || photo.caption || `Foto dokumentasi #${photo.id}`;
            return (
              <article key={photo.id} className={styles.photoCard}>
                <div className={styles.photoFrame}>
                  <StoredImage
                    src={resolveApiAssetUrl(photo.image_path)}
                    alt={label}
                    className={styles.photoImage}
                  />
                  <div className={styles.photoOverlayActions}>
                    <button
                      type="button"
                      className={styles.deleteIconBtn}
                      onClick={() => void handleDelete(photo)}
                      disabled={deletingId === photo.id}
                      title="Hapus foto"
                      aria-label={`Hapus ${label}`}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.editIconBtn}
                      onClick={() => beginEdit(photo)}
                      title="Edit foto"
                      aria-label={`Edit ${label}`}
                    >
                      <PencilEditIcon size={16} />
                    </button>
                  </div>
                </div>
                <div className={styles.photoMeta}>
                  <div className={styles.photoMetaText}>
                    {photo.title && <h3 className={styles.photoTitle}>{photo.title}</h3>}
                    {photo.caption && <p className={styles.photoCaption}>{photo.caption}</p>}
                  </div>
                  <div className={styles.photoBadges}>
                    {photo.category && (
                      <span className={styles.categoryBadge}>{photo.category}</span>
                    )}
                    <span
                      className={`${styles.statusBadge} ${
                        photo.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {photo.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

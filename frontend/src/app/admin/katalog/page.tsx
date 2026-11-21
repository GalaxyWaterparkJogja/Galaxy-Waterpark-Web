"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import adminStyles from "../admin.module.css";
import styles from "./katalog.module.css";
import { ImageField } from "@/components/admin/image-editor";
import { BusyOverlay, RequiredMark, Spinner, StoredImage } from "@/components/ui";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import { IMAGE_FRAMES } from "@/lib/image-frames";
import type { ProcessedImage } from "@/lib/image-processing";
import { resolveApiAssetUrl } from "@/services/api-client";

type CatalogType = "wahana" | "fasilitas" | "hydrotherapy";

interface CatalogItem {
  id: number;
  title: string;
  type: CatalogType;
  description: string | null;
  image_path: string | null;
  sort_order: number;
}

const CATEGORY_LABELS: Record<CatalogType, string> = {
  wahana: "Wahana (Keluarga)",
  hydrotherapy: "Sport & Wellness",
  fasilitas: "Fasilitas",
};


export default function AdminKatalogPage() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CatalogType | "">("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadCatalogs = useCallback(async () => {
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const items = await adminApiRequest<CatalogItem[]>(
        "/admin/catalogs",
        session.token,
      );
      setCatalogs(items);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Katalog tidak dapat dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCatalogs);
  }, [loadCatalogs]);

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setImage(null);
    setError("");
  };

  const beginAdd = () => {
    setEditingItem(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setImage(null);
    setError("");
    setShowForm(true);
  };

  const beginEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.type);
    setDescription(item.description ?? "");
    setImage(null);
    setError("");
    setShowForm(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    if (!category) {
      setError("Pilih kategori katalog terlebih dahulu.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("type", category);
      body.append("description", description.trim());

      // Without a new image nothing is sent: a stored image is kept and a missing one stays null.
      if (image) body.append("image", image.file, image.file.name);
      if (!editingItem) {
        body.append("height_requirement", "");
        body.append("price", "");
        body.append("duration_minutes", "");
        body.append("is_featured", "0");
        body.append("is_active", "1");
        body.append(
          "sort_order",
          String(
            catalogs.reduce(
              (highest, item) => Math.max(highest, item.sort_order),
              -1,
            ) + 1,
          ),
        );
      } else {
        body.append("_method", "PATCH");
      }

      const saved = await adminApiRequest<CatalogItem>(
        editingItem ? `/admin/catalogs/${editingItem.id}` : "/admin/catalogs",
        session.token,
        { method: "POST", body },
      );

      setCatalogs((items) => {
        const updated = editingItem
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved];
        return updated.sort(
          (first, second) =>
            first.sort_order - second.sort_order || first.id - second.id,
        );
      });
      resetForm();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Katalog gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!window.confirm(`Hapus katalog "${item.title}"?`)) return;
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    setDeletingId(item.id);
    setError("");
    try {
      await adminApiRequest<unknown>(
        `/admin/catalogs/${item.id}`,
        session.token,
        { method: "DELETE" },
      );
      setCatalogs((items) => items.filter((catalog) => catalog.id !== item.id));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Katalog gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {showForm ? (
        <section aria-labelledby="catalog-form-title">
          <div className={styles.formHeading}>
            <button
              type="button"
              className={styles.backButton}
              onClick={resetForm}
              aria-label="Kembali ke katalog"
              disabled={isSaving}
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
            <h1 id="catalog-form-title" className={styles.formTitle}>
              {editingItem ? "Edit Katalog" : "Tambah Katalog"}
            </h1>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <form
            className={styles.catalogForm}
            onSubmit={handleSave}
            aria-busy={isSaving}
          >
            <fieldset className={styles.formBody} disabled={isSaving}>
            <ImageField
              id="catalog-image"
              label="Foto katalog"
              frame={IMAGE_FRAMES.catalog}
              value={image}
              onChange={setImage}
              currentUrl={
                editingItem
                  ? resolveApiAssetUrl(editingItem.image_path) || null
                  : undefined
              }
              disabled={isSaving}
              className={styles.imageColumn}
            />

            <div className={styles.formFields}>
              <label className={styles.formField} htmlFor="catalog-category">
                <span>
                  Kategori
                  <RequiredMark />
                </span>
                <select
                  id="catalog-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as CatalogType | "")
                  }
                  required
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {category && (
                <>
                  <label className={styles.formField} htmlFor="catalog-title">
                    <span>
                      {category === "fasilitas"
                        ? "Nama Fasilitas"
                        : category === "hydrotherapy"
                          ? "Nama Sport & Wellness"
                          : "Nama Wahana"}
                      <RequiredMark />
                    </span>
                    <input
                      id="catalog-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={100}
                      required
                    />
                  </label>

                  <label
                    className={styles.formField}
                    htmlFor="catalog-description"
                  >
                    <span>Keterangan</span>
                    <textarea
                      id="catalog-description"
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={10000}
                    />
                  </label>
                </>
              )}

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
                  disabled={isSaving || !category || !title.trim()}
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
            </div>
            </fieldset>
            <BusyOverlay active={isSaving}>
              {image ? "Mengunggah foto dan menyimpan katalog..." : "Menyimpan katalog..."}
            </BusyOverlay>
          </form>
        </section>
      ) : (
        <>
          <div className={adminStyles.pageHeader}>
            <h1 className={adminStyles.pageTitle}>Kelola Katalog</h1>
            <button
              type="button"
              className={adminStyles.btnOrange}
              onClick={beginAdd}
            >
              + Tambah Katalog Baru
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void loadCatalogs()}>
                Coba lagi
              </button>
            </div>
          )}

          {isLoading ? (
            <p className={styles.stateMessage} role="status">
              Memuat katalog...
            </p>
          ) : catalogs.length === 0 ? (
            <p className={styles.stateMessage}>
              Belum ada katalog. Tambahkan wahana, Sport & Wellness, atau fasilitas untuk mulai.
            </p>
          ) : (
            <div className={styles.cardGrid}>
              {catalogs.map((item) => (
                <article key={item.id} className={styles.katalogCard}>
                  <div className={styles.cardImageWrapper}>
                    <StoredImage
                      src={resolveApiAssetUrl(item.image_path)}
                      alt={item.title}
                      className={styles.cardImage}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{item.title}</h2>
                    <p className={styles.cardDesc}>
                      {item.description || "Belum ada keterangan."}
                    </p>
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                        title="Hapus"
                        aria-label={`Hapus ${item.title}`}
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
                        className={`${styles.iconButton} ${styles.editIconButton}`}
                        onClick={() => beginEdit(item)}
                        title="Edit"
                        aria-label={`Edit ${item.title}`}
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
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

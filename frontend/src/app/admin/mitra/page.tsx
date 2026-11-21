"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ImageField } from "@/components/admin/image-editor";
import { BusyOverlay, RequiredMark, Spinner, StoredImage } from "@/components/ui";
import { PencilEditIcon } from "@/components/ui/icons";
import landingData from "@/fixtures/landing.json";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import { IMAGE_FRAMES } from "@/lib/image-frames";
import type { ProcessedImage } from "@/lib/image-processing";
import { resolveApiAssetUrl } from "@/services/api-client";
import adminStyles from "../admin.module.css";
import styles from "./mitra.module.css";

interface SponsorRecord {
  id: number;
  type: "promo" | "event" | "sponsor";
  title: string;
  description: string | null;
  banner_image: string | null;
  website_url: string | null;
  is_active: boolean | number;
  sort_order: number;
}

const DEFAULT_PARTNER_TEXT =
  landingData.partners.description ||
  "Kami bangga dapat bermitra dan berkolaborasi bersama brand serta komunitas terkemuka ini.";

export default function AdminMitraPage() {
  const [partners, setPartners] = useState<SponsorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerText, setPartnerText] = useState(DEFAULT_PARTNER_TEXT);
  const [savedPartnerText, setSavedPartnerText] = useState(DEFAULT_PARTNER_TEXT);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isSavingText, setIsSavingText] = useState(false);

  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingPartner, setEditingPartner] = useState<SponsorRecord | null>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logo, setLogo] = useState<ProcessedImage | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
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

  const loadPartners = useCallback(async () => {
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const [records, description] = await Promise.all([
        adminApiRequest<SponsorRecord[]>("/admin/promos-events", session.token),
        adminApiRequest<string | null>("/admin/partner-description", session.token),
      ]);
      setPartners(records.filter((record) => record.type === "sponsor"));
      const resolvedDescription = description || DEFAULT_PARTNER_TEXT;
      setPartnerText(resolvedDescription);
      setSavedPartnerText(resolvedDescription);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Daftar mitra tidak dapat dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadPartners);
  }, [loadPartners]);

  const closeModal = useCallback(() => {
    setModalMode("closed");
    setEditingPartner(null);
    setName("");
    setWebsiteUrl("");
    setIsActive(true);
    setLogo(null);
    setModalError("");
  }, []);

  useEffect(() => {
    if (modalMode === "closed") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalMode, isSaving, closeModal]);

  const beginAdd = () => {
    setEditingPartner(null);
    setName("");
    setWebsiteUrl("");
    setIsActive(true);
    setLogo(null);
    setModalError("");
    setModalMode("add");
  };

  const beginEdit = (partner: SponsorRecord) => {
    setEditingPartner(partner);
    setName(partner.title);
    setWebsiteUrl(partner.website_url ?? "");
    setIsActive(Boolean(partner.is_active));
    setLogo(null);
    setModalError("");
    setModalMode("edit");
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session) {
      setModalError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    if (!name.trim()) {
      setModalError("Nama mitra wajib diisi.");
      return;
    }

    const trimmedUrl = websiteUrl.trim();
    if (trimmedUrl) {
      try {
        const parsed = new URL(trimmedUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setModalError("URL situs web harus diawali http:// atau https://.");
          return;
        }
      } catch {
        setModalError("Format URL situs web tidak valid.");
        return;
      }
    }

    const isEditing = modalMode === "edit" && editingPartner !== null;
    setIsSaving(true);
    setModalError("");

    try {
      const body = new FormData();
      body.append("title", name.trim());
      body.append("type", "sponsor");
      body.append("website_url", trimmedUrl);
      body.append("is_active", isActive ? "1" : "0");

      if (logo) {
        body.append("image", logo.file, logo.file.name);
      }

      if (!isEditing) {
        body.append("description", "");
        body.append("banner_image", "");
        body.append("start_date", "");
        body.append("end_date", "");
        body.append("terms", "");
        const nextOrder =
          partners.reduce((highest, item) => Math.max(highest, item.sort_order), -1) + 1;
        body.append("sort_order", String(nextOrder));
      } else {
        body.append("_method", "PATCH");
        body.append("sort_order", String(editingPartner.sort_order));
      }

      const saved = await adminApiRequest<SponsorRecord>(
        isEditing
          ? `/admin/promos-events/${editingPartner.id}`
          : "/admin/promos-events",
        session.token,
        { method: "POST", body },
      );

      setPartners((items) => {
        const updated = isEditing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved];
        return updated.sort(
          (first, second) => first.sort_order - second.sort_order || first.id - second.id,
        );
      });

      closeModal();
      showToast(
        isEditing ? "Mitra bisnis berhasil diperbarui." : "Mitra bisnis berhasil ditambahkan.",
      );
    } catch (reason) {
      setModalError(
        reason instanceof Error ? reason.message : "Data mitra gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (partner: SponsorRecord) => {
    if (!window.confirm(`Hapus mitra "${partner.title}"?`)) return;
    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    setDeletingId(partner.id);
    setError("");
    try {
      await adminApiRequest<unknown>(
        `/admin/promos-events/${partner.id}`,
        session.token,
        { method: "DELETE" },
      );
      setPartners((prev) => prev.filter((item) => item.id !== partner.id));
      showToast("Mitra bisnis berhasil dihapus.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Mitra gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSavePartnerText = async () => {
    const trimmed = partnerText.trim();
    if (!trimmed) {
      setPartnerText(savedPartnerText);
      setIsEditingText(false);
      setError("Teks mitra tidak boleh kosong.");
      return;
    }
    if (trimmed === savedPartnerText) {
      setPartnerText(trimmed);
      setIsEditingText(false);
      return;
    }

    const session = getAdminSession();
    if (!session) {
      setError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      setIsEditingText(false);
      return;
    }

    setIsSavingText(true);
    setError("");
    try {
      const saved = await adminApiRequest<string>(
        "/admin/partner-description",
        session.token,
        {
          method: "PATCH",
          body: JSON.stringify({ description: trimmed }),
        },
      );
      const nextText = saved || trimmed;
      setPartnerText(nextText);
      setSavedPartnerText(nextText);
      setIsEditingText(false);
      showToast("Teks mitra berhasil diperbarui.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Teks mitra gagal disimpan.",
      );
    } finally {
      setIsSavingText(false);
    }
  };

  return (
    <div>
      {toastMessage && (
        <div className={styles.toast} role="status">
          ✓ {toastMessage}
        </div>
      )}

      <div className={adminStyles.pageHeader}>
        <h1 className={adminStyles.pageTitle}>Kelola Mitra Bisnis</h1>
        <button
          type="button"
          className={adminStyles.btnOrange}
          onClick={beginAdd}
        >
          + Tambah Mitra Bisnis Baru
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadPartners()}>
            Coba lagi
          </button>
        </div>
      )}

      <div className={adminStyles.card}>
        <table className={adminStyles.table}>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Logo Mitra</th>
              <th style={{ width: "45%" }}>Nama Mitra</th>
              <th style={{ width: "20%" }}>Status</th>
              <th style={{ width: "15%" }}>Kelola</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  Memuat daftar mitra...
                </td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  Belum ada mitra bisnis terdaftar. Tambahkan mitra baru untuk mulai.
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id}>
                  <td>
                    <div className={styles.logoCircle}>
                      <StoredImage
                        src={resolveApiAssetUrl(partner.banner_image)}
                        alt={partner.title}
                        className={styles.logoImage}
                        emptyLabel=""
                      />
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "#090d12" }}>
                    <div>{partner.title}</div>
                    {partner.website_url && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#64748b" }}>
                        {partner.website_url}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        partner.is_active ? adminStyles.badgeGreen : styles.badgeInactive
                      }
                    >
                      {partner.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => void handleDelete(partner)}
                        disabled={deletingId === partner.id}
                        title="Hapus"
                        aria-label={`Hapus mitra ${partner.title}`}
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
                        className={styles.iconBtn}
                        title="Edit"
                        aria-label={`Edit mitra ${partner.title}`}
                        onClick={() => beginEdit(partner)}
                      >
                        <PencilEditIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Section: Mitra Kami Text */}
      <div className={styles.bottomCard}>
        <h3 className={styles.bottomCardTitle}>Mitra Kami</h3>
        <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 6px 0" }}>
          Teks
        </p>
        <div className={styles.textBox}>
          {isEditingText ? (
            <input
              type="text"
              value={partnerText}
              onChange={(e) => setPartnerText(e.target.value)}
              className={styles.formInput}
              style={{ margin: 0 }}
              maxLength={1000}
              disabled={isSavingText}
              onBlur={() => {
                void handleSavePartnerText();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSavePartnerText();
                } else if (e.key === "Escape") {
                  setPartnerText(savedPartnerText);
                  setIsEditingText(false);
                }
              }}
              autoFocus
            />
          ) : (
            <p className={styles.textValue}>{partnerText}</p>
          )}
          <button
            type="button"
            className={styles.iconBtn}
            disabled={isSavingText}
            onClick={() => {
              if (isEditingText) {
                void handleSavePartnerText();
              } else {
                setIsEditingText(true);
              }
            }}
            title={isEditingText ? "Simpan Teks" : "Edit Teks"}
            aria-label={isEditingText ? "Simpan teks mitra" : "Edit teks mitra"}
          >
            <PencilEditIcon size={16} />
          </button>
        </div>
      </div>

      {/* Add / Edit Partner Modal */}
      {modalMode !== "closed" && (
        <div
          className={adminStyles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) closeModal();
          }}
        >
          <div className={adminStyles.modalCard} role="dialog" aria-modal="true">
            <div className={adminStyles.modalHeader}>
              <div>
                <h3 className={adminStyles.modalTitle}>
                  {modalMode === "edit" ? "Edit Mitra Bisnis" : "Tambah Mitra Bisnis"}
                </h3>
                <p className={adminStyles.modalSubtitle}>
                  {modalMode === "edit"
                    ? "Perbarui nama dan logo mitra."
                    : "Tambah nama dan logo mitra."}
                </p>
              </div>
              <button
                type="button"
                className={adminStyles.modalCloseBtn}
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className={styles.errorMessage} role="alert">
                <span>{modalError}</span>
              </div>
            )}

            <form
              className={styles.modalForm}
              onSubmit={handleSave}
              aria-busy={isSaving}
            >
              <fieldset className={styles.modalFieldset} disabled={isSaving}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="partnerName" className={styles.fieldLabel}>
                    Nama Mitra
                    <RequiredMark />
                  </label>
                  <input
                    id="partnerName"
                    type="text"
                    placeholder="Masukkan nama mitra..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="partnerWebsite" className={styles.fieldLabel}>
                    Website Mitra (opsional)
                  </label>
                  <input
                    id="partnerWebsite"
                    type="url"
                    placeholder="https://contoh-mitra.co.id"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    maxLength={255}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Logo Mitra</span>
                  <div className={styles.logoEditorBox}>
                    <ImageField
                      id="partnerLogo"
                      label="Logo mitra"
                      frame={IMAGE_FRAMES.partner}
                      value={logo}
                      onChange={setLogo}
                      currentUrl={
                        modalMode === "edit" && editingPartner
                          ? resolveApiAssetUrl(editingPartner.banner_image) || null
                          : undefined
                      }
                      promptTitle="Pilih Logo dari Perangkat"
                      disabled={isSaving}
                    />
                  </div>
                  <p className={styles.uploadHelper}>
                    Logo akan ditampilkan dalam bingkai lingkaran di situs. Anda dapat mengatur zoom dan posisi sebelum mengunggah.
                  </p>
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Tampilkan sebagai mitra aktif
                </label>

                <div className={adminStyles.modalActions}>
                  <button
                    type="button"
                    className={adminStyles.btnOutline}
                    onClick={closeModal}
                    disabled={isSaving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={adminStyles.btnNavy}
                    disabled={isSaving || !name.trim()}
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
                {logo ? "Mengunggah logo dan menyimpan mitra..." : "Menyimpan data mitra..."}
              </BusyOverlay>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

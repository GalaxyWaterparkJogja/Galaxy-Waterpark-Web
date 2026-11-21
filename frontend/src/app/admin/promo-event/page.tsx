"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { ImageField } from "@/components/admin/image-editor";
import { BusyOverlay, RequiredMark, Spinner } from "@/components/ui";
import { PencilEditIcon } from "@/components/ui/icons";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import { IMAGE_FRAMES } from "@/lib/image-frames";
import type { ProcessedImage } from "@/lib/image-processing";
import { resolveApiAssetUrl } from "@/services/api-client";

interface PromoEventItem {
  id: number;
  type: "promo" | "event";
  title: string;
  period: string;
  description: string;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  terms: string | null;
  is_active: boolean;
  sort_order: number;
  status: "Aktif" | "Nonaktif";
}

interface PromoEventRecord {
  id: number;
  type: "promo" | "event" | "sponsor";
  title: string;
  description: string | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  terms: string | null;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
}

type PromoEventViewMode =
  | "list"
  | "add-promo"
  | "edit-promo"
  | "add-event"
  | "edit-event";

function toDisplayPeriod(startDate: string | null, endDate: string | null): string {
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `Mulai ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;
  return "Tanpa batas waktu";
}

function toPromoEventItem(
  record: PromoEventRecord,
  type: "promo" | "event",
): PromoEventItem {
  return {
    id: record.id,
    type,
    title: record.title,
    period: toDisplayPeriod(record.start_date, record.end_date),
    description: record.description || "",
    banner_image: resolveApiAssetUrl(record.banner_image) || null,
    start_date: record.start_date,
    end_date: record.end_date,
    terms: record.terms,
    is_active: Boolean(record.is_active),
    sort_order: record.sort_order,
    status: record.is_active ? "Aktif" : "Nonaktif",
  };
}

export default function AdminPromoEventPage() {
  const [promos, setPromos] = useState<PromoEventItem[]>([]);
  const [events, setEvents] = useState<PromoEventItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "promo" | "event">("all");
  const [viewMode, setViewMode] = useState<PromoEventViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pageError, setPageError] = useState("");

  // Editing state
  const [editingItem, setEditingItem] = useState<PromoEventItem | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
    is_active: true,
  });

  // Adding state
  const [addType, setAddType] = useState<"promo" | "event">("promo");
  const [addDraft, setAddDraft] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
    is_active: true,
  });

  // Shared processed WebP image for whichever form is open
  const [image, setImage] = useState<ProcessedImage | null>(null);

  // Toast feedback
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

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return;
        const session = getAdminSession();
        if (!session) {
          throw new Error("Sesi admin tidak ditemukan. Silakan masuk kembali.");
        }
        return adminApiRequest<PromoEventRecord[]>("/admin/promos-events", session.token);
      })
      .then((records) => {
        if (!active || !records) return;
        setPromos(
          records
            .filter((item) => item.type === "promo")
            .map((item) => toPromoEventItem(item, "promo")),
        );
        setEvents(
          records
            .filter((item) => item.type === "event")
            .map((item) => toPromoEventItem(item, "event")),
        );
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setPageError(
          reason instanceof Error ? reason.message : "Promo & event tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const closeForm = () => {
    setViewMode("list");
    setEditingItem(null);
    setImage(null);
    setPageError("");
  };

  // Handle ESC key to dismiss sub-views when not saving
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && viewMode !== "list") {
        setViewMode("list");
        setEditingItem(null);
        setImage(null);
        setPageError("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, viewMode]);

  const totalCount = promos.length + events.length;

  const handleDelete = async (item: PromoEventItem) => {
    if (
      !window.confirm(
        `Hapus ${item.type === "promo" ? "promo" : "event"} "${item.title}"?`,
      )
    ) {
      return;
    }

    const session = getAdminSession();
    if (!session) {
      setPageError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    setDeletingId(item.id);
    setPageError("");
    try {
      await adminApiRequest(`/admin/promos-events/${item.id}`, session.token, {
        method: "DELETE",
      });
      if (item.type === "promo") {
        setPromos((previous) => previous.filter((entry) => entry.id !== item.id));
      } else {
        setEvents((previous) => previous.filter((entry) => entry.id !== item.id));
      }
      showToast(
        item.type === "promo"
          ? "Promo berhasil dihapus."
          : "Event berhasil dihapus.",
      );
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : "Konten gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (item: PromoEventItem) => {
    setEditingItem(item);
    setEditDraft({
      title: item.title,
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      description: item.description,
      is_active: item.is_active,
    });
    setImage(null);
    setPageError("");
    setViewMode(item.type === "promo" ? "edit-promo" : "edit-event");
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const session = getAdminSession();
    if (!session) {
      setPageError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    if (!editDraft.title.trim()) {
      setPageError(
        editingItem.type === "promo"
          ? "Nama promo wajib diisi."
          : "Nama event wajib diisi.",
      );
      return;
    }
    if (
      editDraft.start_date &&
      editDraft.end_date &&
      editDraft.end_date < editDraft.start_date
    ) {
      setPageError("Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setIsSaving(true);
    setPageError("");
    try {
      const body = new FormData();
      body.append("_method", "PATCH");
      body.append("title", editDraft.title.trim());
      body.append("type", editingItem.type);
      body.append("description", editDraft.description.trim());
      body.append("start_date", editDraft.start_date);
      body.append("end_date", editDraft.end_date);
      body.append("terms", editingItem.terms || "");
      body.append("is_active", editDraft.is_active ? "1" : "0");
      body.append("sort_order", String(editingItem.sort_order));
      // Omit image when unchanged so existing banner_image is preserved.
      if (image) body.append("image", image.file, image.file.name);

      const record = await adminApiRequest<PromoEventRecord>(
        `/admin/promos-events/${editingItem.id}`,
        session.token,
        { method: "POST", body },
      );

      if (record.type === "promo") {
        const saved = toPromoEventItem(record, "promo");
        setPromos((previous) =>
          previous.map((item) => (item.id === saved.id ? saved : item)),
        );
      } else if (record.type === "event") {
        const saved = toPromoEventItem(record, "event");
        setEvents((previous) =>
          previous.map((item) => (item.id === saved.id ? saved : item)),
        );
      }

      closeForm();
      showToast(
        editingItem.type === "promo"
          ? "Promo berhasil diperbarui!"
          : "Event berhasil diperbarui!",
      );
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : "Konten gagal diperbarui.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAdd = (targetType: "promo" | "event" = "promo") => {
    setAddType(targetType);
    setAddDraft({
      title: "",
      start_date: "",
      end_date: "",
      description: "",
      is_active: true,
    });
    setImage(null);
    setPageError("");
    setViewMode(targetType === "promo" ? "add-promo" : "add-event");
  };

  const handleSaveAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const session = getAdminSession();
    if (!session) {
      setPageError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    if (!addDraft.title.trim()) {
      setPageError(
        addType === "promo" ? "Nama promo wajib diisi." : "Nama event wajib diisi.",
      );
      return;
    }
    if (
      addDraft.start_date &&
      addDraft.end_date &&
      addDraft.end_date < addDraft.start_date
    ) {
      setPageError("Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setIsSaving(true);
    setPageError("");
    try {
      const body = new FormData();
      body.append("title", addDraft.title.trim());
      body.append("type", addType);
      body.append("description", addDraft.description.trim());
      body.append("banner_image", "");
      body.append("start_date", addDraft.start_date);
      body.append("end_date", addDraft.end_date);
      body.append("terms", "");
      body.append("website_url", "");
      body.append("is_active", addDraft.is_active ? "1" : "0");
      body.append("sort_order", String(promos.length + events.length));
      if (image) body.append("image", image.file, image.file.name);

      const record = await adminApiRequest<PromoEventRecord>(
        "/admin/promos-events",
        session.token,
        { method: "POST", body },
      );

      if (record.type === "promo") {
        setPromos((previous) => [toPromoEventItem(record, "promo"), ...previous]);
      } else if (record.type === "event") {
        setEvents((previous) => [toPromoEventItem(record, "event"), ...previous]);
      }

      setAddDraft({
        title: "",
        start_date: "",
        end_date: "",
        description: "",
        is_active: true,
      });
      closeForm();
      showToast(
        addType === "promo"
          ? "Promo baru berhasil ditambahkan!"
          : "Event baru berhasil ditambahkan!",
      );
    } catch (reason) {
      setPageError(reason instanceof Error ? reason.message : "Konten gagal ditambahkan.");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-VIEW: EDIT PROMO & EDIT EVENT
  // --------------------------------------------------------------------------
  if ((viewMode === "edit-promo" || viewMode === "edit-event") && editingItem) {
    const isPromo = viewMode === "edit-promo";
    return (
      <div className="w-full max-w-[1062px] pb-12">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            aria-label="Tutup"
            title="Tutup"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#023047] hover:bg-slate-200 transition-colors text-2xl font-bold cursor-pointer disabled:opacity-50"
          >
            ‹
          </button>
          <h1 className="text-2xl lg:text-[28px] font-bold text-[#090d12]">
            {isPromo ? "Kelola Promo" : "Kelola Event"}
          </h1>
        </div>
        {pageError && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {pageError}
          </p>
        )}

        <form
          onSubmit={handleSaveEdit}
          aria-busy={isSaving}
          className="relative modalCard border-2 border-[#023047] rounded-2xl overflow-hidden bg-white shadow-sm"
        >
          <span className="sr-only">Edit Promo</span>
          <fieldset
            disabled={isSaving}
            className="grid grid-cols-1 lg:grid-cols-2 border-0 p-0 m-0 min-w-0"
          >
            <div className="min-h-[380px] lg:min-h-[540px] border-b lg:border-b-0 lg:border-r border-slate-200">
              <ImageField
                id="edit-promo-event-image"
                label={isPromo ? "Poster promo" : "Poster event"}
                frame={isPromo ? IMAGE_FRAMES.promo : IMAGE_FRAMES.event}
                value={image}
                onChange={setImage}
                currentUrl={editingItem.banner_image}
                disabled={isSaving}
              />
            </div>

            <div className="p-8 lg:p-10 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="editPromoTitle"
                    className="block text-sm font-bold text-[#023047] mb-2"
                  >
                    {isPromo ? "Nama Promo" : "Nama Event"}
                    <RequiredMark />
                  </label>
                  <input
                    id="editPromoTitle"
                    type="text"
                    value={editDraft.title}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, title: e.target.value })
                    }
                    maxLength={100}
                    className="w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12] focus:ring-2 focus:ring-[#023047] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-bold text-[#023047]">
                    Mulai
                    <input
                      type="date"
                      value={editDraft.start_date}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, start_date: e.target.value })
                      }
                      className="mt-2 w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12]"
                    />
                  </label>
                  <label className="block text-sm font-bold text-[#023047]">
                    Berakhir
                    <input
                      type="date"
                      value={editDraft.end_date}
                      min={editDraft.start_date || undefined}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, end_date: e.target.value })
                      }
                      className="mt-2 w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12]"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-[#023047]">
                  <input
                    type="checkbox"
                    checked={editDraft.is_active}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, is_active: e.target.checked })
                    }
                  />
                  Tampilkan sebagai aktif
                </label>

                <div>
                  <label
                    htmlFor="promoDesc"
                    className="block text-sm font-bold text-[#023047] mb-2"
                  >
                    Keterangan
                  </label>
                  <textarea
                    id="promoDesc"
                    rows={6}
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, description: e.target.value })
                    }
                    maxLength={10000}
                    className="w-full p-4 rounded-lg border border-[#023047] text-xs text-[#090d12] leading-relaxed focus:ring-2 focus:ring-[#023047] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="w-full h-[40px] rounded-lg border border-[#94a3b8] text-[#023047] text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center disabled:opacity-55"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editDraft.title.trim()}
                  className="w-full h-[40px] rounded-lg bg-[#023047] text-white text-sm font-semibold hover:bg-[#034566] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55"
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
            {image
              ? "Mengunggah foto dan menyimpan perubahan..."
              : "Menyimpan perubahan..."}
          </BusyOverlay>
        </form>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SUB-VIEW: TAMBAH PROMO BARU & TAMBAH EVENT BARU
  // --------------------------------------------------------------------------
  if (viewMode === "add-promo" || viewMode === "add-event") {
    const isPromo = addType === "promo";
    return (
      <div className="w-full max-w-[1062px] pb-12">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            aria-label="Tutup"
            title="Tutup"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#023047] hover:bg-slate-200 transition-colors text-2xl font-bold cursor-pointer disabled:opacity-50"
          >
            ‹
          </button>
          <h1 className="text-2xl lg:text-[28px] font-bold text-[#090d12]">
            {isPromo ? "Tambah Promo Baru" : "Tambah Event Baru"}
          </h1>
        </div>
        {pageError && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {pageError}
          </p>
        )}

        <form
          onSubmit={handleSaveAdd}
          aria-busy={isSaving}
          className="relative modalCard border-2 border-[#023047] rounded-2xl overflow-hidden bg-white shadow-sm"
        >
          <span className="sr-only">Tambah Promo & Event</span>
          <fieldset
            disabled={isSaving}
            className="grid grid-cols-1 lg:grid-cols-2 border-0 p-0 m-0 min-w-0"
          >
            <div className="min-h-[380px] lg:min-h-[540px] border-b lg:border-b-0 lg:border-r border-slate-200">
              <ImageField
                id="add-promo-event-image"
                label={isPromo ? "Poster promo" : "Poster event"}
                frame={isPromo ? IMAGE_FRAMES.promo : IMAGE_FRAMES.event}
                value={image}
                onChange={setImage}
                currentUrl={undefined}
                disabled={isSaving}
              />
            </div>

            <div className="p-8 lg:p-10 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="promoType"
                    className="block text-sm font-bold text-[#023047] mb-1"
                  >
                    Tipe
                    <RequiredMark />
                  </label>
                  <select
                    id="promoType"
                    value={addType}
                    onChange={(e) => {
                      const nextType = e.target.value as "promo" | "event";
                      setAddType(nextType);
                      setViewMode(nextType === "promo" ? "add-promo" : "add-event");
                      setImage(null);
                    }}
                    className="w-full h-[46px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12] outline-none"
                    required
                  >
                    <option value="promo">Promo</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="promoTitle"
                    className="block text-sm font-bold text-[#023047] mb-1"
                  >
                    {isPromo ? "Nama Promo" : "Nama Event"}
                    <RequiredMark />
                  </label>
                  <input
                    id="promoTitle"
                    type="text"
                    placeholder={
                      isPromo
                        ? "Contoh: Promo Libur Akhir Tahun"
                        : "Contoh: Dive Into Happiness"
                    }
                    value={addDraft.title}
                    onChange={(e) =>
                      setAddDraft({ ...addDraft, title: e.target.value })
                    }
                    maxLength={100}
                    className="w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12] focus:ring-2 focus:ring-[#023047] outline-none"
                    required
                  />
                </div>

                <div>
                  <span className="block text-sm font-bold text-[#023047] mb-1">
                    Periode Berlaku
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-[#023047]">
                      Mulai
                      <input
                        type="date"
                        value={addDraft.start_date}
                        onChange={(e) =>
                          setAddDraft({ ...addDraft, start_date: e.target.value })
                        }
                        className="mt-2 w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12]"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#023047]">
                      Berakhir
                      <input
                        type="date"
                        value={addDraft.end_date}
                        min={addDraft.start_date || undefined}
                        onChange={(e) =>
                          setAddDraft({ ...addDraft, end_date: e.target.value })
                        }
                        className="mt-2 w-full h-[48px] px-4 rounded-lg border border-[#023047] text-sm text-[#090d12]"
                      />
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-[#023047]">
                  <input
                    type="checkbox"
                    checked={addDraft.is_active}
                    onChange={(e) =>
                      setAddDraft({ ...addDraft, is_active: e.target.checked })
                    }
                  />
                  Tampilkan sebagai aktif
                </label>

                <div>
                  <label
                    htmlFor="promoDesc"
                    className="block text-sm font-bold text-[#023047] mb-1"
                  >
                    Keterangan
                  </label>
                  <textarea
                    id="promoDesc"
                    rows={4}
                    placeholder="Tuliskan rincian dan ketentuan promo..."
                    value={addDraft.description}
                    onChange={(e) =>
                      setAddDraft({ ...addDraft, description: e.target.value })
                    }
                    maxLength={10000}
                    className="w-full p-4 rounded-lg border border-[#023047] text-xs text-[#090d12] leading-relaxed focus:ring-2 focus:ring-[#023047] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="w-full h-[40px] rounded-lg border border-[#94a3b8] text-[#023047] text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center disabled:opacity-55"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !addDraft.title.trim()}
                  className="w-full h-[40px] rounded-lg bg-[#023047] text-white text-sm font-semibold hover:bg-[#034566] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-55"
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
            {image
              ? `Mengunggah foto dan menyimpan ${isPromo ? "promo" : "event"}...`
              : `Menyimpan ${isPromo ? "promo" : "event"}...`}
          </BusyOverlay>
        </form>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DUAL STACKED TABLES (Kelola Promo & Kelola Event)
  // --------------------------------------------------------------------------
  return (
    <div className="w-full max-w-[1062px] pb-12">
      {pageError && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </p>
      )}

      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#023047] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2"
          role="status"
        >
          <span>✓</span> {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-[28px] font-bold text-[#090d12]">
          Kelola Promo & Event
        </h1>
        <button
          type="button"
          onClick={() => handleStartAdd("promo")}
          className="bg-[#fb8500] hover:bg-[#ea7a00] text-white text-sm font-semibold h-[40px] px-5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          + Tambah Promo & Event
        </button>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500" role="status">
          Memuat promo dan event...
        </p>
      ) : (
        <>
          <div className="mb-8">
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#023047] text-white border-[#023047]"
                    : "bg-white text-[#475569] border-[#cbd5e1] hover:bg-slate-50"
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("promo")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                  activeTab === "promo"
                    ? "bg-[#023047] text-white border-[#023047]"
                    : "bg-white text-[#475569] border-[#cbd5e1] hover:bg-slate-50"
                }`}
              >
                Promo ({promos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("event")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                  activeTab === "event"
                    ? "bg-[#023047] text-white border-[#023047]"
                    : "bg-white text-[#475569] border-[#cbd5e1] hover:bg-slate-50"
                }`}
              >
                Event ({events.length})
              </button>
            </div>
          </div>

          {(activeTab === "all" || activeTab === "promo") && (
            <div className="mb-14">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl lg:text-2xl font-bold text-[#090d12]">
                  Kelola Promo
                </h2>
                <button
                  type="button"
                  onClick={() => handleStartAdd("promo")}
                  className="bg-[#fb8500] hover:bg-[#ea7a00] text-white text-sm font-semibold h-[40px] px-5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  + Tambah Promo Baru
                </button>
              </div>

              <div className="border-2 border-[#023047] rounded-2xl overflow-hidden bg-white shadow-[0_4px_12px_rgba(2,48,71,0.12)]">
                <div className="bg-[#023047] text-white font-semibold text-sm px-6 py-4 flex items-center">
                  <div className="w-[25%]">Nama Promo</div>
                  <div className="w-[43%]">Ringkasan</div>
                  <div className="w-[20%]">Periode Berlaku</div>
                  <div className="w-[12%] text-center">Kelola</div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-200">
                  {promos.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-slate-500 m-0">
                      Belum ada promo yang tersimpan.
                    </p>
                  ) : (
                    promos.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-[25%] pr-2">
                          <h3 className="font-semibold text-[15px] text-[#090d12] m-0">
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-[#023047] inline-block mt-1">
                            PROMO
                          </span>
                          <span
                            className={`ml-2 text-[10px] font-semibold ${
                              item.is_active ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="w-[43%] pr-2">
                          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 m-0">
                            {item.description || "Belum ada keterangan."}
                          </p>
                        </div>
                        <div className="w-[20%]">
                          <span className="text-xs text-[#090d12] font-normal">
                            {item.period}
                          </span>
                        </div>
                        <div className="w-[12%] flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Hapus promo"
                            aria-label={`Hapus promo ${item.title}`}
                            className="w-[30px] h-[30px] rounded-[6px] bg-[#d00416] flex items-center justify-center text-white hover:bg-[#b00313] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <svg
                              width="14"
                              height="14"
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
                            onClick={() => handleStartEdit(item)}
                            title="Edit promo"
                            aria-label={`Edit promo ${item.title}`}
                            className="w-[30px] h-[30px] rounded-[6px] bg-white border border-[#023047] flex items-center justify-center text-[#023047] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <PencilEditIcon size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {(activeTab === "all" || activeTab === "event") && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl lg:text-2xl font-bold text-[#090d12]">
                  Kelola Event
                </h2>
                <button
                  type="button"
                  onClick={() => handleStartAdd("event")}
                  className="bg-[#fb8500] hover:bg-[#ea7a00] text-white text-sm font-semibold h-[40px] px-5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  + Tambah Event Baru
                </button>
              </div>

              <div className="border-2 border-[#023047] rounded-2xl overflow-hidden bg-white shadow-[0_4px_12px_rgba(2,48,71,0.12)]">
                <div className="bg-[#023047] text-white font-semibold text-sm px-6 py-4 flex items-center">
                  <div className="w-[25%]">Nama Event</div>
                  <div className="w-[43%]">Ringkasan</div>
                  <div className="w-[20%]">Periode Berlaku</div>
                  <div className="w-[12%] text-center">Kelola</div>
                </div>

                <div className="grid grid-cols-1 divide-y divide-slate-200">
                  {events.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-slate-500 m-0">
                      Belum ada event yang tersimpan.
                    </p>
                  ) : (
                    events.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-[25%] pr-2">
                          <h3 className="font-semibold text-[15px] text-[#090d12] m-0">
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-[#065f46] inline-block mt-1">
                            EVENT
                          </span>
                          <span
                            className={`ml-2 text-[10px] font-semibold ${
                              item.is_active ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="w-[43%] pr-2">
                          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 m-0">
                            {item.description || "Belum ada keterangan."}
                          </p>
                        </div>
                        <div className="w-[20%]">
                          <span className="text-xs text-[#090d12] font-normal">
                            {item.period}
                          </span>
                        </div>
                        <div className="w-[12%] flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Hapus event"
                            aria-label={`Hapus event ${item.title}`}
                            className="w-[30px] h-[30px] rounded-[6px] bg-[#d00416] flex items-center justify-center text-white hover:bg-[#b00313] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <svg
                              width="14"
                              height="14"
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
                            onClick={() => handleStartEdit(item)}
                            title="Edit event"
                            aria-label={`Edit event ${item.title}`}
                            className="w-[30px] h-[30px] rounded-[6px] bg-white border border-[#023047] flex items-center justify-center text-[#023047] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <PencilEditIcon size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

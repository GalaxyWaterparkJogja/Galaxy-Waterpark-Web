"use client";

import { useEffect, useState } from "react";
import { RequiredMark } from "@/components/ui";
import landingData from "@/fixtures/landing.json";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";

// Type definitions
interface ScheduleItem {
  id: "weekday" | "weekend";
  title: string;
  badgeLabel: string;
  badgeType: "blue" | "yellow";
  openTime: string;
  closeTime: string;
}

interface TicketItem {
  id: string;
  label: string;
  age: string;
  weekday: string;
  weekend: string;
}

interface BackendTicketItem {
  id: number;
  category_name: string;
  price: number | string;
  weekday_price: number | string | null;
  weekend_price: number | string | null;
  age_min: number | null;
  age_max: number | null;
  is_active: boolean;
}

interface BackendScheduleItem {
  operating_hours: string | null;
  holiday_info: string | null;
}

function formatRupiah(value: number | string | null): string {
  const amount = Number(value ?? 0);
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

function formatAge(min: number | null, max: number | null): string {
  if (min === null && max === null) return "";
  if (min !== null && max !== null) return `${min}-${max} Tahun`;
  if (min !== null) return `> ${min} Tahun`;
  return `0-${max} Tahun`;
}

function parseAge(value: string): { ageMin: number; ageMax: number | null } {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [];
  return {
    ageMin: numbers[0] ?? 0,
    ageMax: numbers[1] ?? null,
  };
}

function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;

  const hour = Math.min(Number(digits.slice(0, 2)), 23);
  const minute = Math.min(Number(digits.slice(2)), 59);
  return `${String(hour).padStart(2, "0")}.${String(minute).padStart(2, "0")}`;
}

function formatRupiahInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `Rp${Number(digits).toLocaleString("id-ID")}`;
}

function formatAgeInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith(">")) {
    const age = trimmed.replace(/[^\d]/g, "");
    return age ? `> ${age} Tahun` : "";
  }

  const range = trimmed.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]} Tahun`;

  const age = trimmed.replace(/[^\d]/g, "");
  return age ? `${age} Tahun` : "";
}

function formatRawAgeInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith(">")) {
    return `> ${trimmed.replace(/[^\d]/g, "")}`;
  }
  return trimmed.replace(/[^\d-]/g, "").replace(/-+/g, "-");
}

export default function AdminTiketOperasionalPage() {
  // 1. Initial State synchronized with landing.json
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: "weekday",
      title: "Weekdays",
      badgeLabel: landingData.schedule?.weekday_label || "Senin-Kamis",
      badgeType: "blue",
      openTime: "09.00",
      closeTime: "16.00",
    },
    {
      id: "weekend",
      title: "Weekend",
      badgeLabel: landingData.schedule?.weekend_label || "Sabtu-Minggu",
      badgeType: "yellow",
      openTime: "08.00",
      closeTime: "16.00",
    },
  ]);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);

  // In-card inline editing state for Jam Operasional
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ openTime: "", closeTime: "" });

  // In-card inline editing state for Tickets (Category View)
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketDraft, setTicketDraft] = useState({ age: "", weekday: "", weekend: "" });
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);
  const [ticketViewMode] = useState<"category" | "day">("category");
  const [selectedCatWeekday, setSelectedCatWeekday] = useState("infant");
  const [selectedCatWeekend, setSelectedCatWeekend] = useState("infant");
  const [editingDayCard, setEditingDayCard] = useState<"weekday" | "weekend" | null>(null);
  const [dayDraftWeekday, setDayDraftWeekday] = useState({ age: "", price: "" });
  const [dayDraftWeekend, setDayDraftWeekend] = useState({ age: "", price: "" });
  const [closedLabel, setClosedLabel] = useState(
    landingData.schedule?.closed_label || "Jadwal operasional mengikuti pengumuman resmi.",
  );

  // Toast & validation error feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      queueMicrotask(() => {
        setIsTicketsLoading(false);
        setToastMessage("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      });
      return;
    }

    void Promise.all([
      adminApiRequest<BackendScheduleItem>("/admin/schedule", session.token),
      adminApiRequest<BackendTicketItem[]>("/admin/tickets", session.token),
    ]).then(([schedule, backendTickets]) => {
      if (schedule) {
        setClosedLabel(
          schedule.holiday_info ||
            landingData.schedule?.closed_label ||
            "Jadwal operasional mengikuti pengumuman resmi.",
        );
        let operatingData: {
          weekday_label?: string;
          weekday_open?: string;
          weekday_close?: string;
          weekend_label?: string;
          weekend_open?: string;
          weekend_close?: string;
        } | null = null;

        try {
          if (schedule.operating_hours?.trim().startsWith("{")) {
            operatingData = JSON.parse(schedule.operating_hours);
          }
        } catch {
          operatingData = null;
        }

        setSchedules([
          {
            id: "weekday",
            title: "Weekdays",
            badgeLabel: operatingData?.weekday_label || "Senin-Kamis",
            badgeType: "blue",
            openTime: operatingData?.weekday_open || "09.00",
            closeTime: operatingData?.weekday_close || "16.00",
          },
          {
            id: "weekend",
            title: "Weekend",
            badgeLabel: operatingData?.weekend_label || "Sabtu-Minggu",
            badgeType: "yellow",
            openTime: operatingData?.weekend_open || "08.00",
            closeTime: operatingData?.weekend_close || "16.00",
          },
        ]);
      }

      if (backendTickets.length > 0) {
        setTickets(
          backendTickets.map((ticket) => ({
            id: String(ticket.id),
            label: ticket.category_name,
            age: formatAge(ticket.age_min, ticket.age_max),
            weekday: formatRupiah(ticket.weekday_price ?? ticket.price),
            weekend: formatRupiah(ticket.weekend_price ?? ticket.price),
          })),
        );
      }
      setIsTicketsLoading(false);
    }).catch((reason) => {
      setToastMessage(reason instanceof Error ? reason.message : "Data operasional gagal dimuat.");
      setIsTicketsLoading(false);
    });
  }, []);

  // -------------------------------------------------------------
  // SCHEDULE HANDLERS
  // -------------------------------------------------------------
  const handleStartEditSchedule = (item: ScheduleItem) => {
    setFormError(null);
    setEditingScheduleId(item.id);
    setScheduleDraft({ openTime: item.openTime, closeTime: item.closeTime });
  };

  const handleCancelSchedule = () => {
    setFormError(null);
    setEditingScheduleId(null);
  };

  const handleSaveSchedule = async (id: string) => {
    const session = getAdminSession();
    if (!session) {
      setFormError("Sesi admin tidak ditemukan.");
      return;
    }

    const openTrimmed = scheduleDraft.openTime.trim();
    const closeTrimmed = scheduleDraft.closeTime.trim();
    const timePattern = /^\d{2}\.\d{2}$/;
    if (!openTrimmed || !timePattern.test(openTrimmed)) {
      setFormError("Jam buka wajib diisi dengan format JJ.MM (contoh: 09.00).");
      return;
    }
    if (!closeTrimmed || !timePattern.test(closeTrimmed)) {
      setFormError("Jam tutup wajib diisi dengan format JJ.MM (contoh: 16.00).");
      return;
    }
    setFormError(null);

    const currentWeekday =
      schedules.find((item) => item.id === "weekday") ||
      schedules.find((item) => item.id === id);
    const currentWeekend =
      schedules.find((item) => item.id === "weekend") ||
      schedules.find((item) => item.id === id);
    const updatedWeekday =
      id === "weekday"
        ? {
            ...currentWeekday!,
            openTime: openTrimmed,
            closeTime: closeTrimmed,
          }
        : currentWeekday!;
    const updatedWeekend =
      id === "weekend"
        ? {
            ...currentWeekend!,
            openTime: openTrimmed,
            closeTime: closeTrimmed,
          }
        : currentWeekend!;

    try {
      await adminApiRequest<BackendScheduleItem>(
        "/admin/schedule",
        session.token,
        {
          method: "PATCH",
          body: JSON.stringify({
            operating_hours: JSON.stringify({
              weekday_label: updatedWeekday.badgeLabel,
              weekday_open: updatedWeekday.openTime,
              weekday_close: updatedWeekday.closeTime,
              weekend_label: updatedWeekend.badgeLabel,
              weekend_open: updatedWeekend.openTime,
              weekend_close: updatedWeekend.closeTime,
            }),
            holiday_info: closedLabel,
          }),
        },
      );
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === "weekday"
            ? updatedWeekday
            : item.id === "weekend"
              ? updatedWeekend
              : item,
        ),
      );
      setEditingScheduleId(null);
      showToast("Jam operasional berhasil diperbarui!");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Jam operasional gagal disimpan.");
    }
  };

  // -------------------------------------------------------------
  // TICKET HANDLERS (CATEGORY VIEW)
  // -------------------------------------------------------------
  const handleStartEditTicket = (item: TicketItem) => {
    setFormError(null);
    setEditingTicketId(item.id);
    setTicketDraft({ age: item.age, weekday: item.weekday, weekend: item.weekend });
  };

  const handleCancelTicket = () => {
    setFormError(null);
    setEditingTicketId(null);
  };

  const handleSaveTicketPrices = async (
    current: TicketItem,
    changes: Partial<Pick<TicketItem, "age" | "weekday" | "weekend">>,
  ): Promise<boolean> => {
    const session = getAdminSession();
    if (!session) {
      setFormError("Sesi admin tidak ditemukan.");
      return false;
    }

    if (changes.weekday !== undefined && !/\d/.test(changes.weekday)) {
      setFormError("Tarif weekday wajib diisi.");
      return false;
    }
    if (changes.weekend !== undefined && !/\d/.test(changes.weekend)) {
      setFormError("Tarif weekend wajib diisi.");
      return false;
    }

    const age = changes.age?.trim() || current.age;
    const weekday = changes.weekday?.trim() || current.weekday;
    const weekend = changes.weekend?.trim() || current.weekend;
    const body: Record<string, number | null> = {
      price: parseRupiah(weekday),
      weekday_price: parseRupiah(weekday),
      weekend_price: parseRupiah(weekend),
    };
    if (changes.age?.trim() && age !== current.age) {
      const { ageMin, ageMax } = parseAge(age);
      if (ageMax !== null && ageMax < ageMin) {
        setFormError("Usia maksimum tidak boleh lebih kecil dari usia minimum.");
        return false;
      }
      body.age_min = ageMin;
      body.age_max = ageMax;
    }
    setFormError(null);

    setSavingTicketId(current.id);
    try {
      const saved = await adminApiRequest<BackendTicketItem>(
        `/admin/tickets/${current.id}`,
        session.token,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === current.id
            ? {
                ...ticket,
                age: formatAge(saved.age_min, saved.age_max),
                weekday: formatRupiah(saved.weekday_price ?? saved.price),
                weekend: formatRupiah(saved.weekend_price ?? saved.price),
              }
            : ticket,
        ),
      );
      showToast("Tarif tiket berhasil diperbarui!");
      return true;
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Tarif tiket gagal disimpan.");
      return false;
    } finally {
      setSavingTicketId(null);
    }
  };

  const handleSaveTicket = async (id: string) => {
    const current = tickets.find((ticket) => ticket.id === id);
    if (!current) return;
    const saved = await handleSaveTicketPrices(current, ticketDraft);
    if (saved) setEditingTicketId(null);
  };

  const currentWeekdayTicket = tickets.find((ticket) => ticket.id === selectedCatWeekday) || tickets[0];
  const currentWeekendTicket = tickets.find((ticket) => ticket.id === selectedCatWeekend) || tickets[0];

  const handleStartEditDayWeekday = () => {
    setEditingDayCard("weekday");
    setDayDraftWeekday({ age: currentWeekdayTicket.age, price: currentWeekdayTicket.weekday });
  };

  const handleCancelDayWeekday = () => setEditingDayCard(null);

  const handleSaveDayWeekday = async () => {
    const ticket = tickets.find((item) => item.id === selectedCatWeekday);
    if (!ticket) return;
    const saved = await handleSaveTicketPrices(ticket, {
      weekday: dayDraftWeekday.price,
      age: dayDraftWeekday.age,
    });
    if (saved) setEditingDayCard(null);
  };

  const handleStartEditDayWeekend = () => {
    setEditingDayCard("weekend");
    setDayDraftWeekend({ age: currentWeekendTicket.age, price: currentWeekendTicket.weekend });
  };

  const handleCancelDayWeekend = () => setEditingDayCard(null);

  const handleSaveDayWeekend = async () => {
    const ticket = tickets.find((item) => item.id === selectedCatWeekend);
    if (!ticket) return;
    const saved = await handleSaveTicketPrices(ticket, {
      weekend: dayDraftWeekend.price,
      age: dayDraftWeekend.age,
    });
    if (saved) setEditingDayCard(null);
  };

  return (
    <div className="w-full max-w-[1062px] pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-medium flex items-center justify-between shadow-xs"
          role="status"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            &times;
          </button>
        </div>
      )}

      {formError && (
        <div
          className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center justify-between shadow-xs"
          role="alert"
        >
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-4 cursor-pointer"
            aria-label="Tutup pesan kesalahan"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl lg:text-[28px] font-bold text-[#090d12] tracking-tight">
          Kelola Operasional &amp; Tiket
        </h1>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: KELOLA JAM OPERASIONAL                              */}
      {/* ============================================================== */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#090d12] tracking-tight mb-5">
          Kelola Jam Operasional
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {schedules.map((schedule) => {
            const isEditing = editingScheduleId === schedule.id;

            return (
              <div
                key={schedule.id}
                className="bg-[#ffffff] border-2 border-[#023047] rounded-2xl p-6 shadow-[0_4px_12px_rgba(2,48,71,0.12)] flex flex-col justify-between min-h-[310px]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-base font-bold text-[#023047]">
                      {schedule.title}
                    </span>
                    <span
                      className={`text-xs font-semibold px-4 py-1.5 rounded-lg text-center min-w-[130px] shadow-2xs ${
                        schedule.badgeType === "blue"
                          ? "bg-[#bbe5f4] text-[#023047]"
                          : "bg-[#ffe680] text-[#023047]"
                      }`}
                    >
                      {schedule.badgeLabel}
                    </span>
                  </div>

                  {/* Field: Jam Buka */}
                  <div className="mb-4">
                    <label
                      htmlFor={`schedOpenTime-${schedule.id}`}
                      className="text-xs font-semibold text-[#090d12] mb-1.5 block"
                    >
                      Jam buka:
                      {isEditing && <RequiredMark />}
                    </label>
                    {isEditing ? (
                      <input
                        id={`schedOpenTime-${schedule.id}`}
                        aria-label="Jam buka"
                        type="text"
                        value={scheduleDraft.openTime}
                        onChange={(e) =>
                          setScheduleDraft({
                            ...scheduleDraft,
                            openTime: formatTimeInput(e.target.value),
                          })
                        }
                        className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                        placeholder="Contoh: 09.00"
                        required
                        autoFocus
                      />
                    ) : (
                      <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                        {schedule.openTime}
                      </div>
                    )}
                  </div>

                  {/* Field: Jam Tutup */}
                  <div className="mb-6">
                    <label
                      htmlFor={`schedCloseTime-${schedule.id}`}
                      className="text-xs font-semibold text-[#090d12] mb-1.5 block"
                    >
                      Jam tutup:
                      {isEditing && <RequiredMark />}
                    </label>
                    {isEditing ? (
                      <input
                        id={`schedCloseTime-${schedule.id}`}
                        aria-label="Jam tutup"
                        type="text"
                        value={scheduleDraft.closeTime}
                        onChange={(e) =>
                          setScheduleDraft({
                            ...scheduleDraft,
                            closeTime: formatTimeInput(e.target.value),
                          })
                        }
                        className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                        placeholder="Contoh: 16.00"
                        required
                      />
                    ) : (
                      <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                        {schedule.closeTime}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                {isEditing ? (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleCancelSchedule}
                      className="bg-white border border-[#dee1e5] hover:bg-slate-50 text-[#090d12] text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSchedule(schedule.id)}
                      className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditSchedule(schedule)}
                      aria-label="Edit jam operasional"
                      className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Maintenance Note */}
        {closedLabel && (
          <p className="mt-3 text-xs text-slate-500 font-medium">
            * {closedLabel}
          </p>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: KELOLA HARGA TIKET                                  */}
      {/* ============================================================== */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#090d12] tracking-tight">
            Kelola Harga Tiket
          </h2>
        </div>

        {/* --- TICKET CATEGORIES --- */}
        {ticketViewMode === "category" && (
          isTicketsLoading ? (
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
              Memuat kategori tiket...
            </p>
          ) : tickets.length === 0 ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
              Kategori tiket belum tersedia. Jalankan migrasi database terbaru untuk menyiapkan kategori awal.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tickets.map((ticket) => {
                const isEditing = editingTicketId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className="bg-[#ffffff] border-2 border-[#023047] rounded-2xl p-6 shadow-[0_4px_12px_rgba(2,48,71,0.12)] flex flex-col justify-between min-h-[340px]"
                  >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-base font-bold text-[#023047]">
                        Kategori: {ticket.label}
                      </span>
                      <span className="bg-[#bbe5f4] text-[#023047] text-xs font-semibold px-4 py-1.5 rounded-lg text-center min-w-[130px] shadow-2xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={ticketDraft.age}
                            onChange={(e) =>
                              setTicketDraft({
                                ...ticketDraft,
                                age: formatRawAgeInput(e.target.value),
                              })
                            }
                            onBlur={() =>
                              setTicketDraft((draft) => ({
                                ...draft,
                                age: formatAgeInput(draft.age),
                              }))
                            }
                            className="bg-transparent border-b border-[#023047] text-center w-full focus:outline-none"
                            placeholder="Rentang Usia"
                          />
                        ) : (
                          ticket.age
                        )}
                      </span>
                    </div>

                    {/* Row: Tarif Weekday */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor={`ticketWeekday-${ticket.id}`}
                          className="text-xs font-semibold text-[#090d12] block"
                        >
                          Tarif Weekday (Senin - Kamis):
                          {isEditing && <RequiredMark />}
                        </label>
                        <span className="text-[11px] text-[#023047] bg-[#bbe5f4]/50 px-2 py-0.5 rounded font-medium">
                          Senin-Kamis
                        </span>
                      </div>
                      {isEditing ? (
                        <input
                          id={`ticketWeekday-${ticket.id}`}
                          type="text"
                          value={ticketDraft.weekday}
                          onChange={(e) =>
                            setTicketDraft({
                              ...ticketDraft,
                              weekday: formatRupiahInput(e.target.value),
                            })
                          }
                          className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                          placeholder="Contoh: Rp20.000"
                          required
                          autoFocus
                        />
                      ) : (
                        <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                          {ticket.weekday}
                        </div>
                      )}
                    </div>

                    {/* Row: Tarif Weekend */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor={`ticketWeekend-${ticket.id}`}
                          className="text-xs font-semibold text-[#090d12] block"
                        >
                          Tarif Weekend (Sabtu - Minggu):
                          {isEditing && <RequiredMark />}
                        </label>
                        <span className="text-[11px] text-[#023047] bg-[#ffe680]/60 px-2 py-0.5 rounded font-medium">
                          Sabtu-Minggu
                        </span>
                      </div>
                      {isEditing ? (
                        <input
                          id={`ticketWeekend-${ticket.id}`}
                          type="text"
                          value={ticketDraft.weekend}
                          onChange={(e) =>
                            setTicketDraft({
                              ...ticketDraft,
                              weekend: formatRupiahInput(e.target.value),
                            })
                          }
                          className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                          placeholder="Contoh: Rp25.000"
                          required
                        />
                      ) : (
                        <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                          {ticket.weekend}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  {isEditing ? (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleCancelTicket}
                        className="bg-white border border-[#dee1e5] hover:bg-slate-50 text-[#090d12] text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveTicket(ticket.id)}
                        disabled={savingTicketId === ticket.id}
                        className="bg-[#023047] hover:bg-[#034566] disabled:opacity-60 text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer disabled:cursor-wait"
                      >
                        {savingTicketId === ticket.id ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditTicket(ticket)}
                        aria-label="Edit tarif tiket"
                        className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* --- VIEW MODE 2: FIGMA 1:1 DAY FORMAT CARDS --- */}
        {ticketViewMode === "day" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Weekdays Ticket */}
            <div className="bg-[#ffffff] border-2 border-[#023047] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-base font-bold text-[#023047]">
                    Weekdays
                  </span>
                  <span className="bg-[#bbe5f4] text-[#023047] text-xs font-semibold px-4 py-1.5 rounded-lg text-center min-w-[130px] shadow-2xs">
                    Senin-Kamis
                  </span>
                </div>

                {/* Dropdown Kategori & Rentang Usia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                      Kategori:
                    </label>
                    <select
                      value={selectedCatWeekday}
                      onChange={(e) => setSelectedCatWeekday(e.target.value)}
                      disabled={editingDayCard === "weekday"}
                      aria-label="Kategori tiket weekday"
                      className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-medium px-3 py-2.5 rounded-lg h-[42px] focus:outline-none border-none cursor-pointer"
                    >
                      {tickets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                      Usia:
                    </label>
                    {editingDayCard === "weekday" ? (
                      <input
                        type="text"
                        value={dayDraftWeekday.age}
                        onChange={(e) =>
                          setDayDraftWeekday({
                            ...dayDraftWeekday,
                            age: formatRawAgeInput(e.target.value),
                          })
                        }
                        onBlur={() =>
                          setDayDraftWeekday((draft) => ({
                            ...draft,
                            age: formatAgeInput(draft.age),
                          }))
                        }
                        className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                        placeholder="Contoh: 1 - 2 Tahun"
                      />
                    ) : (
                      <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                        {currentWeekdayTicket.age}
                      </div>
                    )}
                  </div>
                </div>

                {/* Harga */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                    Harga:
                  </label>
                  {editingDayCard === "weekday" ? (
                    <input
                      type="text"
                      value={dayDraftWeekday.price}
                      onChange={(e) =>
                        setDayDraftWeekday({
                          ...dayDraftWeekday,
                          price: formatRupiahInput(e.target.value),
                        })
                      }
                      className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                      placeholder="Contoh: Rp20.000"
                      autoFocus
                    />
                  ) : (
                    <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                      {currentWeekdayTicket.weekday}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {editingDayCard === "weekday" ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCancelDayWeekday}
                    className="bg-white border border-[#dee1e5] hover:bg-slate-50 text-[#090d12] text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDayWeekday}
                    className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleStartEditDayWeekday}
                    aria-label="Edit tarif tiket"
                    className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Weekend Ticket */}
            <div className="bg-[#ffffff] border-2 border-[#023047] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-base font-bold text-[#023047]">
                    Weekend
                  </span>
                  <span className="bg-[#ffe680] text-[#023047] text-xs font-semibold px-4 py-1.5 rounded-lg text-center min-w-[130px] shadow-2xs">
                    Sabtu-Minggu
                  </span>
                </div>

                {/* Dropdown Kategori & Rentang Usia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                      Kategori:
                    </label>
                    <select
                      value={selectedCatWeekend}
                      onChange={(e) => setSelectedCatWeekend(e.target.value)}
                      disabled={editingDayCard === "weekend"}
                      aria-label="Kategori tiket weekend"
                      className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-medium px-3 py-2.5 rounded-lg h-[42px] focus:outline-none border-none cursor-pointer"
                    >
                      {tickets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                      Usia:
                    </label>
                    {editingDayCard === "weekend" ? (
                      <input
                        type="text"
                        value={dayDraftWeekend.age}
                        onChange={(e) =>
                          setDayDraftWeekend({
                            ...dayDraftWeekend,
                            age: formatRawAgeInput(e.target.value),
                          })
                        }
                        onBlur={() =>
                          setDayDraftWeekend((draft) => ({
                            ...draft,
                            age: formatAgeInput(draft.age),
                          }))
                        }
                        className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                        placeholder="Contoh: 1 - 2 Tahun"
                      />
                    ) : (
                      <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                        {currentWeekendTicket.age}
                      </div>
                    )}
                  </div>
                </div>

                {/* Harga */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-[#090d12] mb-1.5 block">
                    Harga:
                  </label>
                  {editingDayCard === "weekend" ? (
                    <input
                      type="text"
                      value={dayDraftWeekend.price}
                      onChange={(e) =>
                        setDayDraftWeekend({
                          ...dayDraftWeekend,
                          price: formatRupiahInput(e.target.value),
                        })
                      }
                      className="w-full bg-white border-2 border-[#023047] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] focus:outline-none"
                      placeholder="Contoh: Rp25.000"
                      autoFocus
                    />
                  ) : (
                    <div className="w-full bg-[#e2e8f0] text-[#090d12] text-sm font-normal px-4 py-2.5 rounded-lg h-[42px] flex items-center select-none font-medium">
                      {currentWeekendTicket.weekend}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {editingDayCard === "weekend" ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCancelDayWeekend}
                    className="bg-white border border-[#dee1e5] hover:bg-slate-50 text-[#090d12] text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDayWeekend}
                    className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleStartEditDayWeekend}
                    aria-label="Edit tarif tiket"
                    className="bg-[#023047] hover:bg-[#034566] text-white text-sm font-semibold h-[40px] px-8 rounded-lg transition-colors flex items-center justify-center min-w-[130px] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImageField } from "@/components/admin/image-editor";
import { RequiredMark, StoredImage } from "@/components/ui";
import { PencilEditIcon } from "@/components/ui/icons";
import landingData from "@/fixtures/landing.json";
import siteData from "@/fixtures/site.json";
import { IMAGE_FRAMES } from "@/lib/image-frames";
import type { ProcessedImage } from "@/lib/image-processing";
import { adminApiRequest, getAdminSession } from "@/lib/admin-auth";
import { resolveApiAssetUrl } from "@/services/api-client";

interface AdminProfileRecord {
  name: string;
  description: string | null;
  whatsapp_number: string | null;
  image_path: string | null;
}

export default function AdminProfilPage() {
  const initialAboutParagraphs = landingData.about?.paragraphs || [
    {
      text: "Galaxy Waterpark sudah cukup lama hadir di tengah keluarga sebagai salah satu pilihan tempat rekreasi air yang asyik dan terjangkau.",
    },
    {
      text: "Berdiri sejak 9 Desember 2014, kami terus berupaya menjaga kualitas kolam, kebersihan area, serta kenyamanan fasilitas yang ada agar pengunjung dari berbagai usia bisa bersantai dan menikmati waktu liburan dengan tenang. Mulai dari anak-anak hingga orang dewasa, semuanya bisa menikmati berbagai pilihan kolam dan wahana yang tersedia di sini.",
      emphasis: "9 Desember 2014",
    },
  ];

  const defaultAboutText = initialAboutParagraphs.map((p) => p.text).join("\n\n");
  const defaultAboutImage =
    landingData.about?.image_url || "/images/figma/about-final.png";
  const defaultWhatsapp = siteData.contacts?.whatsapp?.label || "+6281234567890";

  // Committed state
  const [aboutText, setAboutText] = useState<string>(defaultAboutText);
  const [aboutImage, setAboutImage] = useState<string | null>(defaultAboutImage);
  const [whatsapp, setWhatsapp] = useState<string>(defaultWhatsapp);

  // Edit buffer state
  const [editAboutText, setEditAboutText] = useState<string>(defaultAboutText);
  const [pendingAboutImage, setPendingAboutImage] =
    useState<ProcessedImage | null>(null);
  const [editWhatsapp, setEditWhatsapp] = useState<string>(defaultWhatsapp);

  // Independent edit modes
  const [isEditingAbout, setIsEditingAbout] = useState<boolean>(false);
  const [isEditingWa, setIsEditingWa] = useState<boolean>(false);

  // Notification toast & form validation errors
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [aboutError, setAboutError] = useState("");
  const [waError, setWaError] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;

    void adminApiRequest<AdminProfileRecord>("/admin/profile", session.token)
      .then((profile) => {
        if (!profile) return;
        if (profile.description?.trim()) {
          setAboutText(profile.description);
          setEditAboutText(profile.description);
        }
        if (profile.whatsapp_number?.trim()) {
          setWhatsapp(profile.whatsapp_number);
          setEditWhatsapp(profile.whatsapp_number);
        }
        if (profile.image_path) {
          setAboutImage(resolveApiAssetUrl(profile.image_path) || defaultAboutImage);
        }
      })
      .catch((reason) => {
        setAboutError(reason instanceof Error ? reason.message : "Profil tidak dapat dimuat.");
      });
  }, [defaultAboutImage]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showNotification = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFeedbackMessage(msg);
    toastTimerRef.current = setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // About handlers
  const handleStartEditAbout = () => {
    setEditAboutText(aboutText);
    setPendingAboutImage(null);
    setAboutError("");
    setIsEditingAbout(true);
  };

  const handleCancelAbout = () => {
    setEditAboutText(aboutText);
    setPendingAboutImage(null);
    setAboutError("");
    setIsEditingAbout(false);
  };

  const handleSaveAbout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editAboutText.trim()) {
      setAboutError("Keterangan Tentang Kami wajib diisi.");
      return;
    }

    const session = getAdminSession();
    if (!session) {
      setAboutError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    try {
      const body = new FormData();
      body.append("description", editAboutText.trim());
      if (pendingAboutImage) {
        body.append("image", pendingAboutImage.file, pendingAboutImage.file.name);
      }

      const saved = await adminApiRequest<AdminProfileRecord>(
        "/admin/profile",
        session.token,
        { method: "POST", body },
      );
      setAboutText(saved.description?.trim() || editAboutText.trim());
      if (saved.image_path) {
        setAboutImage(resolveApiAssetUrl(saved.image_path) || aboutImage);
      }
      setPendingAboutImage(null);
      setAboutError("");
      setIsEditingAbout(false);
      showNotification("Profil Tentang Kami berhasil disimpan!");
    } catch (reason) {
      setAboutError(reason instanceof Error ? reason.message : "Profil gagal disimpan.");
    }
  };

  // WhatsApp handlers
  const handleStartEditWa = () => {
    setEditWhatsapp(whatsapp);
    setWaError("");
    setIsEditingWa(true);
  };

  const handleCancelWa = () => {
    setEditWhatsapp(whatsapp);
    setWaError("");
    setIsEditingWa(false);
  };

  const handleSaveWa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editWhatsapp.trim()) {
      setWaError("Nomor WhatsApp resmi wajib diisi.");
      return;
    }

    const session = getAdminSession();
    if (!session) {
      setWaError("Sesi admin tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    try {
      const saved = await adminApiRequest<AdminProfileRecord>(
        "/admin/profile",
        session.token,
        {
          method: "POST",
          body: JSON.stringify({ whatsapp_number: editWhatsapp.trim() }),
        },
      );
      setWhatsapp(saved.whatsapp_number?.trim() || editWhatsapp.trim());
      setWaError("");
      setIsEditingWa(false);
      showNotification("Nomor WhatsApp resmi berhasil disimpan!");
    } catch (reason) {
      setWaError(reason instanceof Error ? reason.message : "Nomor WhatsApp gagal disimpan.");
    }
  };

  const renderFormattedParagraphs = (text: string) => {
    const paragraphs = text.split("\n\n").filter(Boolean);
    return paragraphs.map((para, idx) => {
      if (para.includes("9 Desember 2014")) {
        const parts = para.split("9 Desember 2014");
        return (
          <p key={idx} className="whitespace-pre-line">
            {parts[0]}
            <strong className="font-bold text-[#023047]">9 Desember 2014</strong>
            {parts.slice(1).join("9 Desember 2014")}
          </p>
        );
      }
      return (
        <p key={idx} className="whitespace-pre-line">
          {para}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-[1062px] pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl lg:text-[28px] font-bold text-[#090d12] tracking-tight">
          Kelola Profil &amp; Nomor WhatsApp
        </h1>
        {feedbackMessage && (
          <span
            className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs self-start sm:self-auto"
            role="status"
          >
            {feedbackMessage}
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* CARD 1: TENTANG KAMI (50/50 Split Container)                   */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-[#023047] rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(2,48,71,0.12)] mb-8">
        {!isEditingAbout ? (
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Half: Slide Photo (View Mode) */}
            <div className="relative w-full h-[380px] lg:h-[475px] bg-[#e2e8f0] overflow-hidden">
              <StoredImage
                src={aboutImage}
                alt={
                  landingData.about?.image_alt ||
                  "Wahana seluncuran air Galaxy Waterpark"
                }
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleStartEditAbout}
                aria-label="Edit Foto dan Keterangan Tentang Kami"
                className="absolute top-5 right-5 w-8 h-8 bg-white border border-[#023047] rounded-md shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer z-10"
              >
                <PencilEditIcon size={18} />
              </button>
            </div>

            {/* Right Half: Title, Label, Story Narrative */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#023047] mb-4">
                  Tentang Kami
                </h2>
                <p className="block text-sm font-bold text-[#023047] mb-2">
                  Keterangan
                </p>

                <div className="relative border border-[#023047] rounded-lg p-5 bg-white min-h-[260px] text-sm text-[#090d12] leading-relaxed flex flex-col justify-between">
                  <div className="space-y-3">
                    {renderFormattedParagraphs(aboutText)}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleStartEditAbout}
                      aria-label="Edit Keterangan Tentang Kami"
                      className="p-1 text-[#023047] hover:text-[#011d2c] transition-colors cursor-pointer"
                    >
                      <PencilEditIcon size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveAbout} className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Half: Interactive ImageField */}
            <div className="min-h-[380px] lg:min-h-[475px] border-b lg:border-b-0 lg:border-r border-slate-200">
              <ImageField
                id="about-image"
                label="Foto Tentang Kami"
                frame={IMAGE_FRAMES.about}
                value={pendingAboutImage}
                onChange={setPendingAboutImage}
                currentUrl={aboutImage}
              />
            </div>

            {/* Right Half: Editable Textarea */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#023047] mb-4">
                  Tentang Kami
                </h2>
                <label
                  htmlFor="aboutKeterangan"
                  className="block text-sm font-bold text-[#023047] mb-2"
                >
                  Keterangan
                  <RequiredMark />
                </label>
                {aboutError && (
                  <p className="mb-2 text-xs font-medium text-red-700" role="alert">
                    {aboutError}
                  </p>
                )}
                <textarea
                  id="aboutKeterangan"
                  rows={8}
                  value={editAboutText}
                  onChange={(e) => {
                    setEditAboutText(e.target.value);
                    if (aboutError) setAboutError("");
                  }}
                  className="w-full border border-[#023047] rounded-lg p-4 bg-white text-sm text-[#090d12] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#023047] resize-none h-[260px]"
                  placeholder="Keterangan Tentang Kami..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancelAbout}
                  className="w-full h-[38px] bg-white border border-[#94a3b8] text-[#023047] text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!editAboutText.trim()}
                  className="w-full h-[38px] bg-[#023047] hover:bg-[#034566] disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ============================================================== */}
      {/* CARD 2: NOMOR WHATSAPP                                         */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-[#023047] rounded-2xl p-6 shadow-[0_4px_12px_rgba(2,48,71,0.12)]">
        <h2 className="text-lg font-bold text-[#090d12] mb-3">
          Nomor WhatsApp
        </h2>
        <label
          htmlFor="whatsappInput"
          className="block text-xs font-semibold text-[#023047] mb-1.5"
        >
          Nomor WhatsApp Resmi
          {isEditingWa && <RequiredMark />}
        </label>

        {!isEditingWa ? (
          <div className="border border-[#023047] rounded-lg h-[42px] px-4 flex items-center justify-between bg-white">
            <span className="text-sm font-medium text-[#090d12]">
              {whatsapp}
            </span>
            <button
              type="button"
              onClick={handleStartEditWa}
              aria-label="Edit Nomor WhatsApp Resmi"
              className="p-1 text-[#023047] hover:text-[#011d2c] transition-colors cursor-pointer"
            >
              <PencilEditIcon size={20} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveWa}>
            {waError && (
              <p className="mb-2 text-xs font-medium text-red-700" role="alert">
                {waError}
              </p>
            )}
            <input
              id="whatsappInput"
              type="text"
              value={editWhatsapp}
              onChange={(e) => {
                setEditWhatsapp(e.target.value);
                if (waError) setWaError("");
              }}
              className="w-full border border-[#023047] rounded-lg h-[42px] px-4 text-sm font-medium text-[#090d12] bg-white focus:outline-none focus:ring-1 focus:ring-[#023047]"
              placeholder="+62..."
              maxLength={30}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
              <button
                type="button"
                onClick={handleCancelWa}
                className="h-[38px] bg-white border border-[#94a3b8] text-[#023047] text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!editWhatsapp.trim()}
                className="h-[38px] bg-[#023047] hover:bg-[#034566] disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

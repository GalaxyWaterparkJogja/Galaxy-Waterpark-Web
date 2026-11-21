/**
 * Pure Markdown generator for `/llms.txt` (Answer Engine Optimization).
 *
 * Gives AI crawlers and answer engines a concise, structured, live-data-backed
 * summary of Galaxy Waterpark Yogyakarta (hours, tariffs, rides, promos,
 * events, location, and canonical page links) in a single plain-text request.
 */

import { BUSINESS_ADDRESS, formatIdrCurrency, normalizePhoneForSchema } from "./seo.ts";

export interface LlmsTxtInput {
  siteUrl: string;
  businessName: string;
  description: string;
  whatsappNumber?: string | null;
  mapsHref: string;
  instagramHref: string;
  schedule: {
    weekday_label: string;
    weekday_hours: string;
    weekend_label: string;
    weekend_hours: string;
    closed_label: string;
  };
  tickets: ReadonlyArray<{
    label: string;
    age: string;
    weekday: string;
    weekend: string;
  }>;
  catalogSections: ReadonlyArray<{
    id: string;
    title: string;
    description: string;
    items: ReadonlyArray<{
      id: string;
      title: string;
      description?: string | null;
      heightRequirement?: string | null;
      price?: number | null;
      durationMinutes?: number | null;
    }>;
  }>;
  promos: ReadonlyArray<{
    title: string;
    subtitle?: string;
    description?: string;
  }>;
  events: ReadonlyArray<{
    title: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
}

function cleanLine(text: string | null | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

export function renderLlmsTxt(input: LlmsTxtInput): string {
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  const phone = normalizePhoneForSchema(input.whatsappNumber);
  const fullAddress = `${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality}, ${BUSINESS_ADDRESS.addressRegion}, Indonesia`;

  const rawScheduleLines = (input.schedule.weekday_hours || "")
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter(Boolean);

  const scheduleBullets =
    rawScheduleLines.length >= 2
      ? rawScheduleLines.map((line) => `- ${line}`)
      : [
          `- ${cleanLine(input.schedule.weekday_label)}: ${cleanLine(input.schedule.weekday_hours)}`,
          `- ${cleanLine(input.schedule.weekend_label)}: ${cleanLine(input.schedule.weekend_hours)}`,
        ];

  const lines: string[] = [
    `# ${cleanLine(input.businessName) || "Galaxy Waterpark Yogyakarta"}`,
    "",
    `> ${cleanLine(input.description)}`,
    "",
    "## Halaman Utama",
    `- [Beranda](${siteUrl}/): Ringkasan tiket masuk, jam operasional, wahana, promo, event, ulasan pengunjung, dan lokasi.`,
    `- [Wahana & Fasilitas](${siteUrl}/katalog): Daftar lengkap wahana keluarga, area sport & wellness (hydrotherapy), serta fasilitas.`,
    `- [Promo Terbaru](${siteUrl}/promo): Penawaran harga spesial dan promo aktif.`,
    `- [Event & Agenda](${siteUrl}/event): Jadwal acara dan kegiatan mendatang.`,
    `- [Galeri Foto](${siteUrl}/galeri): Dokumentasi wahana dan suasana taman rekreasi air.`,
    `- [Berikan Ulasan](${siteUrl}/ulasan): Formulir ulasan dan penilaian pengunjung.`,
    "",
    "## Jam Operasional & Lokasi",
    `- Alamat: ${fullAddress}`,
    ...scheduleBullets,
    `- Informasi libur: ${cleanLine(input.schedule.closed_label)}`,
    `- Peta lokasi: ${input.mapsHref}`,
    `- Instagram: ${input.instagramHref}`,
  ];

  if (phone) {
    lines.push(`- WhatsApp / Telepon: ${phone}`);
  }

  if (input.tickets.length > 0) {
    lines.push(
      "",
      "## Harga Tiket Masuk",
      "| Kategori | Usia | Hari Kerja | Akhir Pekan |",
      "| --- | --- | --- | --- |",
    );
    for (const ticket of input.tickets) {
      lines.push(
        `| ${cleanLine(ticket.label)} | ${cleanLine(ticket.age) || "-"} | ${cleanLine(ticket.weekday)} | ${cleanLine(ticket.weekend)} |`,
      );
    }
  }

  lines.push("", "## Wahana, Olahraga & Fasilitas");
  for (const section of input.catalogSections) {
    lines.push(
      "",
      `### ${cleanLine(section.title)} (${siteUrl}/katalog/${section.id})`,
      cleanLine(section.description),
    );
    if (section.items.length === 0) {
      lines.push("- Belum ada item aktif saat ini.");
      continue;
    }
    for (const item of section.items) {
      const meta: string[] = [];
      if (item.heightRequirement?.trim()) {
        meta.push(`tinggi min. ${cleanLine(item.heightRequirement)}`);
      }
      if (typeof item.price === "number" && item.price > 0) {
        meta.push(formatIdrCurrency(item.price));
      }
      if (typeof item.durationMinutes === "number" && item.durationMinutes > 0) {
        meta.push(`${item.durationMinutes} menit`);
      }
      const desc = cleanLine(item.description);
      const details = [meta.join(", "), desc].filter(Boolean).join(" — ");
      lines.push(
        `- [${cleanLine(item.title)}](${siteUrl}/katalog/${section.id}/${item.id})${details ? `: ${details}` : ""}`,
      );
    }
  }

  lines.push("", "## Promo Aktif");
  if (input.promos.length === 0) {
    lines.push("- Belum ada promo aktif saat ini.");
  } else {
    for (const promo of input.promos) {
      const extra = [cleanLine(promo.subtitle), cleanLine(promo.description)]
        .filter(Boolean)
        .join(" — ");
      lines.push(`- ${cleanLine(promo.title)}${extra ? `: ${extra}` : ""}`);
    }
  }

  lines.push("", "## Event Mendatang");
  if (input.events.length === 0) {
    lines.push("- Belum ada event mendatang saat ini.");
  } else {
    for (const event of input.events) {
      const dates = [event.start_date, event.end_date].filter(Boolean).join(" s/d ");
      const extra = [dates, cleanLine(event.description)].filter(Boolean).join(" — ");
      lines.push(`- ${cleanLine(event.title)}${extra ? `: ${extra}` : ""}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

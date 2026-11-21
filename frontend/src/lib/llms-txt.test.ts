import assert from "node:assert/strict";
import { test } from "node:test";
import { renderLlmsTxt } from "./llms-txt.ts";

test("renderLlmsTxt outputs structured Markdown with live pricing, hours, catalog links, and normalized phone", () => {
  const output = renderLlmsTxt({
    siteUrl: "https://galaxywaterpark.id/",
    businessName: "Galaxy Waterpark Yogyakarta",
    description: "Taman rekreasi air keluarga di Bantul, Yogyakarta.",
    whatsappNumber: "0812-3456-7890",
    mapsHref: "https://maps.google.com/?q=Galaxy+Waterpark",
    instagramHref: "https://instagram.com/galaxywaterpark",
    schedule: {
      weekday_label: "Senin - Kamis",
      weekday_hours: "09.00-16.00 WIB",
      weekend_label: "Sabtu - Minggu",
      weekend_hours: "08.00-16.00 WIB",
      closed_label: "Jumat libur operasional",
    },
    tickets: [
      { label: "Dewasa", age: "11-59 Tahun", weekday: "Rp40.000", weekend: "Rp45.000" },
    ],
    catalogSections: [
      {
        id: "family",
        title: "Keluarga",
        description: "Wahana seluncuran keluarga.",
        items: [
          {
            id: "1",
            title: "Kolam Arus",
            description: "Kolam arus santai.",
            heightRequirement: "100 cm",
          },
        ],
      },
    ],
    promos: [{ title: "Promo Pelajar", subtitle: "Diskon 20%", description: "Tunjukkan kartu pelajar." }],
    events: [],
  });

  assert.match(output, /^# Galaxy Waterpark Yogyakarta/m);
  assert.match(output, /WhatsApp \/ Telepon: \+6281234567890/);
  assert.match(output, /\| Dewasa \| 11-59 Tahun \| Rp40\.000 \| Rp45\.000 \|/);
  assert.match(output, /\[Kolam Arus\]\(https:\/\/galaxywaterpark\.id\/katalog\/family\/1\): tinggi min\. 100 cm — Kolam arus santai\./);
  assert.match(output, /- Promo Pelajar: Diskon 20% — Tunjukkan kartu pelajar\./);
  assert.match(output, /Belum ada event mendatang saat ini\./);
});

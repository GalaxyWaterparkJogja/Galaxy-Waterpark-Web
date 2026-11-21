import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAggregateRating,
  buildOpeningHoursSpecification,
  buildPriceRange,
  normalizePhoneForSchema,
  parseTimeRange,
  toAbsoluteSiteUrl,
} from "./seo.ts";

test("toAbsoluteSiteUrl resolves relative paths and preserves absolute URLs", () => {
  assert.equal(
    toAbsoluteSiteUrl("/images/hero.png", "https://example.com/"),
    "https://example.com/images/hero.png",
  );
  assert.equal(
    toAbsoluteSiteUrl("https://cdn.example.com/photo.webp", "https://example.com"),
    "https://cdn.example.com/photo.webp",
  );
  assert.equal(toAbsoluteSiteUrl(null, "https://example.com"), undefined);
  assert.equal(toAbsoluteSiteUrl("   ", "https://example.com"), undefined);
});

test("buildPriceRange derives min-max IDR range from live ticket entries", () => {
  const range = buildPriceRange([
    { weekday: "Rp20.000", weekend: "Rp20.000" },
    { weekday: "Rp40.000", weekend: "Rp45.000" },
  ]);
  assert.equal(range, "Rp20.000 - Rp45.000");

  assert.equal(
    buildPriceRange([{ weekday: "Rp30.000", weekend: "Rp30.000" }]),
    "Rp30.000",
  );
  assert.equal(buildPriceRange([]), undefined);
});

test("buildOpeningHoursSpecification parses structured and multi-line Indonesian schedules", () => {
  assert.deepEqual(parseTimeRange("09.00-16.00 WIB"), {
    opens: "09:00",
    closes: "16:00",
  });

  const structured = buildOpeningHoursSpecification({
    weekday_label: "Senin - Kamis",
    weekday_hours: "09.00-16.00 WIB",
    weekend_label: "Sabtu - Minggu",
    weekend_hours: "08.00-16.00 WIB",
  });
  assert.equal(structured.length, 2);
  assert.deepEqual(structured[0], {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    opens: "09:00",
    closes: "16:00",
  });
  assert.deepEqual(structured[1], {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday", "Sunday"],
    opens: "08:00",
    closes: "16:00",
  });

  const multiline = buildOpeningHoursSpecification({
    weekday_hours: "Senin - Jumat: 09:00 - 17:00 WIB\nSabtu - Minggu: 08:00 - 17:00 WIB",
  });
  assert.equal(multiline.length, 2);
  assert.equal(multiline[0].dayOfWeek.length, 5);
  assert.equal(multiline[0].closes, "17:00");
});

test("buildAggregateRating supports half-star values and omits when empty", () => {
  assert.equal(buildAggregateRating([]), undefined);

  const rating = buildAggregateRating([
    { rating: 5 },
    { rating: 4 },
    { rating: 4.5 },
    { rating: 0.5 },
  ]);
  assert.deepEqual(rating, {
    "@type": "AggregateRating",
    ratingValue: "3.5",
    bestRating: "5",
    worstRating: "0.5",
    ratingCount: 4,
    reviewCount: 4,
  });
});

test("normalizePhoneForSchema rejects placeholders and normalizes Indonesian numbers", () => {
  assert.equal(normalizePhoneForSchema("+62 XXXXXXXXX"), undefined);
  assert.equal(normalizePhoneForSchema(""), undefined);
  assert.equal(normalizePhoneForSchema("0812-3456-7890"), "+6281234567890");
  assert.equal(normalizePhoneForSchema("+62 812-3456-7890"), "+6281234567890");
});

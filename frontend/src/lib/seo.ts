/**
 * Pure SEO & Schema.org structured-data helpers shared across public routes.
 *
 * Kept free of Next.js/DOM imports so every function can be unit-tested with
 * `node --test` and reused identically across SSR pages, metadata, and llms.txt.
 */

const DEFAULT_SITE_URL = "https://galaxywaterpark.id";

export const BUSINESS_ADDRESS = {
  streetAddress: "Jalan Wonosari KM. 6, Kalangan, Baturetno, Banguntapan",
  addressLocality: "Bantul",
  addressRegion: "Daerah Istimewa Yogyakarta",
  addressCountry: "ID",
} as const;

export const BUSINESS_GEO = {
  latitude: -7.8260587,
  longitude: 110.4191306,
} as const;

export function getSiteUrl(): string {
  const configured =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : undefined;
  return (configured?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function toAbsoluteSiteUrl(
  pathOrUrl: string | null | undefined,
  siteUrl: string = getSiteUrl(),
): string | undefined {
  const trimmed = pathOrUrl?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${siteUrl.replace(/\/+$/, "")}${normalizedPath}`;
}

export function parseRupiahAmount(
  value: string | number | null | undefined,
): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatIdrCurrency(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

export function buildPriceRange(
  tickets: ReadonlyArray<{ weekday?: string; weekend?: string }>,
): string | undefined {
  const prices: number[] = [];
  for (const ticket of tickets) {
    const weekday = parseRupiahAmount(ticket.weekday);
    const weekend = parseRupiahAmount(ticket.weekend);
    if (weekday !== null && weekday > 0) prices.push(weekday);
    if (weekend !== null && weekend > 0) prices.push(weekend);
  }
  if (prices.length === 0) return undefined;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatIdrCurrency(min)
    : `${formatIdrCurrency(min)} - ${formatIdrCurrency(max)}`;
}

export function parseTimeRange(
  hoursText: string | null | undefined,
): { opens: string; closes: string } | null {
  if (!hoursText) return null;
  const match = hoursText.match(
    /(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})/,
  );
  if (!match) return null;
  const [, openH, openM, closeH, closeM] = match;
  return {
    opens: `${openH.padStart(2, "0")}:${openM}`,
    closes: `${closeH.padStart(2, "0")}:${closeM}`,
  };
}

const DAY_NAMES_ID: ReadonlyArray<[RegExp, string]> = [
  [/senin/i, "Monday"],
  [/selasa/i, "Tuesday"],
  [/rabu/i, "Wednesday"],
  [/kamis/i, "Thursday"],
  [/jumat|jum'at/i, "Friday"],
  [/sabtu/i, "Saturday"],
  [/minggu|ahad/i, "Sunday"],
];

const WEEK_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function parseDaysFromLabel(
  label: string | null | undefined,
  fallback: readonly string[],
): string[] {
  if (!label) return [...fallback];

  // Strip time ranges (e.g. "09:00 - 17:00") so their hyphen doesn't break day-range parsing.
  const dayPortion = label.split(/\d{1,2}[.:]\d{2}/)[0] || label;

  // Range syntax: e.g. "Senin - Kamis" or "Sabtu - Minggu"
  const rangeParts = dayPortion.split(/[-–—]/);
  if (rangeParts.length === 2) {
    const startDay = DAY_NAMES_ID.find(([re]) => re.test(rangeParts[0]))?.[1];
    const endDay = DAY_NAMES_ID.find(([re]) => re.test(rangeParts[1]))?.[1];
    if (startDay && endDay) {
      const startIndex = WEEK_ORDER.indexOf(startDay as (typeof WEEK_ORDER)[number]);
      const endIndex = WEEK_ORDER.indexOf(endDay as (typeof WEEK_ORDER)[number]);
      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        return WEEK_ORDER.slice(startIndex, endIndex + 1);
      }
    }
  }

  const matched = DAY_NAMES_ID.filter(([re]) => re.test(dayPortion)).map(([, day]) => day);
  return matched.length > 0 ? matched : [...fallback];
}

export interface OpeningHoursSpec {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export function buildOpeningHoursSpecification(schedule: {
  weekday_label?: string;
  weekday_hours?: string;
  weekend_label?: string;
  weekend_hours?: string;
}): OpeningHoursSpec[] {
  const specs: OpeningHoursSpec[] = [];

  // Handle multi-line operating_hours fallback stored inside weekday_hours
  const rawLines = (schedule.weekday_hours || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length >= 2) {
    for (const line of rawLines) {
      const range = parseTimeRange(line);
      if (!range) continue;
      const days = parseDaysFromLabel(line, []);
      if (days.length > 0) {
        specs.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: days,
          opens: range.opens,
          closes: range.closes,
        });
      }
    }
    if (specs.length > 0) return specs;
  }

  const weekdayRange = parseTimeRange(schedule.weekday_hours);
  if (weekdayRange) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: parseDaysFromLabel(schedule.weekday_label, [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
      ]),
      opens: weekdayRange.opens,
      closes: weekdayRange.closes,
    });
  }

  const weekendRange = parseTimeRange(schedule.weekend_hours);
  if (weekendRange) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: parseDaysFromLabel(schedule.weekend_label, [
        "Saturday",
        "Sunday",
      ]),
      opens: weekendRange.opens,
      closes: weekendRange.closes,
    });
  }

  return specs;
}

export function buildAggregateRating(
  reviews: ReadonlyArray<{ rating?: number }>,
):
  | {
      "@type": "AggregateRating";
      ratingValue: string;
      bestRating: string;
      worstRating: string;
      ratingCount: number;
      reviewCount: number;
    }
  | undefined {
  const validRatings = reviews
    .map((item) => item.rating)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value >= 0.5 && value <= 5,
    );

  if (validRatings.length === 0) return undefined;

  const average =
    validRatings.reduce((sum, value) => sum + value, 0) / validRatings.length;

  return {
    "@type": "AggregateRating",
    ratingValue: average.toFixed(1),
    bestRating: "5",
    worstRating: "0.5",
    ratingCount: validRatings.length,
    reviewCount: validRatings.length,
  };
}

export function normalizePhoneForSchema(
  phone: string | null | undefined,
): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  if (!trimmed || /[xX]/.test(trimmed)) return undefined;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return undefined;

  if (digits.startsWith("0")) {
    return `+62${digits.slice(1)}`;
  }
  if (digits.startsWith("62")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Pure review text truncation & formatting utilities for landing `#reviews` cards.
 *
 * Keeps every review card uniform in height regardless of how long a visitor's
 * submission is (up to the backend's 2,000-character limit), while preserving
 * full multi-paragraph text inside the detail popup modal.
 */

export const MAX_REVIEW_PREVIEW_CHARS = 175;
export const MAX_PREVIEW_PARAGRAPHS = 3;

export interface ReviewPreview {
  /** Text rendered inside the landing review card. */
  excerpt: string;
  /** True when the review was shortened and should show "Lihat selengkapnya...". */
  isTruncated: boolean;
}

/**
 * Strips matching straight/curly outer quotes if the source text is wrapped in
 * them (like fixture reviews), returning the raw inner text and whether quotes
 * were present so truncation never leaves an unclosed quote.
 */
function unwrapQuotes(raw: string): { inner: string; quoted: boolean } {
  const trimmed = raw.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("“") && trimmed.endsWith("”")))
  ) {
    return { inner: trimmed.slice(1, -1).trim(), quoted: true };
  }
  return { inner: trimmed, quoted: false };
}

/**
 * Formats a review for the fixed-height landing card:
 * - Collapses multi-line whitespace so newline-spam reviews cannot stretch cards.
 * - Truncates cleanly on a word boundary (falling back to a hard cut for
 *   unbroken strings such as URLs or repeated characters).
 * - Flags `isTruncated` when the text exceeded `maxChars` or had excessive line breaks.
 */
export function formatReviewPreview(
  rawText: string,
  maxChars: number = MAX_REVIEW_PREVIEW_CHARS,
): ReviewPreview {
  const { inner, quoted } = unwrapQuotes(rawText);
  if (!inner) {
    return { excerpt: "", isTruncated: false };
  }

  const lineCount = inner.split(/\r?\n/).length;
  const normalized = inner.replace(/\s+/g, " ").trim();
  const tooManyLines = lineCount > MAX_PREVIEW_PARAGRAPHS;
  const tooLong = normalized.length > maxChars;

  if (!tooLong && !tooManyLines) {
    return {
      excerpt: quoted ? `"${normalized}"` : normalized,
      isTruncated: false,
    };
  }

  let cut = normalized;
  if (tooLong) {
    const slice = normalized.slice(0, maxChars);
    const lastSpace = slice.lastIndexOf(" ");
    // Prefer a word boundary when one exists reasonably close to the limit;
    // otherwise hard-cut so single 200-char unbroken tokens cannot overflow.
    const boundary = lastSpace >= Math.floor(maxChars * 0.6) ? lastSpace : maxChars;
    cut = slice.slice(0, boundary).replace(/[,.;:!?\-–—\s]+$/u, "");
    if (!cut) {
      cut = slice.trimEnd();
    }
  }

  const withEllipsis = `${cut}…`;
  return {
    excerpt: quoted ? `"${withEllipsis}"` : withEllipsis,
    isTruncated: true,
  };
}

/**
 * Formats the full review body for the popup modal, preserving visitor
 * paragraph line breaks while normalizing outer quotes consistently.
 */
export function formatReviewFullText(rawText: string): string {
  const { inner } = unwrapQuotes(rawText);
  if (!inner) return "";
  // Collapse runs of 3+ blank lines to at most one blank line so extreme newline spam stays readable.
  const cleaned = inner.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return `"${cleaned}"`;
}

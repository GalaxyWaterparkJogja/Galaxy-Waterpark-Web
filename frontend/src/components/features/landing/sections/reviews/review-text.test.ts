import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatReviewFullText,
  formatReviewPreview,
  MAX_REVIEW_PREVIEW_CHARS,
} from "./review-text.ts";

test("short reviews stay intact without truncation", () => {
  const short = '"Kolam anak bersih dan sangat nyaman untuk liburan keluarga."';
  const result = formatReviewPreview(short);

  assert.equal(result.isTruncated, false);
  assert.equal(result.excerpt, short);
});

test("long quoted reviews truncate at a word boundary and keep balanced quotes", () => {
  const longText =
    '"Tempatnya bersih banget! Kolam anak dangkal dan tidak pedih di mata. Ember tumpahnya jadi favorit anak saya umur 4 tahun. Parkiran luas dan makanan di kantinnya enak serta harganya sangat wajar."';
  const result = formatReviewPreview(longText, 175);

  assert.equal(result.isTruncated, true);
  assert.ok(result.excerpt.startsWith('"'));
  assert.ok(result.excerpt.endsWith('…"'));
  assert.ok(result.excerpt.length <= 178);
});

test("very long 2000-character reviews and unbroken words never exceed preview budget", () => {
  const unbroken = "a".repeat(2000);
  const result = formatReviewPreview(unbroken, MAX_REVIEW_PREVIEW_CHARS);

  assert.equal(result.isTruncated, true);
  assert.equal(result.excerpt.length, MAX_REVIEW_PREVIEW_CHARS + 1); // +1 for ellipsis
  assert.ok(result.excerpt.endsWith("…"));
});

test("newline-heavy short reviews collapse whitespace and flag truncation for the modal", () => {
  const newlineSpam = "Baris 1\nBaris 2\nBaris 3\nBaris 4\nBaris 5\nBaris 6";
  const result = formatReviewPreview(newlineSpam, MAX_REVIEW_PREVIEW_CHARS);

  assert.equal(result.isTruncated, true);
  assert.equal(result.excerpt.includes("\n"), false);
  assert.ok(result.excerpt.endsWith("…"));
});

test("formatReviewFullText preserves paragraph breaks and caps excessive empty lines", () => {
  const raw = "Paragraf pertama.\n\n\n\n\nParagraf kedua.\nBaris berikutnya.";
  const full = formatReviewFullText(raw);

  assert.equal(full, '"Paragraf pertama.\n\nParagraf kedua.\nBaris berikutnya."');
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REVIEW_COMMENT_MAX_LENGTH,
  REVIEW_NAME_MAX_LENGTH,
  validateReviewInput,
} from "./review-service.ts";

test("validateReviewInput accepts whole and half-star ratings and trims whitespace", () => {
  const result = validateReviewInput({
    reviewer_name: "  Budi Santoso  ",
    rating: 5,
    comment_text: "  Kolam anak sangat bersih dan menyenangkan.  ",
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.payload, {
    reviewer_name: "Budi Santoso",
    rating: 5,
    comment_text: "Kolam anak sangat bersih dan menyenangkan.",
  });

  const halfStar = validateReviewInput({
    reviewer_name: "Rina",
    rating: 4.5,
    comment_text: "Bagus sekali.",
  });
  assert.deepEqual(halfStar.errors, {});
  assert.equal(halfStar.payload?.rating, 4.5);

  const minimumHalfStar = validateReviewInput({
    reviewer_name: "Dina",
    rating: 0.5,
    comment_text: "Bisa ditingkatkan.",
  });
  assert.deepEqual(minimumHalfStar.errors, {});
  assert.equal(minimumHalfStar.payload?.rating, 0.5);
});

test("validateReviewInput rejects missing or out-of-range ratings and blank fields", () => {
  const empty = validateReviewInput({
    reviewer_name: "   ",
    rating: 0,
    comment_text: "",
  });

  assert.equal(empty.payload, null);
  assert.ok(empty.errors.rating);
  assert.ok(empty.errors.reviewer_name);
  assert.ok(empty.errors.comment_text);

  const quarterStar = validateReviewInput({
    reviewer_name: "Rina",
    rating: 4.25,
    comment_text: "Bagus sekali.",
  });
  assert.equal(quarterStar.payload, null);
  assert.ok(quarterStar.errors.rating);

  const tooHigh = validateReviewInput({
    reviewer_name: "Rina",
    rating: 6,
    comment_text: "Bagus sekali.",
  });
  assert.equal(tooHigh.payload, null);
  assert.ok(tooHigh.errors.rating);
});

test("validateReviewInput enforces backend maximum character limits", () => {
  const overlong = validateReviewInput({
    reviewer_name: "a".repeat(REVIEW_NAME_MAX_LENGTH + 1),
    rating: 4,
    comment_text: "b".repeat(REVIEW_COMMENT_MAX_LENGTH + 1),
  });

  assert.equal(overlong.payload, null);
  assert.ok(overlong.errors.reviewer_name);
  assert.ok(overlong.errors.comment_text);
});

import { getApiBaseUrl } from "./api-client.ts";

export const REVIEW_NAME_MAX_LENGTH = 100;
export const REVIEW_COMMENT_MAX_LENGTH = 2000;
export const REVIEW_REQUEST_TIMEOUT_MS = 10_000;

export interface ReviewSubmissionPayload {
  reviewer_name: string;
  rating: number;
  comment_text: string;
}

export interface ReviewSubmissionResult {
  id: number;
  status: string;
  message: string;
}

export type ReviewFieldKey = keyof ReviewSubmissionPayload;
export type ReviewFieldErrors = Partial<Record<ReviewFieldKey, string>>;

export class ReviewSubmissionError extends Error {
  readonly status: number;
  readonly fieldErrors: ReviewFieldErrors;

  constructor(
    message: string,
    status: number,
    fieldErrors: ReviewFieldErrors = {},
  ) {
    super(message);
    this.name = "ReviewSubmissionError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function validateReviewInput(input: {
  reviewer_name: string;
  rating: number;
  comment_text: string;
}): { payload: ReviewSubmissionPayload | null; errors: ReviewFieldErrors } {
  const errors: ReviewFieldErrors = {};
  const reviewerName = input.reviewer_name.trim();
  const commentText = input.comment_text.trim();
  const rating = input.rating;

  if (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2)) {
    errors.rating = "Pilih rating bintang antara 0,5 sampai 5 dengan kelipatan 0,5.";
  }

  if (!reviewerName) {
    errors.reviewer_name = "Nama wajib diisi.";
  } else if (reviewerName.length > REVIEW_NAME_MAX_LENGTH) {
    errors.reviewer_name = `Nama maksimal ${REVIEW_NAME_MAX_LENGTH} karakter.`;
  }

  if (!commentText) {
    errors.comment_text = "Ulasan & pengalaman wajib diisi.";
  } else if (commentText.length > REVIEW_COMMENT_MAX_LENGTH) {
    errors.comment_text = `Ulasan maksimal ${REVIEW_COMMENT_MAX_LENGTH} karakter.`;
  }

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  return {
    payload: {
      reviewer_name: reviewerName,
      rating,
      comment_text: commentText,
    },
    errors: {},
  };
}

function parseFieldErrors(
  rawErrors: Record<string, string | string[]> | undefined,
): ReviewFieldErrors {
  if (!rawErrors || typeof rawErrors !== "object") return {};

  const mapped: ReviewFieldErrors = {};
  const keys: ReviewFieldKey[] = ["reviewer_name", "rating", "comment_text"];
  for (const key of keys) {
    const entry = rawErrors[key];
    const message = Array.isArray(entry) ? entry[0] : entry;
    if (typeof message === "string" && message.trim()) {
      mapped[key] = message.trim();
    }
  }
  return mapped;
}

/**
 * Submits a visitor review to Laravel `POST /public/reviews`.
 * New reviews are stored with `status: "pending"` awaiting admin moderation.
 */
export async function submitPublicReview(
  payload: ReviewSubmissionPayload,
): Promise<ReviewSubmissionResult> {
  const url = `${getApiBaseUrl()}/public/reviews`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REVIEW_REQUEST_TIMEOUT_MS),
    });
  } catch (reason) {
    if (reason instanceof Error && reason.name === "TimeoutError") {
      throw new ReviewSubmissionError(
        "Permintaan habis waktu. Periksa koneksi Anda lalu coba kirim ulang.",
        0,
      );
    }
    throw new ReviewSubmissionError(
      "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.",
      0,
    );
  }

  interface ReviewApiResponse {
    success?: boolean;
    message?: string;
    data?: { id?: number; status?: string };
    errors?: Record<string, string | string[]>;
  }

  let body: ReviewApiResponse | null = null;

  try {
    body = (await response.json()) as ReviewApiResponse;
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ReviewSubmissionError(
        "Terlalu banyak pengiriman ulasan dalam waktu singkat. Silakan coba lagi beberapa menit lagi.",
        429,
      );
    }

    const fieldErrors = parseFieldErrors(body?.errors);
    const serverMessage =
      typeof body?.message === "string" && body.message.trim()
        ? body.message.trim()
        : response.status === 422
          ? "Periksa kembali data ulasan yang Anda isi."
          : "Ulasan gagal dikirim. Silakan coba lagi beberapa saat lagi.";

    throw new ReviewSubmissionError(serverMessage, response.status, fieldErrors);
  }

  return {
    id: Number(body?.data?.id ?? 0),
    status: String(body?.data?.status ?? "pending"),
    message:
      typeof body?.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Ulasan berhasil dikirim dan menunggu moderasi.",
  };
}

export interface AdminIdentity {
  id: number;
  name: string;
  email: string;
}

export interface AdminSession {
  token: string;
  expires_at: string;
  admin: AdminIdentity;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

const LOCAL_SESSION_KEY = "galaxy-admin-session";
const TEMP_SESSION_KEY = "galaxy-admin-session-temporary";
const ADMIN_REQUEST_TIMEOUT_MS = 10_000;
// Multipart uploads carry a processed image, so they get a longer window on slow links.
const ADMIN_UPLOAD_TIMEOUT_MS = 60_000;

function getAdminApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const baseUrl = (configuredUrl || "http://127.0.0.1:8000").replace(/\/+$/, "");

  return baseUrl.replace(/\/api$/i, "");
}

export async function adminApiRequest<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getAdminApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(
        options.body instanceof FormData
          ? ADMIN_UPLOAD_TIMEOUT_MS
          : ADMIN_REQUEST_TIMEOUT_MS,
      ),
    });
  } catch (reason) {
    if (reason instanceof Error && reason.name === "TimeoutError") {
      throw new Error("Server terlalu lama merespons. Pastikan backend Laravel berjalan, lalu coba lagi.");
    }
    if (reason instanceof TypeError) {
      throw new Error("Tidak dapat terhubung ke backend. Pastikan backend Laravel berjalan di port 8000.");
    }
    throw reason;
  }

  let payload: {
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
  } = {};
  try {
    payload = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("Respons server tidak dapat dibaca.");
    }
  }

  if (!response.ok) {
    const validationMessage = payload.errors
      ? Object.values(payload.errors).flat().find((message) => message.trim())
      : undefined;
    throw new AdminApiError(
      validationMessage || payload.message || `Permintaan gagal (${response.status}).`,
      response.status,
    );
  }

  return payload.data as T;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const serialized =
    window.sessionStorage.getItem(TEMP_SESSION_KEY) ||
    window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (!serialized) return null;

  try {
    const session = JSON.parse(serialized) as AdminSession;
    if (
      typeof session.token !== "string" ||
      typeof session.expires_at !== "string" ||
      !session.admin ||
      typeof session.admin.id !== "number" ||
      typeof session.admin.name !== "string" ||
      typeof session.admin.email !== "string"
    ) {
      clearAdminSession();
      return null;
    }

    if (Date.parse(session.expires_at) <= Date.now()) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function saveAdminSession(session: AdminSession, remember: boolean): void {
  clearAdminSession();
  const storage = remember ? window.localStorage : window.sessionStorage;
  const key = remember ? LOCAL_SESSION_KEY : TEMP_SESSION_KEY;
  storage.setItem(key, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(TEMP_SESSION_KEY);
}

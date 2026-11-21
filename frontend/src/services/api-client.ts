import type { ApiErrorResponse, ApiResponse } from "@/types/api";

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  const baseUrl = (envUrl ? envUrl.trim() : "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  return baseUrl.replace(/\/api$/i, "");
}

function getBaseUrl(): string {
  return getApiBaseUrl();
}

export function resolveApiAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  const assetUrl = /^https?:\/\//i.test(path) ? new URL(path) : null;
  const assetPath = assetUrl?.pathname ?? path;
  if (!assetPath.startsWith("/storage/")) return path;

  return `${new URL(getBaseUrl()).origin}${assetPath}${assetUrl?.search ?? ""}${assetUrl?.hash ?? ""}`;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

interface CombinedSignalResult {
  signal: AbortSignal;
  cleanup?: () => void;
}

/**
 * Merge an optional caller AbortSignal with a timeout signal.
 * Ensures the fetch is aborted either when the caller cancels or when the timeout expires.
 * Cleans up listeners on completion to prevent memory leaks in long-running sessions.
 */
function createCombinedSignal(
  callerSignal?: AbortSignal | null,
  timeoutMs = DEFAULT_TIMEOUT_MS
): CombinedSignalResult {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) {
    return { signal: timeoutSignal };
  }

  if (typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([callerSignal, timeoutSignal]) };
  }

  // Fallback if AbortSignal.any is not supported in the runtime environment
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(callerSignal.aborted ? callerSignal.reason : timeoutSignal.reason);
  };

  if (callerSignal.aborted) {
    controller.abort(callerSignal.reason);
    return { signal: controller.signal };
  }
  if (timeoutSignal.aborted) {
    controller.abort(timeoutSignal.reason);
    return { signal: controller.signal };
  }

  callerSignal.addEventListener("abort", onAbort, { once: true });
  timeoutSignal.addEventListener("abort", onAbort, { once: true });

  const cleanup = () => {
    callerSignal.removeEventListener("abort", onAbort);
    timeoutSignal.removeEventListener("abort", onAbort);
  };

  return { signal: controller.signal, cleanup };
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...customConfig } = options;

  const baseUrl = getBaseUrl();
  let url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const { signal: combinedSignal, cleanup } = createCombinedSignal(signal, timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      signal: combinedSignal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } finally {
    cleanup?.();
  }

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = (await response.json()) as
        | Partial<ApiErrorResponse>
        | { error?: string | { message?: string; details?: unknown } }
        | { message?: string; errors?: Record<string, string | string[]> };

      if (errorBody && typeof errorBody === "object") {
        if ("message" in errorBody && typeof errorBody.message === "string" && errorBody.message.trim()) {
          errorMessage = errorBody.message;
        } else if ("error" in errorBody) {
          if (typeof errorBody.error === "string" && errorBody.error.trim()) {
            errorMessage = errorBody.error;
          } else if (
            errorBody.error &&
            typeof errorBody.error === "object" &&
            "message" in errorBody.error &&
            typeof errorBody.error.message === "string" &&
            errorBody.error.message.trim()
          ) {
            errorMessage = errorBody.error.message;
          }
        }

        if ("errors" in errorBody && errorBody.errors && typeof errorBody.errors === "object") {
          const detailMessages = Object.values(errorBody.errors)
            .flat()
            .filter((msg): msg is string => typeof msg === "string" && msg.trim().length > 0);
          if (detailMessages.length > 0) {
            errorMessage = errorMessage
              ? `${errorMessage} (${detailMessages.join(", ")})`
              : detailMessages.join(", ");
          }
        }
      }
    } catch {
      // Non-JSON error response; retain HTTP status error message.
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

import { useAuthStore } from "@/store/auth.store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";
const CSRF_HEADER_VALUE = "KSL-Client";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message = `API ${status}: ${path}`,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extract a human-readable message from a failed response body.
 *
 * FastAPI reports errors as `{ "detail": ... }` where `detail` is either a
 * string or, for validation failures, an array of `{ loc, msg, ... }` objects.
 * The raw `detail` is preserved on {@link ApiError.detail} so callers can
 * inspect it, while the derived string becomes the error message instead of
 * being silently discarded.
 */
async function extractResponseError(
  res: Response
): Promise<{ message?: string; detail?: unknown }> {
  let raw: string;
  try {
    raw = await res.text();
  } catch {
    return {};
  }
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Non-JSON body (e.g. an HTML error page) — surface it verbatim.
    return { message: raw };
  }

  const detail =
    parsed && typeof parsed === "object" && "detail" in parsed
      ? (parsed as { detail: unknown }).detail
      : parsed;

  if (typeof detail === "string") {
    return { message: detail, detail };
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      })
      .filter(Boolean)
      .join("; ");
    return { message: message || undefined, detail };
  }

  return { detail };
}

export type ApiFetchOptions = RequestInit & {
  accessToken?: string;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthSession(): Promise<string | null> {
  // Deduplicate: if a refresh is already in-flight, reuse that same promise.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const store = useAuthStore.getState();
    const user = store.user;
    if (!user || user?.is_guest) return null;

    store.setRefreshing(true);
    try {
      const res = await fetch(`${baseURL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-store",
          "X-Requested-With": CSRF_HEADER_VALUE,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // The refresh failed — possibly a stale cookie race condition.
          // Wait briefly for the browser cookie jar to settle, then retry
          // once before concluding the session is truly invalid.
          await new Promise((r) => setTimeout(r, 500));
          const retryRes = await fetch(`${baseURL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Cache-Control": "no-store",
              "X-Requested-With": CSRF_HEADER_VALUE,
            },
          });
          if (retryRes.ok) {
            const retryToken = (await retryRes.json()) as {
              access_token: string;
              token_type: string;
              user?: { id: string; email: string | null; first_name: string; last_name: string | null; picture: string | null; provider: string; account_type?: string; is_guest?: boolean } | null;
            };
            store.setAccessToken(retryToken);
            return retryToken?.access_token;
          }
          // Retry also failed — session is gone
          store.clear();
        }
        return null;
      }

      const tokenResp = (await res.json()) as {
        access_token: string;
        token_type: string;
        user?: { id: string; email: string | null; first_name: string; last_name: string | null; picture: string | null; provider: string; account_type?: string; is_guest?: boolean } | null;
      };
      store.setAccessToken(tokenResp);
      return tokenResp?.access_token;
    } catch (err) {
      // Transient failure (e.g. the network is down). The caller treats a null
      // result as "could not refresh"; log so the failure isn't invisible.
      console.warn("Auth session refresh failed:", err);
      return null;
    } finally {
      store.setRefreshing(false);
    }
  })().finally(() => {
    // Clear immediately after resolution so future calls can do a fresh refresh
    // with the newly-rotated cookie instead of reusing a stale result.
    refreshPromise = null;
  });

  return refreshPromise;
}

async function getFreshTokenIfNeeded(): Promise<string | null> {
  const store = useAuthStore.getState();
  if (!store.user || store.user?.is_guest) return store.token;
  if (store.token && !store.isTokenExpired()) return store.token;
  return refreshAuthSession();
}

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const {
    accessToken,
    skipAuth,
    retryOnUnauthorized = true,
    headers: initHeaders,
    ...requestInit
  } = init;

  const headers = new Headers(initHeaders);
  const bodyIsFormData =
    typeof FormData !== "undefined" && requestInit.body instanceof FormData;
  if (requestInit.body && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = accessToken ?? (await getFreshTokenIfNeeded());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${baseURL}${path}`, {
    ...requestInit,
    headers,
    cache: requestInit.cache ?? "no-store",
    credentials: "include",
  });

  if (res.status === 401 && !skipAuth && retryOnUnauthorized) {
    const newToken = await refreshAuthSession();
    if (newToken) {
      return apiFetch<T>(path, {
        ...init,
        accessToken: newToken,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!res.ok) {
    // No redundant store.clear() here — refreshAuthSession() already handles
    // clearing auth on confirmed 401 (revoked token). Clearing here would
    // double-clear or incorrectly clear when refresh returned null due to a
    // transient error.
    const { message, detail } = await extractResponseError(res);
    throw new ApiError(res.status, path, message, detail);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

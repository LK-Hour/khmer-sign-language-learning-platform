import { useAuthStore } from "@/store/auth.store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";
const CSRF_HEADER_VALUE = "KSL-Client";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message = `API ${status}: ${path}`
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiFetchOptions = RequestInit & {
  accessToken?: string;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthSession(): Promise<string | null> {
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
          store.clear();
          return null;
        }

        const tokenResp = (await res.json()) as {
          access_token: string;
          token_type: string;
        };
        store.setAccessToken(tokenResp);
        return tokenResp?.access_token;
      } catch {
        // Network error (e.g., backend unreachable) — return null silently
        return null;
      } finally {
        store.setRefreshing(false);
        refreshPromise = null;
      }
  })();

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
  if (requestInit.body && !headers.has("Content-Type")) {
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
    if (res.status === 401) {
      const store = useAuthStore.getState();
      if (!store.user?.is_guest) {
        store.clear();
      }
    }
    throw new ApiError(res.status, path);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

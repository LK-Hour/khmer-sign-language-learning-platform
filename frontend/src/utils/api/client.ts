const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

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
  onUnauthorized?: () => void;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const { accessToken, onUnauthorized, headers: initHeaders, ...requestInit } = init;

  const headers = new Headers(initHeaders);
  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${baseURL}${path}`, {
    ...requestInit,
    headers,
  });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    throw new ApiError(res.status, path);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

import { useAuthStore } from "@/zustand/auth.store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseURL}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    useAuthStore.getState().clear();
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

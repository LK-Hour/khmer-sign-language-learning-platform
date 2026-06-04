import { apiFetch } from "@/http/client";

export async function fsFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return apiFetch<T>(path, init);
}

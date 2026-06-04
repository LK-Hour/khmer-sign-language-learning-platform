/** When `"true"`, finger-spelling uses local mock data instead of the backend API. */
export const FS_USE_MOCK = process.env.NEXT_PUBLIC_FS_USE_MOCK === "true";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

/** Turn DB media paths into browser-loadable URLs served by the backend. */
export function resolveApiAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;

  const normalized = url.replace(/\\/g, "/").replace(/^\.\//, "");
  return `${API_BASE_URL}/${normalized}`;
}

/**
 * Central SEO configuration.
 *
 * All metadata (layouts, sitemap, robots) reads from here so the production
 * domain, default images, and locale list only need to be defined once.
 */

import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

/**
 * Request header set by middleware.ts carrying the locale parsed from the
 * URL. Read by the root layout to set `<html lang>` accurately for SEO,
 * without needing access to the `[locale]` route segment's params.
 */
export const LOCALE_HEADER = "x-ksl-locale";

/** Resolve the canonical production site URL, no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Khmer Sign Language Platform";

/** Default Open Graph / Twitter share image, relative to /public. */
export const DEFAULT_OG_IMAGE = "/assets/landing-hero-hand.png";

/** Locales that should be exposed to search engines via hreflang + sitemap. */
export const INDEXABLE_LOCALES = SUPPORTED_LOCALES;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Build the `alternates.languages` map Next.js expects for hreflang tags. */
export function buildLanguageAlternates(
  pathWithoutLocale: string,
): Record<string, string> {
  const normalized = pathWithoutLocale.startsWith("/")
    ? pathWithoutLocale
    : `/${pathWithoutLocale}`;

  const languages: Record<string, string> = {};
  for (const locale of INDEXABLE_LOCALES) {
    languages[locale] = absoluteUrl(`/${locale}${normalized}`);
  }
  // "x-default" tells crawlers which version to show when no locale matches.
  languages["x-default"] = absoluteUrl(`/${INDEXABLE_LOCALES[0]}${normalized}`);
  return languages;
}

/** Routes that are authenticated / low SEO-value and should not be indexed. */
export const DISALLOWED_ROBOTS_PATHS = [
  "/admin",
  "/*/admin",
  "/*/finger-spelling",
  "/*/words",
  "/*/login",
  "/*/profile",
];

export type { Locale };

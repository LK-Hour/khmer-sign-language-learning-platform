import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["kh", "en"] as const;
const DEFAULT_LOCALE = "kh";

function isValidLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number]);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // If the pathname already has a valid locale prefix, let it through
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Try to get locale from cookie
  let locale = request.cookies.get("NEXT_LOCALE")?.value;

  // Fallback to accept-language header
  if (!locale) {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(",")[0]
        .split("-")[0]
        .toLowerCase();
      locale = isValidLocale(preferredLocale) ? preferredLocale : undefined;
    }
  }

  // Default to Khmer
  locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  // Redirect to locale-prefixed path
  const response = NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );

  response.cookies.set("NEXT_LOCALE", locale, {
    maxAge: 31536000,
    path: "/",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

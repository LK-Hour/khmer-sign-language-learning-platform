import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  isValidLocale,
  SUPPORTED_LOCALES,
} from "@/i18n/config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  let locale = request.cookies.get("NEXT_LOCALE")?.value;

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

  locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

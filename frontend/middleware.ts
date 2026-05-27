import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isValidLocale, SUPPORTED_LOCALES } from './src/i18n/config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname already starts with a locale
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Try to get locale from cookie
  let locale = request.cookies.get('NEXT_LOCALE')?.value;

  // If no cookie, try to get from Accept-Language header
  if (!locale) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(',')[0]
        .split('-')[0]
        .toLowerCase();
      locale = isValidLocale(preferredLocale) ? preferredLocale : undefined;
    }
  }

  // Default to Khmer if no valid locale found
  locale = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  // Redirect to locale path
  const response = NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );

  // Set locale cookie
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 31536000, // 1 year
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static assets and api routes
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

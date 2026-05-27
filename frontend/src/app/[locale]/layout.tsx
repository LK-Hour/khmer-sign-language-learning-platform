import { Locale } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/LocaleProvider";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  return (
    <LocaleProvider initialLocale={locale}>
      {children}
    </LocaleProvider>
  );
}

import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/LocaleProvider";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isValidLocale(rawLocale)) {
    redirect(`/${DEFAULT_LOCALE}`);
  }

  return (
    <LocaleProvider initialLocale={rawLocale}>
      <AppLayout>{children}</AppLayout>
    </LocaleProvider>
  );
}

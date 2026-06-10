  import type { Locale } from "@/i18n/config";

import Iconify from "@/components/iconify";

const LOCALE_FLAG_ICONS: Record<Locale, string> = {
  en: "twemoji:flag-united-kingdom",
  kh: "twemoji:flag-cambodia",
};

type LocaleFlagProps = {
  locale: Locale;
  size?: number;
};

export default function LocaleFlag({ locale, size = 22 }: LocaleFlagProps) {
  return (
    <Iconify
      icon={LOCALE_FLAG_ICONS[locale]}
      width={size}
      aria-hidden
      sx={{ flexShrink: 0 }}
    />
  );
}

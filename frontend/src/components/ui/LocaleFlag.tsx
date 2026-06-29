import Image from "next/image";
import type { Locale } from "@/i18n/config";

const LOCALE_FLAG_SRC: Record<Locale, string> = {
  kh: "/assets/flags/kh.svg",
  en: "/assets/flags/en.svg",
};

type LocaleFlagProps = {
  locale: Locale;
  size?: number;
};

export default function LocaleFlag({ locale, size = 22 }: LocaleFlagProps) {
  return (
    <Image
      src={LOCALE_FLAG_SRC[locale]}
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      style={{
        flexShrink: 0,
        display: "block",
        borderRadius: 2,
        objectFit: "cover",
      }}
    />
  );
}

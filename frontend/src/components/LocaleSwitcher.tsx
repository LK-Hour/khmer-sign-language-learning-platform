'use client';

import { useLocaleStore } from '@/i18n/localeStore';
import { usePathname, useRouter } from 'next/navigation';
import { LOCALE_NAMES, SUPPORTED_LOCALES, Locale } from '@/i18n/config';
import { Button } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useLocaleStore();
  const { t } = useTranslation();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);

    // Update the URL to the new locale path
    const segments = pathname.split('/');
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPathname = segments.join('/') || `/${newLocale}`;
    router.push(newPathname);
  };

  return (
    <div className="flex gap-2">
      {SUPPORTED_LOCALES.map((loc) => (
        <Button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          variant={locale === loc ? 'contained' : 'outlined'}
          size="small"
          sx={{
            textTransform: 'none',
            fontWeight: locale === loc ? 600 : 400,
          }}
        >
          {LOCALE_NAMES[loc]}
        </Button>
      ))}
    </div>
  );
}

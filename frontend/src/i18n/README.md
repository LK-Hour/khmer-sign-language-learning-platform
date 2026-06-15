# i18n (Internationalization) Setup Guide

## Overview

This project uses a custom i18n implementation for Khmer (kh) and English (en) localization, with Khmer as the default locale.

## File Structure

```
src/
├── i18n/
│   ├── config.ts              # Locale configuration & validation
│   ├── translations.ts        # Translation strings (Khmer & English)
│   ├── localeStore.ts         # Zustand store for locale state
│   ├── LocaleProvider.tsx      # React context provider for locale
│   ├── useTranslation.ts      # Custom hook for using translations
│   └── README.md              # This file
├── components/
│   └── LocaleSwitcher.tsx     # Locale switcher component
└── app/
    └── [locale]/              # Dynamic locale routing
        ├── layout.tsx         # Locale-specific layout
        └── page.tsx           # Home page with locale support

middleware.ts                   # Next.js middleware for locale routing
```

## Features

- Default locale: Khmer (kh)
- Supported locales: Khmer and English
- URL-based routing: `/kh/...` and `/en/...`
- Persistent locale preference (localStorage)
- Browser language detection
- Locale cookie for server-side detection
- Easy translation hook with TypeScript support

## Usage

### 1. Basic Translation in Components

```tsx
'use client';

import { useTranslation } from '@/i18n/useTranslation';

export function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('home')}</p>
      <span>Current locale: {locale}</span>
    </div>
  );
}
```

### 2. Using the Locale Switcher

```tsx
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export function Navbar() {
  return (
    <nav>
      <h1>My App</h1>
      <LocaleSwitcher />
    </nav>
  );
}
```

### 3. Direct Locale Store Access

```tsx
'use client';

import { useLocaleStore } from '@/i18n';

export function SettingsComponent() {
  const { locale, setLocale, toggleLocale } = useLocaleStore();

  return (
    <div>
      <p>Current: {locale}</p>
      <button onClick={() => setLocale('kh')}>Use Khmer</button>
      <button onClick={() => setLocale('en')}>Use English</button>
      <button onClick={toggleLocale}>Toggle Locale</button>
    </div>
  );
}
```

## Adding New Translations

Edit `src/i18n/translations.ts`:

```ts
const translations: Record<Locale, Translations> = {
  kh: {
    welcome: 'សូមស្វាគមន៍',
    newKey: 'ការបកប្រែថ្មី',
    // ... more translations
  },
  en: {
    welcome: 'Welcome',
    newKey: 'New Translation',
    // ... more translations
  },
};
```

## How It Works

### Middleware Flow

1. User visits site without locale (e.g., `/home`)
2. `middleware.ts` intercepts the request
3. Checks for valid locale in URL path
4. If not found, tries to get locale from cookie or Accept-Language header
5. Defaults to Khmer if no valid locale found
6. Redirects to `/kh/home` with locale cookie set

### Client-Side Flow

1. `LocaleProvider` wraps the app
2. `useLocaleStore` provides current locale and setter
3. Component uses `useTranslation()` hook
4. `LocaleSwitcher` allows users to change locale
5. Locale preference is saved to localStorage
6. URL is updated to reflect the new locale

### Persistence

- **localStorage**: Stores user's locale preference
- **Cookie**: Server-side detection for first-time visitors
- **URL**: Primary source of truth for current locale

## Configuration

Default settings in `src/i18n/config.ts`:

```ts
export const DEFAULT_LOCALE: Locale = 'kh'; // Khmer as default
export const SUPPORTED_LOCALES = ['kh', 'en'];
```

## Next Steps

1. Add more translation keys as you build features
2. Create nested translation objects for complex structures
3. Consider using JSON files for easier translation management
4. Integrate with translation management services (optional)

## TypeScript Support

All locale keys are strings. For type-safe translations, consider:

```ts
type TranslationKey = keyof typeof translations.en;

function t(locale: Locale, key: TranslationKey): string {
  // Type-safe version
}
```

## Testing Locale Switching

1. Visit `http://localhost:3000` → Redirects to `/kh` (Khmer)
2. Click language buttons to switch to `/en` (English)
3. Refresh page → Locale preference persists
4. Clear localStorage → Falls back to browser language or Khmer
5. Check Network tab → See `NEXT_LOCALE` cookie being set

## Troubleshooting

**Locale not persisting**: Check browser localStorage is enabled
**URL not updating**: Ensure router.push() is called correctly
**Translations not showing**: Verify key exists in `translations.ts`
**Middleware not working**: Check `config.matcher` in `middleware.ts`

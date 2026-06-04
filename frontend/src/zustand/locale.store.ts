import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Locale,
  isValidLocale,
  DEFAULT_LOCALE,
} from "@/i18n/config";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,

      setLocale: (locale: Locale) => {
        if (isValidLocale(locale)) {
          set({ locale });
          if (typeof document !== "undefined") {
            document.documentElement.lang = locale;
          }
        }
      },

      toggleLocale: () => {
        set((state) => {
          const newLocale: Locale = state.locale === "kh" ? "en" : "kh";
          if (typeof document !== "undefined") {
            document.documentElement.lang = newLocale;
          }
          return { locale: newLocale };
        });
      },
    }),
    {
      name: "locale-storage",
      skipHydration: false,
    }
  )
);

"use client";


import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { getLocalizedPair } from "@/i18n/localizedText";
import { formatUnitBadge } from "@/features/finger-spelling/utils/chapter";

type FingerSpellingShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Khmer counterpart — when set, title/subtitle swap by locale. */
  titleKh?: string;
  headerVariant?: AppHeaderVariant;
  contextBadge?: string;
  contextUnitIndex?: number;
  contextTitle?: string;
  contextSubtitle?: string;
  contextTitleKh?: string;
  hideBottomNav?: boolean;
  fullWidth?: boolean;
};

function resolveFingerSpellingNav(pathname: string): string {
  if (pathname.includes("/finger-spelling/exercise")) {
    return ROUTES.fingerSpelling.exercise;
  }
  if (pathname.includes("/dictionary")) {
    return ROUTES.dictionary;
  }
  if (pathname.includes("/profile")) {
    return ROUTES.profile;
  }
  if (pathname.includes("/finger-spelling")) {
    return ROUTES.fingerSpelling.root;
  }
  return ROUTES.fingerSpelling.root;
}

export default function FingerSpellingShell({
  children,
  title,
  subtitle,
  titleKh,
  contextTitle,
  contextSubtitle,
  contextTitleKh,
  contextUnitIndex,
  contextBadge: contextBadgeProp,
  ...props
}: FingerSpellingShellProps) {
  const { t, locale } = useTranslation();

  const contextBadge =
    contextUnitIndex != null
      ? formatUnitBadge(contextUnitIndex, locale, t("fsUnit"))
      : contextBadgeProp;

  const header = titleKh
    ? getLocalizedPair(locale, title, titleKh)
    : { primary: title, secondary: subtitle };

  const context = contextTitle
    ? getLocalizedPair(
        locale,
        contextTitle,
        contextTitleKh ?? contextSubtitle ?? titleKh ?? subtitle
      )
    : null;
  const navItems = [
    {
      key: "fsNavHome",
      label: t("fsNavHome"),
      href: ROUTES.fingerSpelling.root,
      icon: HomeOutlinedIcon,
    },
    {
      key: "fsNavExercise",
      label: t("fsNavExercise"),
      href: ROUTES.fingerSpelling.exercise,
      icon: EditOutlinedIcon,
    },
    {
      key: "fsNavDictionary",
      label: t("fsNavDictionary"),
      href: ROUTES.dictionary,
      icon: MenuBookOutlinedIcon,
    },
    {
      key: "fsNavProfile",
      label: t("fsNavProfile"),
      href: ROUTES.profile,
      icon: PersonOutlinedIcon,
    },
  ];

  return (
    <AppShell
      {...props}
      contextBadge={contextBadge}
      title={header.primary}
      subtitle={header.secondary}
      contextTitle={context?.primary}
      contextSubtitle={context?.secondary}
      navItems={navItems}
      resolveActiveNav={resolveFingerSpellingNav}
    >
      {children}
    </AppShell>
  );
}

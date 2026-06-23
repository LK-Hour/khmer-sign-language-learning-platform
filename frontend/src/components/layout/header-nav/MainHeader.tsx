"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  
} from "@mui/material";

import Iconify from "@/components/iconify";
import LocaleFlag from "@/components/ui/LocaleFlag";
import { ROUTES } from "@/constants/routes";
import { logout } from "@/features/auth/api/auth";
import {
  LOCALE_FULL_NAMES,
  SUPPORTED_LOCALES,
  isValidLocale,
  type Locale,
} from "@/i18n/config";
import { useLocaleStore } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { KslColors, KslFontSizes } from "@/theme/theme";

import MainHeaderSkeleton, { MAIN_HEADER_HEIGHT } from "./MainHeaderSkeleton";

const LOGO_SRC = "/assets/logo.png";

const headerFadeInSx = {
  "@keyframes headerFadeInFromTop": {
    from: {
      opacity: 0,
      transform: "translateY(-10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
  animation: "headerFadeInFromTop 0.5s ease-out both",
};

function persistLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

const navItemBase = {
  display: "inline-flex",
  alignItems: "center",
  px: 1.5,
  py: 0.75,
  borderRadius: "8px",
  border: "none",
  fontSize: 16,
  fontFamily: "niradei",
  cursor: "pointer",
  textDecoration: "none",
  transition: "background-color 0.15s, color 0.15s",
  whiteSpace: "nowrap",
  lineHeight: 1.5,
};

const navItemSx = (active: boolean) => ({
  ...navItemBase,
  fontWeight: active ? 600 : 500,
  bgcolor: active ? KslColors.primaryLight : "transparent",
  color: active ? KslColors.primary : KslColors.textPrimary,
  "&:hover": {
    bgcolor: active ? KslColors.primaryLight : "action.hover",
    color: KslColors.primary,
  },
});


const DROPDOWN_BG = "background.paper";

const dropdownPaperSx = {
  borderRadius: "8px",
  overflow: "hidden",
  border: `1px solid ${KslColors.border}`,
  boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
  bgcolor: DROPDOWN_BG,
  width: "100%",
};

const dropdownItemSx = (active: boolean) => ({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  px: 2,
  py: 1.25,
  fontWeight: active ? 600 : 500,
  fontSize: KslFontSizes.sm,
  color: active ? KslColors.primary : KslColors.textPrimary,
  bgcolor: active ? KslColors.primaryLighter : DROPDOWN_BG,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background-color 0.15s, color 0.15s",
  "&:hover": {
    bgcolor: KslColors.primaryLighter,
    color: KslColors.primary,
  },
});

const dropdownItemRowSx = (active: boolean) => ({
  ...dropdownItemSx(active),
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  py: 1,
});

type ProfileLogoutBlockProps = {
  displayName: string;
  initials: string;
  picture?: string | null;
  pictureIcon?: ReactNode;
  logoutLabel: string;
  onLogoutClick: () => void;
  avatarSize?: number;
  nameFontSize?: number;
};

function ProfileLogoutBlock({
  displayName,
  initials,
  picture,
  logoutLabel,
  onLogoutClick,
  avatarSize = 32,
  nameFontSize = 14,
}: ProfileLogoutBlockProps) {
  return (
     <>
     <Tooltip title={logoutLabel} arrow placement="bottom">
      <Stack  onClick={onLogoutClick} sx={{ border: `1.5px solid ${KslColors.border}`, borderRadius: "10px", px: 2, py: 0.5, my: 2, cursor: "pointer" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <Avatar
                src={picture ?? ""}
                alt={displayName}
                sx={{
                  width: avatarSize,
                  height: avatarSize,
                }}
              >
                {picture ? initials : <Iconify icon="solar:user-bold" />}
            </Avatar>

              <Stack>
                <Typography
                sx={{
                  fontSize: nameFontSize,
                  fontWeight: 600,
                  color: KslColors.textPrimary,
                  overflow: "hidden",
                }}
              >
                {displayName.length > 10
                  ? `${displayName.slice(0, 8)}...`
                  : displayName}
              </Typography>
              <Stack
                spacing={1}
                direction="row"
                aria-label={logoutLabel}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  fontFamily: "niradei",
                  transition: "opacity 0.1s",
                  "&:hover": { opacity: 0.7 },
                }}
              >
                <Typography
                  sx={{
                    fontSize: KslFontSizes.sm,
                    fontWeight: 500,
                    color: KslColors.error,
                  }}
                >
                  {logoutLabel}
                </Typography>
                <Iconify icon="material-symbols:logout" sx={{ width: 20, height: 20, color: KslColors.error }} />
              </Stack>
            </Stack>
          </Stack>
      </Stack>
     </Tooltip>
     </>
  );
}

function BrandLogo({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  return (
    <Stack
      component={Link}
      href={`/${locale}`}
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", textDecoration: "none", color: "inherit" }}
    >
      <Image
        src={LOGO_SRC}
        alt={t("brandLogoAlt")}
        width={44}
        height={44}
        style={{ borderRadius: 6, objectFit: "cover" }}
      />
      <Stack spacing={0} sx={{ justifyContent: "center" }}>
        <Typography
          sx={{
            fontSize: KslFontSizes.xs,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: KslColors.primary,
            lineHeight: 1.2,
          }}
        >
          Smart Khmer
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: "14px", md: "16px" },
            fontWeight: 700,
            color: KslColors.textPrimary,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          Sign Language Learning
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function MainHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale } = useLocaleStore();
  const clearAuth = useAuthStore((state) => state.clear);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [mounted, setMounted] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const modesRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!modesOpen && !langOpen) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (modesRef.current?.contains(target) || langRef.current?.contains(target)) return;
      setModesOpen(false);
      setLangOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [modesOpen, langOpen]);

  const openModes = () => {
    setLangOpen(false);
    setModesOpen(true);
  };

  const toggleModes = () => {
    setLangOpen(false);
    setModesOpen((prev) => !prev);
  };

  const openLang = () => {
    setModesOpen(false);
    setLangOpen(true);
  };

  const toggleLang = () => {
    setModesOpen(false);
    setLangOpen((prev) => !prev);
  };

  const displayName = user
    ? `${user?.first_name}${user?.last_name ? ` ${user?.last_name}` : ""}`.trim()
    : t("navGuest");

  const initials = user
    ? `${user?.first_name?.[0]}${user?.last_name ? user?.last_name[0] : ""}`.toUpperCase()
    : "G";

  const isHomeActive = pathname === `/${locale}` || pathname === `/${locale}/home`;
  const isDictionaryActive = pathname.includes(ROUTES.dictionary);
  const isModesActive =
    pathname.includes(ROUTES.fingerSpelling.root) ||
    pathname.includes(ROUTES.words.root);

  const routeLocaleSegment = pathname.split("/")[1];
  const flagLocale: Locale = isValidLocale(routeLocaleSegment)
    ? routeLocaleSegment
    : locale;

  const learningModes = [
    { label: t("navFingerSpelling"), href: ROUTES.fingerSpelling.root },
    { label: t("navWordDetection"), href: ROUTES.words.root },
  ];

  const handleLogout = async () => {
    if (!user?.is_guest) {
      try {
        await logout();
      } catch {
        // Local logout should still complete when the network is unavailable.
      }
    }
    clearAuth();
    window.location.href = `/${locale}/login`;
  };

  const requestLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    void handleLogout();
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    persistLocaleCookie(newLocale);
    setLangOpen(false);
    const segments = pathname.split("/");
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/") || `/${newLocale}`);
  };

  const navigateToMode = (href: string) => {
    setModesOpen(false);
    router.push(`/${locale}${href}`);
  };

  const isHeaderReady = mounted && hasHydrated;

  if (!isHeaderReady) {
    return <MainHeaderSkeleton />;
  }

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backdropFilter: "blur(6px)",
        ...headerFadeInSx,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: MAIN_HEADER_HEIGHT,
          height: MAIN_HEADER_HEIGHT,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
          <Grid container sx={{ width: "100%", alignItems: "center" }}>

            {/* ── Left · size=4 · brand ── */}
            <Grid size={4}>
              <BrandLogo locale={locale} />
            </Grid>

            {/* ── Right · size=8 · desktop nav (md+) ── */}
            <Grid
              size={8}
              sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", alignItems: "center" }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>

                {/* Home */}
                <Stack component={Link} href={`/${locale}`} sx={navItemSx(isHomeActive)}>
                  {t("navHome")}
                </Stack>

                {/* Modes — click + hover dropdown */}
                <Stack
                  ref={modesRef}
                  sx={{ position: "relative" }}
                  onMouseEnter={openModes}
                  onMouseLeave={() => setModesOpen(false)}
                >
                  <Stack
                    component="button"
                    type="button"
                    direction="row"
                    aria-expanded={modesOpen}
                    aria-haspopup="true"
                    onClick={toggleModes}
                    sx={{
                      ...navItemSx(isModesActive || modesOpen),
                      gap: 0.5,
                      fontFamily: "inherit",
                      alignItems: "center",
                    }}
                  >
                    {t("navLearningMode")}
                    <Iconify
                      icon="eva:chevron-down-fill"
                      sx={{
                        width: 16,
                        height: 16,
                        transition: "transform 0.2s",
                        transform: modesOpen ? "rotate(180deg)" : "none",
                      }}
                    />
                  </Stack>

                  {modesOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        pt: "6px",
                        minWidth: 200,
                        width: "max-content",
                        zIndex: 1300,
                      }}
                    >
                      <Box sx={{ ...dropdownPaperSx, py: 0.75 }}>
                        {learningModes.map((mode) => {
                          const isActive = pathname.includes(mode.href);
                          return (
                            <Box
                              key={mode.href}
                              component="button"
                              type="button"
                              onClick={() => navigateToMode(mode.href)}
                              sx={dropdownItemSx(isActive)}
                            >
                              {mode.label}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Stack>

                {/* Dictionary */}
                <Stack
                  component={Link}
                  href={`/${locale}${ROUTES.dictionary}`}
                  sx={navItemSx(isDictionaryActive)}
                >
                  {t("navDictionary")}
                </Stack>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: "auto", height: 20 , display: { xl:"none", md:"none" }}} />

                {/* Language — click + hover dropdown */}
                <Stack
                  ref={langRef}
                  sx={{ position: "relative" }}
                  onMouseEnter={openLang}
                  onMouseLeave={() => setLangOpen(false)}
                >
                  <Stack
                    component="button"
                    type="button"
                    aria-label={t("language")}
                    aria-expanded={langOpen}
                    aria-haspopup="true"
                    onClick={toggleLang}
                    sx={{
                      ...navItemSx(langOpen),
                      fontFamily: "inherit",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 0.75,
                      minWidth: 32,
                      minHeight: 32,
                    }}
                  >
                    <LocaleFlag locale={flagLocale} size={20} />
                  </Stack>

                  {langOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        pt: "6px",
                        minWidth: 148,
                        width: "max-content",
                        zIndex: 1300,
                      }}
                    >
                      <Box sx={{ ...dropdownPaperSx, py: 0.75 }}>
                        {SUPPORTED_LOCALES.map((loc) => (
                          <Box
                            key={loc}
                            component="button"
                            type="button"
                            onClick={() => handleLocaleChange(loc)}
                            sx={dropdownItemRowSx(loc === locale)}
                          >
                            <LocaleFlag locale={loc} size={18} />
                            {LOCALE_FULL_NAMES[loc]}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>

    <Divider orientation="vertical" flexItem sx={{ mx: 1, my: "auto", height: 20, display: { xl:"none" ,md:"none" }}} />                {/* User profile card or Login button */}
                <Box sx={{ ml: 1.5 }}>
                  {isAuthenticated && user ? (
                    <ProfileLogoutBlock
                      displayName={displayName}
                      initials={initials}
                      picture={user?.picture}
                      pictureIcon={<Iconify icon="eva:person-fill" />}
                      logoutLabel={t("navLogout")}
                      onLogoutClick={requestLogout}
                    />
                  ) : (
                    <Button
                      component={Link}
                      href={`/${locale}/login`}
                      sx={{
                        color: KslColors.textPrimary,
                        fontSize: KslFontSizes.sm,
                        fontWeight: 600,
                        textTransform: "none",
                        px: 2,
                        py: 0.75,
                        borderRadius: "8px",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                      }}
                    >
                      {t("login")}
                    </Button>
                  )}
                </Box>

              </Stack>
            </Grid>

            {/* ── Right · mobile burger (xs only) ── */}
            <Grid
              size={8}
              sx={{ display: { xs: "flex", md: "none" }, justifyContent: "flex-end", alignItems: "center" }}
            >
              <IconButton
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: KslColors.textPrimary }}
              >
                <Iconify icon="eva:menu-2-fill" sx={{ width: 22, height: 22 }} />
              </IconButton>
            </Grid>

          </Grid>
        </Container>
      </Toolbar>

      {/* ── Mobile drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280, display: "flex", flexDirection: "column", bgcolor: "background.paper" } } }}
      >
        {/* Header */}
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2.5 }}
        >
          <Stack spacing={0.25}>
            <Typography
              sx={{
                fontSize: KslFontSizes.xs,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: KslColors.primary,
                lineHeight: 1,
              }}
            >
              Smart Khmer
            </Typography>
            <Typography
              sx={{
                fontSize: KslFontSizes.sm,
                fontWeight: 700,
                color: KslColors.textPrimary,
                lineHeight: 1.2,
              }}
            >
              Sign Language Learning
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            sx={{ color: KslColors.textPrimary, borderRadius: "8px" }}
          >
            <Iconify icon="eva:close-fill" sx={{ width: 20, height: 20 }} />
          </IconButton>
        </Stack>

        <Divider />

        {/* Nav links */}
        <List disablePadding sx={{ px: 1.5, py: 1 }}>
          {[
            { label: t("navHome"), href: `/${locale}`, active: isHomeActive, onClick: () => setDrawerOpen(false), isLink: true },
          ].map(({ label, href, active, onClick, isLink }) => (
            <ListItemButton
              key={href}
              component={isLink ? Link : "div"}
              href={href}
              selected={active}
              onClick={onClick}
              sx={{
                borderRadius: "8px",
                mb: 0.25,
                px: 1.5,
                py: 1,
                "&.Mui-selected": {
                  bgcolor: KslColors.primaryLighter,
                  "&:hover": { bgcolor: KslColors.primaryLighter },
                },
              }}
            >
              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: active ? 600 : 500,
                      fontSize: KslFontSizes.sm,
                      color: active ? KslColors.primary : KslColors.textPrimary,
                    },
                  },
                }}
              />
            </ListItemButton>
          ))}

          {learningModes.map((mode) => {
            const active = pathname.includes(mode.href);
            return (
              <ListItemButton
                key={mode.href}
                selected={active}
                onClick={() => { navigateToMode(mode.href); setDrawerOpen(false); }}
                sx={{
                  borderRadius: "8px",
                  mb: 0.25,
                  px: 1.5,
                  py: 1,
                  "&.Mui-selected": {
                    bgcolor: KslColors.primaryLighter,
                    "&:hover": { bgcolor: KslColors.primaryLighter },
                  },
                }}
              >
                <ListItemText
                  primary={mode.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: active ? 600 : 500,
                        fontSize: KslFontSizes.sm,
                        color: active ? KslColors.primary : KslColors.textPrimary,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}

          <ListItemButton
            component={Link}
            href={`/${locale}${ROUTES.dictionary}`}
            selected={isDictionaryActive}
            onClick={() => setDrawerOpen(false)}
            sx={{
              borderRadius: "8px",
              mb: 0.25,
              px: 1.5,
              py: 1,
              "&.Mui-selected": {
                bgcolor: KslColors.primaryLighter,
                "&:hover": { bgcolor: KslColors.primaryLighter },
              },
            }}
          >
            <ListItemText
              primary={t("navDictionary")}
              slotProps={{
                primary: {
                  sx: {
                    fontWeight: isDictionaryActive ? 600 : 500,
                    fontSize: KslFontSizes.sm,
                    color: isDictionaryActive ? KslColors.primary : KslColors.textPrimary,
                  },
                },
              }}
            />
          </ListItemButton>
        </List>

        <Divider sx={{ mx: 2 }} />

        {/* Language selector */}
        <Stack sx={{ px: 2.5, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: KslFontSizes.xs,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: KslColors.textSecondary,
              mb: 1,
            }}
          >
            {t("language")}
          </Typography>
          <Stack direction="row" spacing={1}>
            {SUPPORTED_LOCALES.map((loc) => (
              <Stack
                key={loc}
                component="button"
                type="button"
                direction="row"
                spacing={0.75}
                onClick={() => { handleLocaleChange(loc); setDrawerOpen(false); }}
                sx={{
                  alignItems: "center",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: loc === locale ? KslColors.primary : KslColors.border,
                  bgcolor: loc === locale ? KslColors.primaryLight : "transparent",
                  color: loc === locale ? KslColors.primary : KslColors.textPrimary,
                  fontWeight: loc === locale ? 600 : 500,
                  fontSize: KslFontSizes.xs,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <LocaleFlag locale={loc} size={16} />
                <Typography sx={{ fontSize: KslFontSizes.xs, fontWeight: "inherit", color: "inherit" }}>
                  {LOCALE_FULL_NAMES[loc]}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ mx: 2 }} />

        {/* User profile */}
        <Stack sx={{ px: 2.5, py: 2 }}>
          <ProfileLogoutBlock
            displayName={displayName}
            initials={initials}
            picture={user?.picture}
            logoutLabel={t("navLogout")}
            onLogoutClick={() => {
              setDrawerOpen(false);
              requestLogout();
            }}
            avatarSize={40}
            nameFontSize={14}
          />
        </Stack>
      </Drawer>

      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              mx: 2,
            },
          },
        }}
      >
        <DialogTitle id="logout-confirm-title" sx={{ pb: 1, fontWeight: 700 }}>
          {t("logoutConfirmTitle")}
        </DialogTitle>
        <DialogContent id="logout-confirm-description">
          <Typography sx={{ fontSize: KslFontSizes.sm, color: "text.secondary" }}>
            {t("logoutConfirmMessage")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setLogoutConfirmOpen(false)}
            sx={{ borderRadius: "8px", minWidth: 88 }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmLogout}
            sx={{ borderRadius: "8px", minWidth: 88 }}
          >
            {t("navLogout")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

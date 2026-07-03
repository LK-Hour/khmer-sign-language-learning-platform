"use client";

import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import Layers from "@mui/icons-material/Layers";
import Logout from "@mui/icons-material/Logout";
import MenuBook from "@mui/icons-material/MenuBook";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translations";
import { useAuthStore } from "@/store/auth.store";

import { AdminColors, AdminFontSizes } from "./adminTokens";

type NavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "ADMIN.CURRICULUM",
    href: ROUTES.admin.curriculum,
    icon: <Layers sx={{ fontSize: 18 }} />,
  },
  {
    labelKey: "ADMIN.EXERCISES",
    href: ROUTES.admin.exercises,
    icon: <MenuBook sx={{ fontSize: 18 }} />,
  },
  {
    labelKey: "ADMIN.QUIZ_MANAGEMENT",
    href: ROUTES.admin.quiz,
    icon: <FormatListNumbered sx={{ fontSize: 18 }} />,
  },
];

type AdminShellProps = {
  children: ReactNode;
};

/** Two-pane admin dashboard shell: fixed dark sidebar + scrollable content panel. */
export default function AdminShell({ children }: AdminShellProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const displayName = user
    ? `${user?.first_name ?? ""}${user?.last_name ? ` ${user.last_name}` : ""}`.trim() ||
      user?.email ||
      "Admin"
    : "Admin";

  return (
    <Stack direction="row" sx={{ minHeight: "100dvh", bgcolor: AdminColors.page }}>
      <Stack
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          width: 256,
          flexShrink: 0,
          bgcolor: AdminColors.sidebar,
          color: AdminColors.sidebarText,
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        {/* Brand */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            p: 2,
            borderBottom: `1px solid ${AdminColors.sidebarBorder}`,
            bgcolor: AdminColors.sidebarStrong,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              bgcolor: AdminColors.primary,
              color: "common.white",
              fontWeight: 700,
            }}
          >
            K
          </Box>
          <Stack>
            <Typography
              sx={{
                fontSize: AdminFontSizes.body,
                fontWeight: 700,
                color: "common.white",
                lineHeight: 1,
              }}
            >
              KSL Admin
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: AdminFontSizes.eyebrow,
                textTransform: "uppercase",
                color: AdminColors.muted,
              }}
            >
              {t("ADMIN.MANAGEMENT")}
            </Typography>
          </Stack>
        </Stack>

        {/* Navigation */}
        <Stack component="nav" spacing={1} sx={{ flex: 1, p: 2 }}>
          <Typography
            sx={{
              px: 1,
              mb: 1,
              fontSize: AdminFontSizes.eyebrow,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: AdminColors.muted,
            }}
          >
            {t("ADMIN.NAVIGATION")}
          </Typography>
          {NAV_ITEMS.map((item) => {
            const href = `/${locale}${item.href}`;
            const active = pathname.startsWith(href);
            return (
              <Button
                key={item.href}
                component={Link}
                href={href}
                startIcon={item.icon}
                sx={
                  active
                    ? {
                        justifyContent: "flex-start",
                        color: AdminColors.primaryText,
                        bgcolor: AdminColors.primaryTint,
                        border: `1px solid ${AdminColors.primaryTintBorder}`,
                        "&:hover": { bgcolor: AdminColors.primaryTintHover },
                      }
                    : {
                        justifyContent: "flex-start",
                        color: AdminColors.sidebarMuted,
                        "&:hover": {
                          bgcolor: AdminColors.sidebarBorder,
                          color: "common.white",
                        },
                      }
                }
              >
                {t(item.labelKey)}
              </Button>
            );
          })}
        </Stack>

        {/* Footer: signed-in admin + back to site */}
        <Stack
          spacing={1.5}
          sx={{ p: 2, borderTop: `1px solid ${AdminColors.sidebarBorder}` }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Avatar
              src={user?.picture ?? ""}
              alt={displayName}
              sx={{ width: 32, height: 32, fontSize: AdminFontSizes.small }}
            >
              {displayName[0]?.toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontSize: AdminFontSizes.small,
                  fontWeight: 700,
                  color: "common.white",
                }}
              >
                {displayName}
              </Typography>
              <Typography
                sx={{
                  fontSize: AdminFontSizes.eyebrow,
                  textTransform: "uppercase",
                  color: AdminColors.sidebarMuted,
                }}
              >
                {t("ADMIN.ROLE_ADMIN")}
              </Typography>
            </Stack>
          </Stack>
          <Button
            component={Link}
            href={`/${locale}`}
            startIcon={<Logout sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              justifyContent: "flex-start",
              color: AdminColors.sidebarMuted,
              "&:hover": { bgcolor: AdminColors.sidebarBorder, color: "common.white" },
            }}
          >
            {t("ADMIN.BACK_TO_SITE")}
          </Button>
        </Stack>
      </Stack>

      {/* Content panel */}
      <Stack component="main" sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Stack>
    </Stack>
  );
}

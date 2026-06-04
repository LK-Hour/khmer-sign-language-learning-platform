"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { kslColors, kslFontSizes, kslShadows } from "@/theme/theme";

export type AppHeaderVariant = "curriculum" | "lesson" | "exercise";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  variant?: AppHeaderVariant;
  logoSrc?: string;
  logoAlt?: string;
};

export default function AppHeader({
  title,
  subtitle,
  variant = "curriculum",
  logoSrc = "/finger-spelling/ksl-logo.svg",
  logoAlt = "KSL IDRI",
}: AppHeaderProps) {
  const isLesson = variant === "lesson";

  const titleBlock = (
    <Box
      sx={{
        minWidth: 0,
        textAlign: { xs: "left", md: "center" },
        flex: { md: 1 },
        display: isLesson ? { xs: "none", sm: "block" } : "block",
      }}
    >
      <Typography
        component="h1"
        variant="h5"
        sx={{
          fontFamily: "var(--font-inter), sans-serif",
          fontWeight: 700,
          fontSize: { xs: kslFontSizes.md, md: kslFontSizes.lg },
          color: kslColors.secondary,
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "var(--font-inter), sans-serif",
            fontWeight: 400,
            fontSize: kslFontSizes.sm,
            color: kslColors.textSecondary,
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "background.paper",
        borderBottomLeftRadius: { xs: 20, md: 40 },
        borderBottomRightRadius: { xs: 20, md: 40 },
        boxShadow: kslShadows.header,
        px: { xs: 2, md: 4 },
        py: { xs: 1.5, md: 2 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      {/* Top row: logo + language switcher */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          minWidth: { md: 254 },
          flexShrink: 0,
        }}
      >
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={254}
          height={95}
          style={{
            width: "auto",
            height: "clamp(36px, 7vw, 64px)",
            objectFit: "contain",
          }}
          priority
        />
        {/* Switcher shown here on mobile only */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <LocaleSwitcher />
        </Box>
      </Box>

      {titleBlock}

      {/* Switcher shown here on desktop only */}
      <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
        <LocaleSwitcher />
      </Box>
    </Box>
  );
}

"use client";

import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SportsKabaddiOutlinedIcon from "@mui/icons-material/SportsKabaddiOutlined";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  { label: "Home", href: ROUTES.fingerSpelling.root, icon: HomeOutlinedIcon },
  {
    label: "Learn",
    href: ROUTES.fingerSpelling.root,
    icon: AutoStoriesOutlinedIcon,
    match: "/finger-spelling/units",
  },
  {
    label: "Practice",
    href: ROUTES.fingerSpelling.practice,
    icon: SportsKabaddiOutlinedIcon,
  },
  {
    label: "Dictionary",
    href: ROUTES.fingerSpelling.dictionary,
    icon: MenuBookOutlinedIcon,
  },
  {
    label: "Profile",
    href: ROUTES.fingerSpelling.profile,
    icon: PersonOutlineIcon,
  },
] as const;

function resolveValue(pathname: string): string {
  if (pathname.startsWith(ROUTES.fingerSpelling.practice)) {
    return ROUTES.fingerSpelling.practice;
  }
  if (pathname.startsWith(ROUTES.fingerSpelling.dictionary)) {
    return ROUTES.fingerSpelling.dictionary;
  }
  if (pathname.startsWith(ROUTES.fingerSpelling.profile)) {
    return ROUTES.fingerSpelling.profile;
  }
  if (
    pathname.startsWith("/finger-spelling/units") ||
    pathname.startsWith("/finger-spelling/chapters") ||
    pathname.startsWith("/finger-spelling/lessons")
  ) {
    return ROUTES.fingerSpelling.root;
  }
  return ROUTES.fingerSpelling.root;
}

export default function FsBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const value = resolveValue(pathname);

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        borderTop: 1,
        borderColor: "divider",
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, href: string) => router.push(href)}
        showLabels
        sx={{ height: 64 }}
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <BottomNavigationAction
            key={label}
            label={label}
            value={href}
            icon={<Icon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

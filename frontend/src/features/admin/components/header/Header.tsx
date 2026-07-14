"use client";

import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import { useAdminThemeStore } from "../../store/adminTheme.store";
import SearchTrigger from "./SearchTrigger";
import NotificationBell from "./NotificationBell";
import UserAvatarMenu from "./UserAvatarMenu";
import LocaleSwitcherButton from "./LocaleSwitcherButton";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export default function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const mode = useAdminThemeStore((state) => state.mode);
  const toggleMode = useAdminThemeStore((state) => state.toggleMode);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(20, 26, 33, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(6px)",
        borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, lg: 3 } }}>
        {showMenuButton && (
          <IconButton onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Spacer */}
        <Stack sx={{ flex: 1 }} />

        {/* Right-side actions */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SearchTrigger />

          <IconButton size="small" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === "light" ? (
              <DarkModeOutlined sx={{ fontSize: 20 }} />
            ) : (
              <LightModeOutlined sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          <NotificationBell count={3} />

          <LocaleSwitcherButton />

          <UserAvatarMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

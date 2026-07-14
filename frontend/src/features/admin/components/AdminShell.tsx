"use client";

import { Box, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import Header from "./header/Header";

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg")); // 1200px
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      {/* Desktop: persistent sidebar */}
      {isDesktop ? (
        <Sidebar
          width={sidebarWidth}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
        >
          <Sidebar
            width={SIDEBAR_WIDTH}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ml: isDesktop ? `${sidebarWidth}px` : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} showMenuButton={!isDesktop} />
        <Box component="main" sx={{ flex: 1, px: 3, py: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

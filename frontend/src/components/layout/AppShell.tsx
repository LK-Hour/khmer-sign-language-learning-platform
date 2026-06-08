import { Container, Stack } from "@mui/material";
import AppHeader, { type AppHeaderVariant } from "./AppHeader";
import BottomNav, { type BottomNavItem } from "./BottomNav";
import ContextBar from "./ContextBar";

export type { AppHeaderVariant } from "./AppHeader";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerVariant?: AppHeaderVariant;
  contextBadge?: string;
  contextTitle?: string;
  contextSubtitle?: string;
  hideBottomNav?: boolean;
  fullWidth?: boolean;
  navItems?: BottomNavItem[];
  resolveActiveNav?: (pathname: string) => string;
  logoSrc?: string;
  logoAlt?: string;
  mascotSrc?: string;
};

export default function AppShell({
  children,
  title,
  subtitle,
  headerVariant = "curriculum",
  contextBadge,
  contextTitle,
  contextSubtitle,
  hideBottomNav = false,
  fullWidth = false,
  navItems = [],
  resolveActiveNav = () => navItems[0]?.href ?? "",
  logoSrc,
  logoAlt,
  mascotSrc,
}: AppShellProps) {
  const showContext = contextBadge && contextTitle;

  return (
    <Stack
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      <AppHeader
        title={title}
        subtitle={subtitle}
        variant={headerVariant}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
      />

      <Container
        component="main"
        maxWidth={fullWidth ? false : "lg"}
        sx={{
          flex: 1,
          width: "100%",
          px: { xs: 2, md: 4 },
          pt: { xs: 2, md: 3 },
          pb: hideBottomNav ? 4 : { xs: 10, md: 16 },
        }}
      >
        {showContext && (
          <ContextBar
            badgeLabel={contextBadge}
            title={contextTitle}
            subtitle={contextSubtitle}
            mascotSrc={mascotSrc}
          />
        )}
        {children}
      </Container>

      {!hideBottomNav && navItems.length > 0 && (
        <BottomNav items={navItems} resolveActive={resolveActiveNav} />
      )}
    </Stack>
  );
}

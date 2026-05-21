import Box from "@mui/material/Box";
import FsBottomNav from "./FsBottomNav";
import FsTopBar from "./FsTopBar";

type FsMobileShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  hideBottomNav?: boolean;
};

export default function FsMobileShell({
  children,
  title,
  subtitle,
  showBack,
  backHref,
  hideBottomNav = false,
}: FsMobileShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        mx: "auto",
        maxWidth: 430,
        display: "flex",
        flexDirection: "column",
        boxShadow: { md: "0 0 24px rgba(0,0,0,0.06)" },
      }}
    >
      <FsTopBar
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        backHref={backHref}
      />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: 2,
          pt: 2,
          pb: hideBottomNav ? 3 : 10,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
      {!hideBottomNav && <FsBottomNav />}
    </Box>
  );
}

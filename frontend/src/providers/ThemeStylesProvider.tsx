"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import KslTheme, { KslColors } from "@/theme/theme";

type ThemeStylesProviderProps = {
  children: React.ReactNode;
};

export default function ThemeStylesProvider({
  children,
}: ThemeStylesProviderProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={KslTheme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            ":root": {
              colorScheme: "light",
              backgroundColor: KslColors.background,
            },
            "html, body": {
              minHeight: "100%",
              backgroundColor: KslColors.background,
            },
            body: {
              overflowX: "hidden",
              textRendering: "optimizeLegibility",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            },
            "*, *::before, *::after": {
              boxSizing: "border-box",
            },
            a: {
              color: "inherit",
              textDecoration: "none",
            },
            img: {
              maxWidth: "100%",
            },
          }}
        />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

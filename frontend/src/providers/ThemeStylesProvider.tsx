"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import KslTheme from "@/theme/theme";

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
          styles={(theme) => ({
            ":root": {
              colorScheme: "light",
              backgroundColor: theme.palette.background.default,
            },
            "html, body": {
              minHeight: "100%",
              backgroundColor: theme.palette.background.default,
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
          })}
        />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

import { createTheme } from "@mui/material/styles";

/** KSL design tokens — aligned with Figma KSL-Project Dev */
export const kslColors = {
  primary: "#F77C08",
  primaryLight: "#FAAB61",
  primaryDark: "#E65100",
  primaryTrack: "rgba(250, 171, 97, 0.5)",
  secondary: "#12284C",
  surface: "#FFFFFF",
  background: "#F5F5F5",
  textPrimary: "#12284C",
  textSecondary: "#616161",
  border: "#E0E0E0",
  success: "#2E7D32",
  error: "#C62828",
  locked: "#9E9E9E",
} as const;

export const kslShadows = {
  button: "4px 4px 20px rgba(0, 0, 0, 0.24)",
  drop: "0 8px 48px rgba(145, 158, 171, 0.5)",
  header: "0 8px 24px rgba(145, 158, 171, 0.5)",
  text: "2px 2px 4px rgba(0, 0, 0, 0.25)",
  card: "4px 4px 10px rgba(0, 0, 0, 0.24)",
} as const;

export const kslRadii = {
  card: 16,
  signImage: 36,
  wordCard: 8,
  headerBottom: 40,
  progress: 50,
  button: 16,
} as const;

/** Core text scale — use sm / md / lg only for body UI copy */
export const kslFontSizes = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export const kslLineHeights = {
  sm: "20px",
  md: "24px",
  lg: "30px",
} as const;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: kslColors.primary,
      light: kslColors.primaryLight,
      dark: kslColors.primaryDark,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: kslColors.secondary,
      contrastText: "#FFFFFF",
    },
    background: {
      default: kslColors.background,
      paper: kslColors.surface,
    },
    text: {
      primary: kslColors.textPrimary,
      secondary: kslColors.textSecondary,
    },
    success: { main: kslColors.success },
    error: { main: kslColors.error },
  },
  shape: {
    borderRadius: kslRadii.card,
  },
  typography: {
    fontFamily:
      'var(--font-public-sans), var(--font-inter), "Geist", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: kslFontSizes.md,
    h3: {
      fontFamily: "var(--font-public-sans), sans-serif",
      fontWeight: 700,
      fontSize: kslFontSizes.lg,
      lineHeight: kslLineHeights.lg,
      color: kslColors.secondary,
    },
    h5: {
      fontFamily: "var(--font-public-sans), sans-serif",
      fontWeight: 700,
      fontSize: kslFontSizes.lg,
      lineHeight: kslLineHeights.lg,
      color: kslColors.secondary,
    },
    h4: {
      fontWeight: 700,
      fontSize: kslFontSizes.lg,
      lineHeight: kslLineHeights.lg,
      color: kslColors.secondary,
    },
    h6: {
      fontWeight: 600,
      fontSize: kslFontSizes.lg,
      lineHeight: kslLineHeights.lg,
      color: kslColors.secondary,
    },
    subtitle1: {
      fontSize: kslFontSizes.md,
      lineHeight: kslLineHeights.md,
      color: kslColors.secondary,
    },
    subtitle2: {
      fontSize: kslFontSizes.sm,
      lineHeight: kslLineHeights.sm,
      color: kslColors.textSecondary,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontSize: kslFontSizes.md,
      lineHeight: kslLineHeights.md,
      fontFamily: "var(--font-public-sans), sans-serif",
    },
    body1: {
      fontSize: kslFontSizes.md,
      lineHeight: kslLineHeights.md,
      color: kslColors.secondary,
    },
    body2: {
      fontSize: kslFontSizes.sm,
      lineHeight: kslLineHeights.sm,
      color: kslColors.textSecondary,
    },
    caption: {
      fontSize: kslFontSizes.sm,
      lineHeight: kslLineHeights.sm,
      color: kslColors.textSecondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: kslRadii.button,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: kslRadii.card,
          boxShadow: kslShadows.card,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 12,
          borderRadius: kslRadii.progress,
          backgroundColor: kslColors.primaryTrack,
        },
        bar: {
          borderRadius: kslRadii.progress,
          backgroundColor: kslColors.primary,
        },
      },
    },
  },
});

export default theme;

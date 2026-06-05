import { createTheme } from "@mui/material/styles";

/** KSL design tokens — aligned with Figma KSL-Project Dev */
export const KslPalette = {
  primary: {
    main: "#1f9f6f",
    dark: "#147b55",
    light: "#dff7ed",
    lighter: "#f2fbf7",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#137FEC",
    dark: "#0f66bd",
    light: "#e7f2ff",
    lighter: "#f3f9ff",
    contrastText: "#ffffff",
  },
  status: {
    success: "#1f9f6f",
    fail: "#FF4438",
    error: "#FF4438",
    alert: "#f3b83f",
    warning: "#f3b83f",
    inProgress: "#137FEC",
  },
  neutral: {
    text: "#11284C",
    muted: "#65746e",
    disabled: "#65746e",
    card: "#ffffff",
    background: "#f6faf8",
    border: "#d8e3df",
  },
} as const;

export const KslColors = {
  primary: KslPalette.primary.main,
  primaryLight: KslPalette.primary.light,
  primaryLighter: KslPalette.primary.lighter,
  primaryDark: KslPalette.primary.dark,
  primaryTrack: KslPalette.primary.light,
  secondary: KslPalette.secondary.main,
  secondaryLight: KslPalette.secondary.light,
  secondaryLighter: KslPalette.secondary.lighter,
  secondaryDark: KslPalette.secondary.dark,
  surface: KslPalette.neutral.card,
  card: KslPalette.neutral.card,
  background: KslPalette.neutral.background,
  text: KslPalette.neutral.text,
  typography: KslPalette.neutral.text,
  textPrimary: KslPalette.neutral.text,
  textSecondary: KslPalette.neutral.muted,
  muted: KslPalette.neutral.muted,
  disabled: KslPalette.neutral.disabled,
  border: KslPalette.neutral.border,
  success: KslPalette.status.success,
  fail: KslPalette.status.fail,
  error: KslPalette.status.error,
  alert: KslPalette.status.alert,
  warning: KslPalette.status.warning,
  inProgress: KslPalette.status.inProgress,
  locked: KslPalette.neutral.disabled,
} as const;

export const KslShadows = {
  button: "4px 4px 20px rgba(0, 0, 0, 0.24)",
  drop: "0 8px 48px rgba(145, 158, 171, 0.5)",
  header: "0 8px 24px rgba(145, 158, 171, 0.5)",
  text: "2px 2px 4px rgba(0, 0, 0, 0.25)",
  card: "4px 4px 10px rgba(0, 0, 0, 0.24)",
} as const;

export const KslRadii = {
  card: 16,
  signImage: 36,
  wordCard: 8,
  headerBottom: 40,
  progress: 50,
  button: 16,
} as const;

/** Core text scale — use sm / md / lg only for body UI copy */
export const KslFontSizes = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export const KslLineHeights = {
  sm: "20px",
  md: "24px",
  lg: "30px",
} as const;

const KslTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: KslPalette.primary.main,
      light: KslPalette.primary.light,
      dark: KslPalette.primary.dark,
      contrastText: KslPalette.primary.contrastText,
    },
    secondary: {
      main: KslPalette.secondary.main,
      light: KslPalette.secondary.light,
      dark: KslPalette.secondary.dark,
      contrastText: KslPalette.secondary.contrastText,
    },
    background: {
      default: KslPalette.neutral.background,
      paper: KslPalette.neutral.card,
    },
    text: {
      primary: KslPalette.neutral.text,
      secondary: KslPalette.neutral.muted,
    },
    success: { main: KslPalette.status.success },
    warning: { main: KslPalette.status.warning },
    error: { main: KslPalette.status.error },
  },
  shape: {
    borderRadius: KslRadii.card,
  },
  typography: {
    fontFamily:
      'var(--font-english), var(--font-khmer), "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: KslFontSizes.md,
    h3: {
      fontFamily: "var(--font-english), var(--font-khmer), sans-serif",
      fontWeight: 700,
      fontSize: KslFontSizes.lg,
      lineHeight: KslLineHeights.lg,
      color: KslColors.textPrimary,
    },
    h5: {
      fontFamily: "var(--font-english), var(--font-khmer), sans-serif",
      fontWeight: 700,
      fontSize: KslFontSizes.lg,
      lineHeight: KslLineHeights.lg,
      color: KslColors.textPrimary,
    },
    h4: {
      fontWeight: 700,
      fontSize: KslFontSizes.lg,
      lineHeight: KslLineHeights.lg,
      color: KslColors.textPrimary,
    },
    h6: {
      fontWeight: 600,
      fontSize: KslFontSizes.lg,
      lineHeight: KslLineHeights.lg,
      color: KslColors.textPrimary,
    },
    subtitle1: {
      fontSize: KslFontSizes.md,
      lineHeight: KslLineHeights.md,
      color: KslColors.textPrimary,
    },
    subtitle2: {
      fontSize: KslFontSizes.sm,
      lineHeight: KslLineHeights.sm,
      color: KslColors.textSecondary,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontSize: KslFontSizes.md,
      lineHeight: KslLineHeights.md,
      fontFamily: "var(--font-english), var(--font-khmer), sans-serif",
    },
    body1: {
      fontSize: KslFontSizes.md,
      lineHeight: KslLineHeights.md,
      color: KslColors.textPrimary,
    },
    body2: {
      fontSize: KslFontSizes.sm,
      lineHeight: KslLineHeights.sm,
      color: KslColors.textSecondary,
    },
    caption: {
      fontSize: KslFontSizes.sm,
      lineHeight: KslLineHeights.sm,
      color: KslColors.textSecondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: KslRadii.button,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: KslRadii.card,
          boxShadow: KslShadows.card,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 12,
          borderRadius: KslRadii.progress,
          backgroundColor: KslColors.primaryTrack,
        },
        bar: {
          borderRadius: KslRadii.progress,
          backgroundColor: KslColors.primary,
        },
      },
    },
  },
});

export default KslTheme;

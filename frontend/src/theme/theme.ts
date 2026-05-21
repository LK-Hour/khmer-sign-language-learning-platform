import { createTheme } from "@mui/material/styles";

/** KSL design tokens — primary orange from product spec */
export const kslColors = {
  primary: "#F57C00",
  primaryLight: "#FFB74D",
  primaryDark: "#E65100",
  surface: "#FFFFFF",
  background: "#F5F5F5",
  textPrimary: "#1A1A1A",
  textSecondary: "#616161",
  border: "#E0E0E0",
  success: "#2E7D32",
  error: "#C62828",
  locked: "#9E9E9E",
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
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Geist", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export default theme;

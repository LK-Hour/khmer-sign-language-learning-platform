// Admin palette tokens following the Minimals UI Kit design language.
// Exports light and dark palette variants used by AdminThemeProvider.

export interface AdminPalette {
  primary: { main: string; light: string; dark: string; contrastText: string };
  warning: { main: string; light: string; dark: string };
  error: { main: string; light: string; dark: string };
  info: { main: string; light: string; dark: string };
  success: { main: string; light: string; dark: string };
  grey: Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  background: { default: string; paper: string; neutral: string };
  text: { primary: string; secondary: string; disabled: string };
}

export const lightPalette: AdminPalette = {
  primary: {
    main: "#0C44AE",
    light: "#3B6FD4",
    dark: "#082F7A",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FFAB00",
    light: "#FFD666",
    dark: "#B76E00",
  },
  error: {
    main: "#B71D18",
    light: "#FFAC82",
    dark: "#7A0916",
  },
  info: {
    main: "#00B8D9",
    light: "#61F3F3",
    dark: "#006C9C",
  },
  success: {
    main: "#22C55E",
    light: "#77ED8B",
    dark: "#118D57",
  },
  grey: {
    100: "#F9FAFB",
    200: "#F4F6F8",
    300: "#DFE3E8",
    400: "#C4CDD5",
    500: "#919EAB",
    600: "#637381",
    700: "#454F5B",
    800: "#1C252E",
    900: "#141A21",
  },
  background: {
    default: "#F8F9FA",
    paper: "#FFFFFF",
    neutral: "#F4F6F8",
  },
  text: {
    primary: "#1C252E",
    secondary: "#637381",
    disabled: "#919EAB",
  },
};

export const darkPalette: AdminPalette = {
  primary: {
    main: "#0C44AE",
    light: "#3B6FD4",
    dark: "#082F7A",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FFAB00",
    light: "#FFD666",
    dark: "#B76E00",
  },
  error: {
    main: "#B71D18",
    light: "#FFAC82",
    dark: "#7A0916",
  },
  info: {
    main: "#00B8D9",
    light: "#61F3F3",
    dark: "#006C9C",
  },
  success: {
    main: "#22C55E",
    light: "#77ED8B",
    dark: "#118D57",
  },
  grey: {
    100: "#F9FAFB",
    200: "#F4F6F8",
    300: "#DFE3E8",
    400: "#C4CDD5",
    500: "#919EAB",
    600: "#637381",
    700: "#454F5B",
    800: "#1C252E",
    900: "#141A21",
  },
  background: {
    default: "#141A21",
    paper: "#1C252E",
    neutral: "#28323D",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255,255,255,0.7)",
    disabled: "rgba(255,255,255,0.48)",
  },
};

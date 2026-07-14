// Admin typography tokens following the Minimals UI Kit design language.
// Exports DM Sans Variable font family config and all typography variants.

import type { TypographyVariantsOptions } from "@mui/material/styles";

export const FONT_PRIMARY =
  "'DM Sans Variable', 'DM Sans', system-ui, sans-serif";

export const typography: TypographyVariantsOptions = {
  fontFamily: FONT_PRIMARY,
  h4: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.5 },
  h5: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.5 },
  h6: { fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.55 },
  subtitle1: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
  subtitle2: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.57 },
  body1: { fontSize: "0.875rem", lineHeight: 1.57 },
  body2: { fontSize: "0.8125rem", lineHeight: 1.57 },
  caption: { fontSize: "0.75rem", lineHeight: 1.5 },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    lineHeight: 1.5,
    textTransform: "uppercase",
  },
};

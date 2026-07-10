/** Shared visual tokens for the admin console (aligned to the reference dashboard). */

export const AdminColors = {
  page: "#f8fafc",
  sidebar: "#0d4a35",
  sidebarStrong: "#083028",
  sidebarBorder: "#1a6b4d",
  sidebarText: "#ffffff",
  sidebarMuted: "#d1fae5",
  muted: "#64748b",
  heading: "#1e293b",
  border: "#e2e8f0",
  softBorder: "#f1f5f9",
  primary: "#1f9f6f",
  primaryText: "#5ee8b0",
  primaryTint: "rgba(31,159,111,0.15)",
  primaryTintBorder: "rgba(31,159,111,0.3)",
  primaryTintHover: "rgba(31,159,111,0.22)",
  publishedBg: "#ecfdf5",
  publishedText: "#059669",
  draftBg: "#fffbeb",
  draftText: "#d97706",
  inactiveBg: "#f1f5f9",
  inactiveText: "#64748b",
  activeBg: "#ecfdf5",
  activeText: "#059669",
} as const;

export const AdminFontSizes = {
  eyebrow: 10,
  caption: 11,
  small: 12,
  body: 14,
} as const;

export const adminTableHeaderSx = {
  fontSize: AdminFontSizes.eyebrow,
  fontWeight: 700,
  textTransform: "uppercase",
  color: AdminColors.muted,
} as const;

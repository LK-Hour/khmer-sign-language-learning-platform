/** Shared visual tokens for the admin console (aligned to the reference dashboard). */

export const AdminColors = {
  page: "#f8fafc",
  sidebar: "#0f172a",
  sidebarStrong: "#020617",
  sidebarBorder: "#1e293b",
  sidebarText: "#cbd5e1",
  sidebarMuted: "#94a3b8",
  muted: "#64748b",
  heading: "#1e293b",
  border: "#e2e8f0",
  softBorder: "#f1f5f9",
  primary: "#2563eb",
  primaryText: "#60a5fa",
  primaryTint: "rgba(37,99,235,0.1)",
  primaryTintBorder: "rgba(37,99,235,0.2)",
  primaryTintHover: "rgba(37,99,235,0.16)",
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

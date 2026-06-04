import Box from "@mui/material/Box";
import type { Locale } from "@/i18n/config";

type LocaleFlagProps = {
  locale: Locale;
  size?: { width: number; height: number };
};

export default function LocaleFlag({
  locale,
  size = { width: 28, height: 18 },
}: LocaleFlagProps) {
  if (locale === "kh") {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          width: size.width,
          height: size.height,
          borderRadius: "3px",
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 28 18"
          width={size.width}
          height={size.height}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="28" height="6" fill="#032EA1" />
          <rect y="6" width="28" height="6" fill="#E00025" />
          <rect y="12" width="28" height="6" fill="#032EA1" />
          <rect x="11" y="4" width="6" height="10" fill="#FFFFFF" />
          <rect x="12.5" y="5.5" width="3" height="7" fill="#E00025" />
        </svg>
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        width: size.width,
        height: size.height,
        borderRadius: "3px",
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid rgba(0, 0, 0, 0.08)",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 28 18"
        width={size.width}
        height={size.height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="28" height="18" fill="#012169" />
        <path d="M0 0 L28 18 M28 0 L0 18" stroke="#FFFFFF" strokeWidth="3.5" />
        <path d="M0 0 L28 18 M28 0 L0 18" stroke="#C8102E" strokeWidth="2" />
        <path d="M14 0 V18 M0 9 H28" stroke="#FFFFFF" strokeWidth="5.5" />
        <path d="M14 0 V18 M0 9 H28" stroke="#C8102E" strokeWidth="3.5" />
      </svg>
    </Box>
  );
}

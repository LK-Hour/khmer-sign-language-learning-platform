import { describe, expect, it } from "vitest";
import { decomposeColor, getContrastRatio } from "@mui/material/styles";

import { createAdminTheme } from "./adminTheme";
import { darkPalette } from "./palette";
import { statusTone, type StatusTone } from "./tones";

// Regression guard for dark-mode legibility in the admin panel (WCAG AA, normal text = 4.5:1).
// getContrastRatio ignores alpha, so translucent colors are flattened onto their backdrop first.

const AA = 4.5;
const theme = createAdminTheme("dark");
const { palette } = theme;

function toRgb(color: string): [number, number, number, number] {
  const { values } = decomposeColor(color);
  return [values[0], values[1], values[2], values[3] ?? 1];
}

/** Flattens `fg` (possibly translucent) over an opaque `bg` and returns an rgb() string. */
function over(fg: string, bg: string): string {
  const [r, g, b, a] = toRgb(fg);
  const [br, bgc, bb] = toRgb(bg);
  const mix = (f: number, back: number) => Math.round(f * a + back * (1 - a));
  return `rgb(${mix(r, br)}, ${mix(g, bgc)}, ${mix(b, bb)})`;
}

function contrast(fg: string, bg: string, backdrop: string = palette.background.paper): number {
  const flatBg = over(bg, backdrop);
  return getContrastRatio(over(fg, flatBg), flatBg);
}

describe("admin dark theme contrast", () => {
  it("inactive FilterTabs label is readable (was grey.200 bg + light text = 1.7:1)", () => {
    expect(contrast(palette.text.secondary, darkPalette.background.neutral)).toBeGreaterThanOrEqual(AA);
    expect(contrast(palette.text.secondary, palette.action.selected)).toBeGreaterThanOrEqual(AA);
  });

  it("active FilterTabs label is readable on primary", () => {
    expect(contrast(palette.primary.contrastText, palette.primary.main)).toBeGreaterThanOrEqual(AA);
    expect(contrast(palette.primary.contrastText, palette.primary.dark)).toBeGreaterThanOrEqual(AA);
  });

  it("primary used as text/icon is readable on every dark surface", () => {
    for (const surface of [palette.background.default, palette.background.paper, darkPalette.background.neutral]) {
      expect(contrast(palette.primary.main, surface)).toBeGreaterThanOrEqual(AA);
    }
  });

  it("body text tokens are readable on every dark surface", () => {
    for (const surface of [palette.background.default, palette.background.paper, darkPalette.background.neutral]) {
      expect(contrast(palette.text.primary, surface)).toBeGreaterThanOrEqual(AA);
      expect(contrast(palette.text.secondary, surface)).toBeGreaterThanOrEqual(AA);
    }
  });

  it("error text is readable on the panel surface", () => {
    expect(contrast(palette.error.main, palette.background.paper)).toBeGreaterThanOrEqual(AA);
  });

  it.each<StatusTone>(["success", "warning", "info", "error", "neutral"])(
    "%s status chip text is readable on its tinted background",
    (tone) => {
      const { bgcolor, color } = statusTone(theme, tone);
      expect(contrast(color, bgcolor)).toBeGreaterThanOrEqual(AA);
    },
  );
});

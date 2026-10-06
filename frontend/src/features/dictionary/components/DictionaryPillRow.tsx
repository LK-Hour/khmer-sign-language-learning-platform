"use client";

import { ButtonBase, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { KslColors, KslFontSizes, KslPalette } from "@/theme/theme";

import { springSnappy } from "./dictionaryMotion";

export type PillItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type DictionaryPillRowProps<T extends string> = {
  items: PillItem<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  ariaLabel: string;
  /** Unique per row so the sliding highlight never jumps between rows. */
  layoutId: string;
  /** "segmented" = the big Characters/Words switch; "chips" = filter rows. */
  variant?: "segmented" | "chips";
  size?: "small" | "medium";
};

/**
 * Pill row with a highlight that slides to the selected item
 * (shared-layout animation), used for the type switch and filter chips.
 */
export default function DictionaryPillRow<T extends string>({
  items,
  selected,
  onSelect,
  ariaLabel,
  layoutId,
  variant = "chips",
  size = "medium",
}: DictionaryPillRowProps<T>) {
  const segmented = variant === "segmented";
  const small = size === "small";
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the selected pill in view when the row overflows (e.g. on phones).
  // Scrolls only the row itself so it never fights a page scroll in progress.
  useEffect(() => {
    const row = rowRef.current;
    const pill = row?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!row || !pill || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({
      left: pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <Stack
      ref={rowRef}
      role="radiogroup"
      aria-label={ariaLabel}
      direction="row"
      sx={{
        gap: segmented ? 0.5 : 1,
        p: segmented ? 0.5 : 0,
        position: "relative",
        width: segmented ? "fit-content" : "100%",
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        borderRadius: "999px",
        bgcolor: segmented ? KslPalette.primary.lighter : "transparent",
        border: segmented ? `1px solid ${KslPalette.primary.light}` : "none",
      }}
    >
      {items.map((item) => {
        const isSelected = item.value === selected;
        return (
          <ButtonBase
            key={item.value}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(item.value)}
            sx={{
              position: "relative",
              flexShrink: 0,
              gap: 0.75,
              px: segmented ? 2.5 : small ? 1.25 : 1.75,
              py: segmented ? 1 : small ? 0.5 : 0.75,
              borderRadius: "999px",
              border: segmented
                ? "none"
                : `1px solid ${isSelected ? KslColors.primary : KslColors.border}`,
              color: isSelected
                ? segmented
                  ? "#fff"
                  : KslColors.primaryDark
                : KslColors.textSecondary,
              transition: "color 0.2s, border-color 0.2s",
              "&:hover": { color: isSelected && segmented ? "#fff" : KslColors.textPrimary },
              "&.Mui-focusVisible": {
                outline: `2px solid ${KslColors.primary}`,
                outlineOffset: 2,
              },
            }}
          >
            {isSelected ? (
              <motion.span
                layoutId={layoutId}
                transition={springSnappy}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: segmented ? KslColors.primary : KslPalette.primary.light,
                }}
              />
            ) : null}
            <Typography
              component="span"
              sx={{
                position: "relative",
                fontSize: segmented
                  ? KslFontSizes.md
                  : small
                    ? KslFontSizes.xs
                    : KslFontSizes.sm,
                fontWeight: 700,
                color: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Typography>
            {item.count != null ? (
              <Typography
                component="span"
                sx={{
                  position: "relative",
                  fontSize: KslFontSizes.xs,
                  fontWeight: 700,
                  color: "inherit",
                  opacity: 0.75,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {item.count}
              </Typography>
            ) : null}
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

import { Stack } from "@mui/material";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";
type DisplayValue = "block" | "flex" | "inline-flex" | "none";

type ResponsiveHiddenProps = {
  children: React.ReactNode;
  /** How children render when visible (default: block) */
  displayWhenVisible?: Exclude<DisplayValue, "none">;
  /** Hidden on sm and below — visible on md, lg, xl */
  smDown?: boolean;
  /** Hidden on md and below — visible on lg, xl only */
  mdDown?: boolean;
  /** Hidden on md and above — visible on xs, sm only */
  mdUp?: boolean;
  /** Hidden on lg and below — visible on xl only */
  lgDown?: boolean;
  /** Hidden on lg and above — visible on xs, sm, md only */
  lgUp?: boolean;
};

/**
 * MUI v9 replacement for deprecated `<Hidden />`.
 *
 * @example
 * <ResponsiveHidden mdDown displayWhenVisible="flex">
 *   Desktop only (lg, xl)
 * </ResponsiveHidden>
 */
export default function ResponsiveHidden({
  children,
  displayWhenVisible = "block",
  smDown,
  mdDown,
  mdUp,
  lgDown,
  lgUp,
}: ResponsiveHiddenProps) {
  const display = resolveDisplay(
    { smDown, mdDown, mdUp, lgDown, lgUp },
    displayWhenVisible
  );

  return <Stack sx={{ display }}>{children}</Stack>;
}

function resolveDisplay(
  flags: Omit<ResponsiveHiddenProps, "children" | "displayWhenVisible">,
  visibleDisplay: Exclude<DisplayValue, "none">
) {
  const visible: Partial<Record<Breakpoint, DisplayValue>> = {
    xs: visibleDisplay,
    sm: visibleDisplay,
    md: visibleDisplay,
    lg: visibleDisplay,
    xl: visibleDisplay,
  };

  if (flags.smDown) {
    visible.xs = "none";
    visible.sm = "none";
  }

  if (flags.mdDown) {
    visible.xs = "none";
    visible.sm = "none";
    visible.md = "none";
  }

  if (flags.mdUp) {
    visible.md = "none";
    visible.lg = "none";
    visible.xl = "none";
  }

  if (flags.lgDown) {
    visible.xs = "none";
    visible.sm = "none";
    visible.md = "none";
    visible.lg = "none";
  }

  if (flags.lgUp) {
    visible.lg = "none";
    visible.xl = "none";
  }

  return {
    xs: visible.xs,
    sm: visible.sm ?? visible.xs,
    md: visible.md ?? visible.sm ?? visible.xs,
    lg: visible.lg ?? visible.md ?? visible.sm ?? visible.xs,
    xl: visible.xl ?? visible.lg ?? visible.md ?? visible.sm ?? visible.xs,
  };
}

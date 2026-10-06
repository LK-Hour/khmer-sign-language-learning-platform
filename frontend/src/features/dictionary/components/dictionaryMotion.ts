import type { Transition, Variants } from "framer-motion";

/** Shared motion presets so every dictionary surface moves the same way. */

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.6,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

/** Grid container: children reveal in a quick cascade. */
export const staggerGrid = (stagger = 0.018): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger } },
});

export const gridItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: springSoft },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
};

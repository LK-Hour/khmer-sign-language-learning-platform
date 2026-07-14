import type React from "react";

/**
 * A single node in the navigation tree.
 * Leaf nodes have a `path`; parent nodes have `children` or `dynamic`.
 */
export interface NavTreeNodeConfig {
  /** Unique ID for this node (used for expansion state tracking) */
  id: string;
  /** Display label */
  title: string;
  /** Route path — only present on leaf nodes */
  path?: string;
  /** Icon — typically on top-level items */
  icon?: React.ElementType;
  /** Static child nodes */
  children?: NavTreeNodeConfig[];
  /**
   * If set, children are loaded dynamically instead of from config.
   * The component renders a DynamicContributionNav or similar loader.
   */
  dynamic?: "contribution-tree" | "quiz-finger" | "quiz-word";
}

/**
 * A top-level section grouping in the sidebar (e.g. OVERVIEW, LEARNING, MANAGEMENT).
 */
export interface NavSectionConfig {
  title: string;
  items: NavTreeNodeConfig[];
}

import { SUPPORTED_LOCALES } from "@/i18n/config";

import type { NavTreeNodeConfig } from "./navTypes";

/**
 * Traverses the nav tree and returns the ordered list of ancestor node IDs
 * from the root to the leaf's immediate parent for the given path.
 *
 * Also matches parent nodes that have their own path, and paths that
 * start with a node's path (for sub-routes like /admin/units/create).
 *
 * Returns [] if the path is not found in the tree.
 */
export function findAncestorIds(
  tree: NavTreeNodeConfig[],
  path: string
): string[] {
  const ancestors: string[] = [];

  function search(nodes: NavTreeNodeConfig[]): boolean {
    for (const node of nodes) {
      // Exact match on a leaf or parent-with-path
      if (node.path && (path === node.path || path.startsWith(node.path + "/"))) {
        // If this is a parent node, include it in ancestors so it stays expanded
        if (node.children || node.dynamic) {
          ancestors.push(node.id);
        }
        return true;
      }

      if (node.children) {
        ancestors.push(node.id);
        if (search(node.children)) {
          return true;
        }
        ancestors.pop();
      }
    }

    return false;
  }

  search(tree);
  return ancestors;
}

/**
 * Removes the leading locale segment (`/kh/admin/x` -> `/admin/x`). Nav paths in the
 * config are locale-less, while `usePathname()` always includes the locale.
 */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/**
 * Accordion toggle for the sidebar. Only one branch is open at each level, so the
 * expanded set is always a single path from the root: opening a node keeps its ancestors
 * and closes everything else (its siblings and their subtrees); closing a node collapses
 * it and its descendants while its ancestors stay open.
 *
 * @param expanded    currently expanded node IDs
 * @param id          the node that was clicked
 * @param ancestorIds IDs from the root down to the clicked node's parent
 */
export function toggleAccordionPath(
  expanded: readonly string[],
  id: string,
  ancestorIds: readonly string[],
): string[] {
  return expanded.includes(id) ? [...ancestorIds] : [...ancestorIds, id];
}

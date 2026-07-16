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

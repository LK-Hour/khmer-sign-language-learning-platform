import type { NavTreeNodeConfig } from "./navTypes";

/**
 * Traverses the nav tree and returns the ordered list of ancestor node IDs
 * from the root to the leaf's immediate parent for the given path.
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
      if (node.path === path) {
        // Found the leaf — ancestors collected so far are correct
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

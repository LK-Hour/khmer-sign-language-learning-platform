import { describe, it, expect } from "vitest";
import { findAncestorIds } from "./navUtils";
import type { NavTreeNodeConfig } from "./navTypes";

describe("findAncestorIds", () => {
  const tree: NavTreeNodeConfig[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      children: [
        { id: "analytics", title: "Analytics", path: "/admin/analytics" },
      ],
    },
    {
      id: "learning-mgmt",
      title: "Learning Management",
      children: [
        {
          id: "finger-spelling",
          title: "Finger Spelling",
          children: [
            { id: "fs-units", title: "Units", path: "/admin/learning/finger-spelling/units" },
            { id: "fs-chapters", title: "Chapters", path: "/admin/learning/finger-spelling/chapters" },
          ],
        },
        {
          id: "word-detection",
          title: "Word Detection",
          children: [
            { id: "wd-units", title: "Units", path: "/admin/learning/word-detection/units" },
          ],
        },
      ],
    },
    {
      id: "feedback",
      title: "Feedback",
      path: "/admin/feedback",
    },
  ];

  it("returns ancestor IDs for a deeply nested leaf", () => {
    const result = findAncestorIds(tree, "/admin/learning/finger-spelling/units");
    expect(result).toEqual(["learning-mgmt", "finger-spelling"]);
  });

  it("returns ancestor IDs for a leaf one level deep", () => {
    const result = findAncestorIds(tree, "/admin/analytics");
    expect(result).toEqual(["dashboard"]);
  });

  it("returns empty array for a top-level leaf node", () => {
    const result = findAncestorIds(tree, "/admin/feedback");
    expect(result).toEqual([]);
  });

  it("returns empty array when path is not found", () => {
    const result = findAncestorIds(tree, "/admin/nonexistent");
    expect(result).toEqual([]);
  });

  it("returns correct ancestors for another deeply nested path", () => {
    const result = findAncestorIds(tree, "/admin/learning/word-detection/units");
    expect(result).toEqual(["learning-mgmt", "word-detection"]);
  });

  it("handles empty tree", () => {
    const result = findAncestorIds([], "/admin/analytics");
    expect(result).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { findAncestorIds, stripLocalePrefix, toggleAccordionPath } from "./navUtils";
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

describe("stripLocalePrefix", () => {
  it("removes the locale segment", () => {
    expect(stripLocalePrefix("/kh/admin/analytics")).toBe("/admin/analytics");
    expect(stripLocalePrefix("/en/admin/learning/finger-spelling/units")).toBe(
      "/admin/learning/finger-spelling/units",
    );
  });

  it("maps a bare locale to the root", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
  });

  it("leaves paths without a locale untouched", () => {
    expect(stripLocalePrefix("/admin/analytics")).toBe("/admin/analytics");
    // must not eat a segment that merely starts with a locale code
    expect(stripLocalePrefix("/english/admin")).toBe("/english/admin");
  });
});

describe("toggleAccordionPath", () => {
  it("opens a top-level node and closes the other open top-level node", () => {
    expect(toggleAccordionPath(["learning-mgmt"], "dictionary", [])).toEqual(["dictionary"]);
  });

  it("opens a nested node, keeping its ancestors and closing its sibling", () => {
    expect(
      toggleAccordionPath(
        ["learning-mgmt", "finger-spelling"],
        "word-detection",
        ["learning-mgmt"],
      ),
    ).toEqual(["learning-mgmt", "word-detection"]);
  });

  it("closes an open node together with its open descendants, keeping ancestors", () => {
    expect(
      toggleAccordionPath(["learning-mgmt", "finger-spelling"], "learning-mgmt", []),
    ).toEqual([]);
    expect(
      toggleAccordionPath(
        ["learning-mgmt", "unit-quiz", "quiz-fs"],
        "unit-quiz",
        ["learning-mgmt"],
      ),
    ).toEqual(["learning-mgmt"]);
  });

  it("collapses older state that had several branches open", () => {
    expect(toggleAccordionPath(["learning-mgmt", "dictionary", "users"], "users", [])).toEqual([]);
    expect(toggleAccordionPath(["learning-mgmt", "dictionary"], "users", [])).toEqual(["users"]);
  });
});

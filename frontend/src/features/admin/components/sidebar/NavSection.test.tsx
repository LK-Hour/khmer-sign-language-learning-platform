/**
 * Accordion behaviour of the admin sidebar: opening one group closes its siblings.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const nav = vi.hoisted(() => ({ pathname: "/en/admin/analytics" }));

// The UI store persists to localStorage and is created when the module loads, so a working
// storage has to exist before that import (Node's own localStorage stub isn't usable here).
vi.hoisted(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, String(value)),
      removeItem: (key: string) => void data.delete(key),
      clear: () => data.clear(),
    },
  });
});
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { LocaleContextProvider } from "@/i18n/locale-context";

import { useAdminUiStore } from "../../store/adminUi.store";
import { NAV_CONFIG } from "./navConfig";
import NavSection from "./NavSection";

const LEARNING_SECTION = NAV_CONFIG[1];

const fsUnits = () => document.querySelector('a[href="/en/admin/learning/finger-spelling/units"]');
const wdUnits = () => document.querySelector('a[href="/en/admin/learning/word-detection/units"]');
const expanded = () => useAdminUiStore.getState().expandedNavIds;

function renderLearning() {
  return render(
    <LocaleContextProvider value="en">
      <NavSection section={LEARNING_SECTION} />
    </LocaleContextProvider>,
  );
}

beforeEach(() => {
  nav.pathname = "/en/admin/analytics";
  useAdminUiStore.setState({ expandedNavIds: [] });
});

describe("admin sidebar accordion", () => {
  it("closes Learning Management when Dictionary is opened, and vice versa", async () => {
    renderLearning();

    await userEvent.click(screen.getByText("Learning Management"));
    expect(await screen.findByText("Finger Spelling")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Dictionary"));
    expect(await screen.findByText("Characters")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Finger Spelling")).not.toBeInTheDocument());
    expect(expanded()).toEqual(["dictionary"]);

    await userEvent.click(screen.getByText("Learning Management"));
    expect(await screen.findByText("Finger Spelling")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Characters")).not.toBeInTheDocument());
    expect(expanded()).toEqual(["learning-mgmt"]);
  });

  it("closes Finger Spelling when Word Detection is opened, keeping Learning Management open", async () => {
    renderLearning();

    await userEvent.click(screen.getByText("Learning Management"));
    await userEvent.click(await screen.findByText("Finger Spelling"));
    await waitFor(() => expect(fsUnits()).toBeInTheDocument());

    await userEvent.click(screen.getByText("Word Detection"));
    await waitFor(() => expect(wdUnits()).toBeInTheDocument());
    await waitFor(() => expect(fsUnits()).not.toBeInTheDocument());
    expect(expanded()).toEqual(["learning-mgmt", "word-detection"]);
  });

  it("collapses a group together with its open children when it is clicked again", async () => {
    renderLearning();

    await userEvent.click(screen.getByText("Learning Management"));
    await userEvent.click(await screen.findByText("Finger Spelling"));
    expect(expanded()).toEqual(["learning-mgmt", "finger-spelling"]);

    await userEvent.click(screen.getByText("Learning Management"));
    expect(expanded()).toEqual([]);
    await waitFor(() => expect(screen.queryByText("Finger Spelling")).not.toBeInTheDocument());
  });

  it("reveals the active page's branch and closes the others when the route changes", () => {
    // Older persisted state could have several branches open at once.
    useAdminUiStore.setState({ expandedNavIds: ["dictionary", "learning-mgmt", "finger-spelling"] });
    nav.pathname = "/en/admin/learning/word-detection/units";

    renderLearning();

    expect(expanded()).toEqual(["learning-mgmt", "word-detection"]);
  });
});

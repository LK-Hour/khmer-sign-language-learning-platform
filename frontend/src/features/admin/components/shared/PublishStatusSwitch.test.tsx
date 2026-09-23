/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

import PublishStatusSwitch from "./PublishStatusSwitch";

// The app defaults to Khmer; pin English so the assertions can match on text.
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleContextProvider value="en">{children}</LocaleContextProvider>
);
const renderEn = (ui: React.ReactElement) => render(ui, { wrapper });

describe("PublishStatusSwitch", () => {
  it("shows Draft when off and Published when on", () => {
    const { rerender } = renderEn(<PublishStatusSwitch checked={false} onChange={vi.fn()} />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();

    rerender(<PublishStatusSwitch checked onChange={vi.fn()} />);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("reports the new value when toggled", async () => {
    const onChange = vi.fn();
    renderEn(<PublishStatusSwitch checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("locks the switch for inactive rows and explains why", () => {
    renderEn(<PublishStatusSwitch checked={false} onChange={vi.fn()} inactive />);

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByText(/restore this item/i)).toBeInTheDocument();
  });

  it("tells the admin that saving will publish when on", () => {
    renderEn(<PublishStatusSwitch checked onChange={vi.fn()} />);
    expect(screen.getByText(/saving will publish/i)).toBeInTheDocument();
  });
});

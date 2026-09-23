/**
 * Renders the three results cards to check the locale templates, the
 * "Skip" / "Skips" rule and the elapsed-time / pacing formatting end to end.
 *
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/config";

import SentenceCompletionSummary from "./SentenceCompletionSummary";

type SummaryProps = React.ComponentProps<typeof SentenceCompletionSummary>;

const baseProps: SummaryProps = {
  accuracyPercent: 97.6,
  completedCount: 18,
  skippedCount: 0,
  totalCount: 18,
  elapsedMs: 74_000,
};

function renderSummary(overrides: Partial<SummaryProps> = {}, locale: Locale = "en") {
  return render(
    <LocaleContextProvider value={locale}>
      <SentenceCompletionSummary {...baseProps} {...overrides} />
    </LocaleContextProvider>
  );
}

describe("SentenceCompletionSummary", () => {
  it("shows rounded accuracy without any letter rank", () => {
    renderSummary();
    expect(screen.getByText("Average Accuracy")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.queryByText(/^[A-F][+-]?$/)).not.toBeInTheDocument();
  });

  it("shows completed / total and the singular skip label for 0 skips", () => {
    renderSummary();
    expect(screen.getByText("Signs Completed")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("/ 18")).toBeInTheDocument();
    expect(screen.getByText("0 Skip")).toBeInTheDocument();
  });

  it("uses the singular for exactly one skip and the plural for more", () => {
    const { unmount } = renderSummary({ completedCount: 17, skippedCount: 1 });
    expect(screen.getByText("1 Skip")).toBeInTheDocument();
    unmount();

    renderSummary({ completedCount: 16, skippedCount: 2 });
    expect(screen.getByText("2 Skips")).toBeInTheDocument();
  });

  it("shows elapsed time and average seconds per sign", () => {
    renderSummary();
    expect(screen.getByText("Time Elapsed")).toBeInTheDocument();
    expect(screen.getByText("1m 14s")).toBeInTheDocument();
    expect(screen.getByText("Pacing: 4.1s / sign")).toBeInTheDocument();
  });

  it("formats sub-minute durations as seconds only", () => {
    renderSummary({ elapsedMs: 42_000 });
    expect(screen.getByText("42s")).toBeInTheDocument();
  });

  it("falls back to a dash and hides pacing when the clock never started", () => {
    renderSummary({ elapsedMs: null });
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/Pacing/)).not.toBeInTheDocument();
  });

  it("renders Khmer labels and time units when the locale is kh", () => {
    renderSummary({}, "kh");
    expect(screen.getByText("រយៈពេលសរុប")).toBeInTheDocument();
    expect(screen.getByText("1នាទី 14វិនាទី")).toBeInTheDocument();
    expect(screen.getByText("រំលង 0")).toBeInTheDocument();
  });
});

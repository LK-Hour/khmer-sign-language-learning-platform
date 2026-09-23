/**
 * ApexCharts needs a real browser (SVG measuring), so it is stubbed here; the
 * chart's own options are covered by `utils/accuracyChart.test.ts`. This checks
 * what the card wires into it and the text around it.
 *
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

import SentenceAccuracyChart from "./SentenceAccuracyChart";

vi.mock("react-apexcharts", () => ({
  default: ({
    series,
    options,
  }: {
    series: { name: string; data: number[] }[];
    options: { xaxis?: { categories?: string[] } };
  }) => (
    <div
      data-testid="chart"
      data-name={series[0]?.name}
      data-values={series[0]?.data.join(",")}
      data-categories={options.xaxis?.categories?.join(",")}
    />
  ),
}));

const points = [
  { char: "ក", accuracy: 96, skipped: false },
  { char: "ខ", accuracy: 0, skipped: true },
  { char: "គ", accuracy: 72, skipped: false },
];

function renderChart(overrides: Partial<React.ComponentProps<typeof SentenceAccuracyChart>> = {}) {
  return render(
    <LocaleContextProvider value="en">
      <SentenceAccuracyChart points={points} sentence="កខ គ" {...overrides} />
    </LocaleContextProvider>
  );
}

describe("SentenceAccuracyChart", () => {
  it("plots each character's accuracy against the character itself", async () => {
    renderChart();

    const chart = await screen.findByTestId("chart");
    expect(chart).toHaveAttribute("data-values", "96,0,72");
    expect(chart).toHaveAttribute("data-categories", "ក,ខ,គ");
    expect(chart).toHaveAttribute("data-name", "Accuracy");
  });

  it("shows the title and the full sentence under the chart", async () => {
    renderChart();

    expect(screen.getByRole("heading", { name: "Accuracy per Character" })).toBeInTheDocument();
    const chart = await screen.findByTestId("chart");
    const sentence = screen.getByText("កខ គ");
    // Document order: the sentence comes after the chart.
    expect(chart.compareDocumentPosition(sentence) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders nothing when there are no points", () => {
    const { container } = renderChart({ points: [] });
    expect(container).toBeEmptyDOMElement();
  });
});

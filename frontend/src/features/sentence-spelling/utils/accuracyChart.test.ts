import { describe, expect, it } from "vitest";

import {
  buildAccuracyChartOptions,
  buildAccuracySeries,
  clampPercent,
  escapeHtml,
  renderAccuracyTooltip,
  type AccuracyPoint,
} from "./accuracyChart";
import { collectCharacterAccuracies } from "./practiceStats";

const points: AccuracyPoint[] = [
  { char: "ក", accuracy: 96.4, skipped: false },
  { char: "ខ", accuracy: 0, skipped: true },
  { char: "គ", accuracy: 71.5, skipped: false },
];

const labels = { accuracy: "Accuracy", skipped: "Skipped" };

function build(overrides: Partial<Parameters<typeof buildAccuracyChartOptions>[0]> = {}) {
  return buildAccuracyChartOptions({
    points,
    labels,
    lineColor: "#147b55",
    skippedColor: "#ff4438",
    ...overrides,
  });
}

describe("collectCharacterAccuracies", () => {
  it("returns one value per character, with missing ones as 0", () => {
    const confidences = new Map([
      [0, 90],
      [2, 60],
    ]);
    expect(collectCharacterAccuracies(confidences, 4)).toEqual([90, 0, 60, 0]);
    expect(collectCharacterAccuracies(new Map(), 0)).toEqual([]);
  });
});

describe("buildAccuracyChartOptions", () => {
  it("fixes the y axis to 0–100 with ticks every 20 and a % suffix", () => {
    const { yaxis } = build();
    const axis = Array.isArray(yaxis) ? yaxis[0] : yaxis;

    expect(axis?.min).toBe(0);
    expect(axis?.max).toBe(100);
    // 5 intervals between 0 and 100 = 0, 20, 40, 60, 80, 100.
    expect(axis?.tickAmount).toBe(5);
    const format = axis?.labels?.formatter as (value: number) => string;
    expect([0, 20, 40, 60, 80, 100].map(format)).toEqual(["0%", "20%", "40%", "60%", "80%", "100%"]);
  });

  it("keeps the characters off the x axis (they only appear in the tooltip)", () => {
    const { xaxis } = build();
    expect(xaxis?.labels?.show).toBe(false);
    // Still kept as categories so the data stays labelled for the tooltip.
    expect(xaxis?.categories).toEqual(["ក", "ខ", "គ"]);
  });

  it("marks only skipped characters with the skipped colour", () => {
    const discrete = build().markers?.discrete ?? [];
    expect(discrete).toHaveLength(1);
    expect(discrete[0]).toMatchObject({ dataPointIndex: 1, fillColor: "#ff4438" });
  });

  it("uses the hovered point for the tooltip content", () => {
    const custom = build().tooltip?.custom as (opts: { dataPointIndex: number }) => string;

    expect(custom({ dataPointIndex: 0 })).toContain("ក");
    expect(custom({ dataPointIndex: 0 })).toContain("96%");
    expect(custom({ dataPointIndex: 2 })).toContain("72%");
    expect(custom({ dataPointIndex: 99 })).toBe("");
  });
});

describe("renderAccuracyTooltip", () => {
  it("shows the character together with its rounded accuracy", () => {
    const html = renderAccuracyTooltip(points[0], labels);
    expect(html).toContain("ក");
    expect(html).toContain("Accuracy: ");
    expect(html).toContain("96%");
  });

  it("shows Skipped instead of 0% for a skipped character", () => {
    const html = renderAccuracyTooltip(points[1], labels);
    expect(html).toContain("Skipped");
    expect(html).not.toContain("0%");
  });

  it("escapes HTML coming from the practiced text", () => {
    const html = renderAccuracyTooltip(
      { char: "<img src=x onerror=alert(1)>", accuracy: 50, skipped: false },
      labels
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});

describe("buildAccuracySeries", () => {
  it("emits one clamped value per point under the given name", () => {
    const series = buildAccuracySeries(
      [
        { char: "ក", accuracy: 120, skipped: false },
        { char: "ខ", accuracy: -5, skipped: false },
        { char: "គ", accuracy: 42, skipped: false },
      ],
      "Accuracy"
    );
    expect(series).toEqual([{ name: "Accuracy", data: [100, 0, 42] }]);
  });
});

describe("clampPercent / escapeHtml", () => {
  it("clamps to 0–100 and treats non-finite values as 0", () => {
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-1)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it("escapes the characters that matter in HTML", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

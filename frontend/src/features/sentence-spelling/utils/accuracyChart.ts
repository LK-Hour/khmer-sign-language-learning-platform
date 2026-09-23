import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";

export type AccuracyPoint = {
  char: string;
  /** 0–100. */
  accuracy: number;
  skipped: boolean;
};

export type AccuracyChartLabels = {
  /** Tooltip series name, e.g. "Accuracy". */
  accuracy: string;
  /** Tooltip value for a skipped character, e.g. "Skipped". */
  skipped: string;
};

type BuildOptionsParams = {
  points: readonly AccuracyPoint[];
  labels: AccuracyChartLabels;
  lineColor: string;
  skippedColor: string;
};

const AXIS_LABEL_COLOR = "#919EAB";
const GRID_COLOR = "rgba(145, 158, 171, 0.2)";
const MARKER_STROKE = "#ffffff";

/**
 * Apex renders tooltip text with innerHTML, and the practiced text comes
 * straight from the `?text=` query string, so anything shown there is escaped.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function buildAccuracySeries(
  points: readonly AccuracyPoint[],
  seriesName: string
): ApexAxisChartSeries {
  return [{ name: seriesName, data: points.map((point) => clampPercent(point.accuracy)) }];
}

/** Area chart mirroring the admin "Active Users" look: gradient fill, dashed grid, no toolbar. */
export function buildAccuracyChartOptions({
  points,
  labels,
  lineColor,
  skippedColor,
}: BuildOptionsParams): ApexOptions {
  const markerSize = points.length > 24 ? 3 : 5;

  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: AXIS_LABEL_COLOR,
    },
    colors: [lineColor],
    // monotoneCubic keeps the curve inside 0–100 (a plain spline can overshoot).
    stroke: { curve: "monotoneCubic", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.44, opacityTo: 0, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      strokeDashArray: 3,
      borderColor: GRID_COLOR,
      xaxis: { lines: { show: false } },
    },
    markers: {
      size: markerSize,
      colors: [lineColor],
      strokeColors: MARKER_STROKE,
      strokeWidth: 2,
      hover: { size: markerSize + 2 },
      discrete: points.flatMap((point, dataPointIndex) =>
        point.skipped
          ? [
              {
                seriesIndex: 0,
                dataPointIndex,
                fillColor: skippedColor,
                strokeColor: MARKER_STROKE,
                size: markerSize,
              },
            ]
          : []
      ),
    },
    xaxis: {
      categories: points.map((point) => point.char),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickPlacement: "on",
      // Characters are only revealed in the tooltip on hover, never along the axis.
      labels: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      // 5 intervals over 0–100 → ticks at 0, 20, 40, 60, 80, 100.
      tickAmount: 5,
      forceNiceScale: false,
      labels: {
        formatter: (value: number) => `${Math.round(value)}%`,
        style: { fontSize: "11px", colors: AXIS_LABEL_COLOR },
      },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
      // Own content (rather than Apex's x/y formatters) so the character and
      // accuracy always show together, even though the axis labels are hidden.
      custom: ({ dataPointIndex }: { dataPointIndex: number }) =>
        renderAccuracyTooltip(points[dataPointIndex], labels),
    },
  };
}

/** HTML for the hover tooltip: the character, then its accuracy (or "Skipped"). */
export function renderAccuracyTooltip(
  point: AccuracyPoint | undefined,
  labels: AccuracyChartLabels
): string {
  if (!point) return "";
  const value = point.skipped
    ? escapeHtml(labels.skipped)
    : `${Math.round(clampPercent(point.accuracy))}%`;

  return (
    `<div style="padding:8px 12px;color:#fff;font-family:inherit">` +
    `<div style="font-size:20px;font-weight:600;line-height:1.3">${escapeHtml(point.char)}</div>` +
    `<div style="font-size:12px;opacity:.85;margin-top:2px">${escapeHtml(labels.accuracy)}: ` +
    `<strong style="opacity:1">${value}</strong></div>` +
    `</div>`
  );
}

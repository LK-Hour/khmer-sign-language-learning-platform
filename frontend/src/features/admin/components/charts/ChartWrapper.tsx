import type { ApexOptions } from "apexcharts";

export const BASE_CHART_OPTIONS: ApexOptions = {
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "'DM Sans Variable', sans-serif",
    foreColor: "#637381",
  },
  grid: {
    strokeDashArray: 3,
    borderColor: "rgba(145, 158, 171, 0.2)",
    xaxis: { lines: { show: false } },
  },
  tooltip: {
    theme: "dark",
    style: { fontSize: "12px" },
    x: { show: true },
    marker: { show: true },
  },
  stroke: { curve: "smooth", width: 2.5 },
  xaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: "11px", colors: "#919EAB" } },
  },
  yaxis: {
    labels: { style: { fontSize: "11px", colors: "#919EAB" } },
  },
  legend: {
    fontSize: "13px",
    fontWeight: 500,
    labels: { colors: "#637381" },
    itemMargin: { horizontal: 12 },
  },
};

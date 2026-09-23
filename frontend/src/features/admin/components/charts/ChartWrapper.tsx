import type { Theme } from "@mui/material/styles";
import type { ApexOptions } from "apexcharts";

/**
 * Shared ApexCharts options. Label colors come from the theme so axes and legends stay
 * readable in dark mode (the previous hardcoded #637381 was ~3:1 on the dark surface).
 */
export function getBaseChartOptions(theme: Theme): ApexOptions {
  const { text, mode } = theme.palette;
  const axisLabel = mode === "dark" ? text.secondary : text.disabled;

  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "'DM Sans Variable', sans-serif",
      foreColor: text.secondary,
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
      labels: { style: { fontSize: "11px", colors: axisLabel } },
    },
    yaxis: {
      labels: { style: { fontSize: "11px", colors: axisLabel } },
    },
    legend: {
      fontSize: "13px",
      fontWeight: 500,
      labels: { colors: text.secondary },
      itemMargin: { horizontal: 12 },
    },
  };
}

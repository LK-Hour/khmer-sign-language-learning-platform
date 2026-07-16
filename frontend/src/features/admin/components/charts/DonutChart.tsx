"use client";

import { Box } from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface DonutChartProps {
  series: number[];
  labels?: string[];
  height?: number;
}

export default function DonutChart({
  series,
  labels = ["Published", "Draft", "Inactive"],
  height = 364,
}: DonutChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "'DM Sans Variable', sans-serif",
      foreColor: "#637381",
    },
    labels,
    colors: ["#22C55E", "#FFAB00", "#919EAB"],
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            value: {
              show: true,
              formatter: (val: string) => `${parseFloat(val).toFixed(1)}%`,
            },
            total: {
              show: true,
              label: "Completed",
              fontSize: "14px",
              formatter: (w) => {
                const total = w.globals.seriesTotals[0] ?? 0;
                return `${total.toFixed(1)}%`;
              },
            },
          },
        },
      },
    },
    legend: {
      position: "bottom",
      fontSize: "13px",
      fontWeight: 500,
      labels: { colors: "#637381" },
      itemMargin: { horizontal: 12 },
      formatter: (legendName: string, opts) => {
        const val = opts?.w?.globals?.series?.[opts.seriesIndex] ?? 0;
        return `${legendName}: ${val.toFixed(1)}%`;
      },
    },
    tooltip: {
      theme: "dark",
      style: { fontSize: "12px" },
      y: {
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
    },
    stroke: { show: false },
    dataLabels: { enabled: false },
  };

  return (
    <Box sx={{ width: "100%", "& .apexcharts-canvas": { width: "100% !important" } }}>
      <Chart options={options} series={series} type="donut" height={height} />
    </Box>
  );
}

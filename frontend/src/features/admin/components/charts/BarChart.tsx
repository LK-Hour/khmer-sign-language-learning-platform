"use client";

import { Box } from "@mui/material";
import type { ApexOptions, ApexAxisChartSeries } from "apexcharts";
import dynamic from "next/dynamic";
import { BASE_CHART_OPTIONS } from "./ChartWrapper";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface BarChartProps {
  series: ApexAxisChartSeries;
  categories: string[];
  height?: number;
}

export default function BarChart({ series, categories, height = 364 }: BarChartProps) {
  const options: ApexOptions = {
    ...BASE_CHART_OPTIONS,
    chart: {
      ...BASE_CHART_OPTIONS.chart,
      type: "bar",
    },
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: "48%",
        borderRadiusApplication: "end",
      },
    },
    xaxis: {
      ...BASE_CHART_OPTIONS.xaxis,
      categories,
    },
  };

  return (
    <Box sx={{ width: "100%", "& .apexcharts-canvas": { width: "100% !important" } }}>
      <Chart options={options} series={series} type="bar" height={height} />
    </Box>
  );
}

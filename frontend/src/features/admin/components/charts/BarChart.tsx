"use client";

import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ApexOptions, ApexAxisChartSeries } from "apexcharts";
import dynamic from "next/dynamic";
import { getBaseChartOptions } from "./ChartWrapper";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface BarChartProps {
  series: ApexAxisChartSeries;
  categories: string[];
  height?: number;
}

export default function BarChart({ series, categories, height = 364 }: BarChartProps) {
  const theme = useTheme();
  const base = getBaseChartOptions(theme);
  const options: ApexOptions = {
    ...base,
    chart: {
      ...base.chart,
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
      ...base.xaxis,
      categories,
    },
  };

  return (
    <Box sx={{ width: "100%", "& .apexcharts-canvas": { width: "100% !important" } }}>
      <Chart options={options} series={series} type="bar" height={height} />
    </Box>
  );
}

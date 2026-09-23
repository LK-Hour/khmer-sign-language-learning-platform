"use client";

import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ApexOptions, ApexAxisChartSeries } from "apexcharts";
import dynamic from "next/dynamic";
import { getBaseChartOptions } from "./ChartWrapper";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface AreaChartProps {
  series: ApexAxisChartSeries;
  categories: string[];
  height?: number;
}

export default function AreaChart({ series, categories, height = 364 }: AreaChartProps) {
  const theme = useTheme();
  const base = getBaseChartOptions(theme);
  const options: ApexOptions = {
    ...base,
    chart: {
      ...base.chart,
      type: "area",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.44,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    xaxis: {
      ...base.xaxis,
      categories,
    },
  };

  return (
    <Box sx={{ width: "100%", "& .apexcharts-canvas": { width: "100% !important" } }}>
      <Chart options={options} series={series} type="area" height={height} />
    </Box>
  );
}

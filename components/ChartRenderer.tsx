"use client";

import { ChartData } from "@/types/chat";
import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import PieChart from "./charts/PieChart";
import AreaChart from "./charts/AreaChart";

interface ChartRendererProps {
  chartData: ChartData;
}

export default function ChartRenderer({ chartData }: ChartRendererProps) {
  // Parse the chart type to determine base type and variant
  const getChartTypeInfo = (type: string) => {
    if (type.startsWith('bar')) return { base: 'bar', variant: type };
    if (type.startsWith('line')) return { base: 'line', variant: type };
    if (type.startsWith('area')) return { base: 'area', variant: type };
    if (type.startsWith('pie')) return { base: 'pie', variant: type };
    if (type === 'radar' || type === 'radial') return { base: 'bar', variant: type }; // Fallback to bar for now
    return { base: 'bar', variant: 'bar' }; // Default fallback
  };

  const { base, variant } = getChartTypeInfo(chartData.type);

  // Enhanced chart data with variant info
  const enhancedChartData = {
    ...chartData,
    variant
  };

  switch (base) {
    case 'bar':
      return <BarChart chartData={enhancedChartData} />;
    case 'line':
      return <LineChart chartData={enhancedChartData} />;
    case 'area':
      return <AreaChart chartData={enhancedChartData} />;
    case 'pie':
      return <PieChart chartData={enhancedChartData} />;
    default:
      return <BarChart chartData={enhancedChartData} />;
  }
} 
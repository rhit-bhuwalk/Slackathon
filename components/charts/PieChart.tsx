"use client";

import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartData } from "@/types/chat";

interface PieChartProps {
  chartData: ChartData;
}

export default function PieChart({ chartData }: PieChartProps) {
  const { title, data, yKey, config, variant = 'pie' } = chartData;

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const isDonut = variant === 'pie-donut' || variant === 'pie-donut-text';
  const hasText = variant === 'pie-donut-text';
  
  // Calculate total for center text
  const total = data.reduce((sum, item) => sum + (item[yKey] || 0), 0);

  return (
    <div className="w-full p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-center mb-4 text-card-foreground">{title}</h3>
      <ChartContainer config={config} className="h-[300px] w-full">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isDonut ? 40 : 0}
            outerRadius={80}
            dataKey={yKey}
            label={!hasText ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          
          {/* Center text for donut with text variant */}
          {hasText && (
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle" 
              className="fill-card-foreground text-2xl font-bold"
            >
              {total}
            </text>
          )}
        </RechartsPieChart>
      </ChartContainer>
    </div>
  );
} 
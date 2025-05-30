"use client";

import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartData } from "@/types/chat";

interface AreaChartProps {
  chartData: ChartData;
}

export default function AreaChart({ chartData }: AreaChartProps) {
  const { title, data, xKey, yKey, config, variant = 'area' } = chartData;

  // For stacked variants, extract all numeric keys
  const dataKeys = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== xKey && typeof data[0][key] === 'number')
    : [yKey];

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const isStacked = variant === 'area-stacked';
  const isStep = variant === 'area-step';
  const curveType = isStep ? 'step' : 'monotone';

  return (
    <div className="w-full p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-center mb-4 text-card-foreground">{title}</h3>
      <ChartContainer config={config} className="h-[300px] w-full">
        <RechartsAreaChart data={data}>
          <XAxis 
            dataKey={xKey}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          
          {isStacked && dataKeys.length > 1 ? (
            // Render multiple stacked areas
            dataKeys.map((key, index) => (
              <Area
                key={key}
                type={curveType}
                dataKey={key}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={`${COLORS[index % COLORS.length]} / 0.6`}
                strokeWidth={2}
              />
            ))
          ) : (
            // Single area for basic or step variants
            <Area 
              type={curveType}
              dataKey={yKey} 
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1) / 0.2)"
              strokeWidth={2}
            />
          )}
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
} 
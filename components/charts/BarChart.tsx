"use client";

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartData } from "@/types/chat";

interface BarChartProps {
  chartData: ChartData;
}

export default function BarChart({ chartData }: BarChartProps) {
  const { title, data, xKey, yKey, config, variant = 'bar' } = chartData;

  // For multiple/stacked variants, extract all numeric keys
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

  const isHorizontal = variant === 'bar-horizontal';
  const isStacked = variant === 'bar-stacked';
  const isMultiple = variant === 'bar-multiple' || dataKeys.length > 1;

  return (
    <div className="w-full p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-center mb-4 text-card-foreground">{title}</h3>
      <ChartContainer config={config} className="h-[300px] w-full">
        <RechartsBarChart 
          data={data} 
          layout={isHorizontal ? "horizontal" : "vertical"}
        >
          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey={xKey} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xKey}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
            </>
          )}
          <ChartTooltip 
            cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
            content={<ChartTooltipContent />} 
          />
          
          {isMultiple || isStacked ? (
            // Render multiple bars for stacked or multiple variants
            dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
                stackId={isStacked ? "stack" : undefined}
              />
            ))
          ) : (
            // Single bar for basic variant
            <Bar 
              dataKey={yKey} 
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
          )}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
} 
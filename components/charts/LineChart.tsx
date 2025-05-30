"use client";

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartData } from "@/types/chat";

interface LineChartProps {
  chartData: ChartData;
}

export default function LineChart({ chartData }: LineChartProps) {
  const { title, data, xKey, yKey, config, variant = 'line' } = chartData;

  // For multiple variants, extract all numeric keys
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

  const isMultiple = variant === 'line-multiple' || dataKeys.length > 1;
  const isStep = variant === 'line-step';
  const curveType = isStep ? 'step' : 'monotone';

  return (
    <div className="w-full p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-center mb-4 text-card-foreground">{title}</h3>
      <ChartContainer config={config} className="h-[300px] w-full">
        <RechartsLineChart data={data}>
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
          
          {isMultiple ? (
            // Render multiple lines
            dataKeys.map((key, index) => (
              <Line
                key={key}
                type={curveType}
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
              />
            ))
          ) : (
            // Single line for basic or step variants
            <Line 
              type={curveType}
              dataKey={yKey} 
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
            />
          )}
        </RechartsLineChart>
      </ChartContainer>
    </div>
  );
} 
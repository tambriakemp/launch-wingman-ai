import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface DataKey {
  key: string;
  color: string;
  label: string;
}

interface GrowthChartProps {
  title: string;
  data: Record<string, any>[];
  dataKeys: DataKey[];
  type?: 'line' | 'area' | 'bar';
  formatValue?: (value: number) => string;
}

export function GrowthChart({
  title,
  data,
  dataKeys,
  type = 'line',
  formatValue = (value) => value.toLocaleString(),
}: GrowthChartProps) {
  // Build chart config from dataKeys
  const chartConfig = dataKeys.reduce((acc, { key, color, label }) => {
    acc[key] = { label, color };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip 
              content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />} 
            />
            {dataKeys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
            {dataKeys.map(({ key, color }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip 
              content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />} 
            />
            {dataKeys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
            {dataKeys.map(({ key, color }) => (
              <Bar
                key={key}
                dataKey={key}
                fill={color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
      default:
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              tickFormatter={(value) => formatValue(value)}
            />
            <ChartTooltip 
              content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />} 
            />
            {dataKeys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
            {dataKeys.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { LabelWithTooltip } from "@/components/ui/info-tooltip";

interface Props {
  data: { date: string; conversions: number; revenue: number }[];
}

const ConversionsOverTimeChart = ({ data }: Props) => {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <LabelWithTooltip termKey="conversions-over-time">Conversions Over Time</LabelWithTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formatted.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No conversion data yet</p>
        ) : (
          <div className="h-[200px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatted}>
                <defs>
                  <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [`$${value.toLocaleString()}`, "Revenue"];
                    return [value, "Conversions"];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(var(--primary))"
                  fill="url(#conversionGradient)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--secondary))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionsOverTimeChart;

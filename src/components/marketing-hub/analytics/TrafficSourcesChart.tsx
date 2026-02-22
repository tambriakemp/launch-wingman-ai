import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Props {
  data: { source: string; clicks: number }[];
}

const COLORS = [
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(220 70% 55%)",
  "hsl(280 60% 55%)",
  "hsl(30 80% 55%)",
  "hsl(160 50% 45%)",
];

const TrafficSourcesChart = ({ data }: Props) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No referrer data yet</p>
      ) : (
        <div className="h-[220px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="clicks"
              nameKey="source"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  </Card>
);

export default TrafficSourcesChart;

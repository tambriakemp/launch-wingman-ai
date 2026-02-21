import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  data: { label: string; clicks: number }[];
}

const ClicksBySourceMediumChart = ({ data }: Props) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Clicks by Source / Medium</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No source/medium data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);

export default ClicksBySourceMediumChart;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  dayData: { day: string; clicks: number }[];
  hourData: { hour: string; clicks: number }[];
}

const ClickTimingChart = ({ dayData, hourData }: Props) => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Clicks by Day of Week</CardTitle>
      </CardHeader>
      <CardContent>
        {dayData.every((d) => d.clicks === 0) ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No timing data yet</p>
        ) : (
          <div className="h-[160px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="clicks" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Clicks by Hour of Day</CardTitle>
      </CardHeader>
      <CardContent>
        {hourData.every((d) => d.clicks === 0) ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No timing data yet</p>
        ) : (
          <div className="h-[160px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData}>
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
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
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

export default ClickTimingChart;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Props {
  deviceData: { device: string; clicks: number }[];
  browserData: { browser: string; clicks: number }[];
}

const DEVICE_COLORS = ["hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--primary))"];
const BROWSER_COLORS = [
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(220 70% 55%)",
  "hsl(280 60% 55%)",
  "hsl(var(--destructive))",
  "hsl(var(--primary))",
];

const DeviceBreakdownChart = ({ deviceData, browserData }: Props) => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {deviceData.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No device data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={deviceData} dataKey="clicks" nameKey="device" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                {deviceData.map((_, i) => (
                  <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Browser Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {browserData.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No browser data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={browserData} dataKey="clicks" nameKey="browser" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                {browserData.map((_, i) => (
                  <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  </div>
);

export default DeviceBreakdownChart;

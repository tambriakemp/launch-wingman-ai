import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { LabelWithTooltip } from "@/components/ui/info-tooltip";

interface LinkOption {
  id: string;
  label: string;
  clicks: number;
}

interface Props {
  data: { date: string; clicks: number }[];
  availableLinks?: LinkOption[];
  onLinkFilter?: (linkId: string | null) => { date: string; clicks: number }[];
}

const ClicksOverTimeChart = ({ data, availableLinks = [], onLinkFilter }: Props) => {
  const [selectedLink, setSelectedLink] = useState<string>("all");

  const chartData = selectedLink !== "all" && onLinkFilter
    ? onLinkFilter(selectedLink)
    : data;

  const formatted = chartData.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium">
          <LabelWithTooltip termKey="clicks-over-time">Clicks Over Time</LabelWithTooltip>
        </CardTitle>
        {availableLinks.length > 0 && (
          <Select value={selectedLink} onValueChange={setSelectedLink}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Links" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Links</SelectItem>
              {availableLinks.filter(l => l.clicks > 0).map((link) => (
                <SelectItem key={link.id} value={link.id}>
                  {link.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {formatted.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No click data yet</p>
        ) : (
          <div className="h-[200px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--secondary))"
                fill="url(#clickGradient)"
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

export default ClicksOverTimeChart;

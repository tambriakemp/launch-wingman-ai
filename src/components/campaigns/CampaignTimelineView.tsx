import { useMemo } from "react";
import { Campaign } from "@/types/campaign";
import { statusColors, goalLabels } from "./campaignDemoData";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { differenceInDays, format, parseISO, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  campaigns: Campaign[];
}

export default function CampaignTimelineView({ campaigns }: Props) {
  const { timelineStart, timelineEnd, months, totalDays } = useMemo(() => {
    const dates = campaigns.flatMap((c) => [parseISO(c.start_date), c.end_date ? parseISO(c.end_date) : addMonths(parseISO(c.start_date), 3)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    const ts = startOfMonth(min);
    const te = endOfMonth(max);
    const months = eachMonthOfInterval({ start: ts, end: te });
    return { timelineStart: ts, timelineEnd: te, months, totalDays: differenceInDays(te, ts) + 1 };
  }, [campaigns]);

  const getBarStyle = (c: Campaign) => {
    const start = parseISO(c.start_date);
    const end = c.end_date ? parseISO(c.end_date) : addMonths(start, 3);
    const left = (differenceInDays(start, timelineStart) / totalDays) * 100;
    const width = (differenceInDays(end, start) / totalDays) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` };
  };

  const barColors: Record<string, string> = {
    draft: "bg-muted-foreground/30",
    live: "bg-emerald-500",
    evergreen: "bg-purple-500",
    ended: "bg-red-400",
  };

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-x-auto">
        {/* Month headers */}
        <div className="flex border-b bg-muted/30 sticky top-0">
          <div className="w-44 flex-shrink-0 p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Campaign</div>
          <div className="flex-1 flex">
            {months.map((m) => {
              const days = differenceInDays(endOfMonth(m), startOfMonth(m)) + 1;
              const widthPct = (days / totalDays) * 100;
              return (
                <div key={m.toISOString()} className="border-l px-2 py-3 text-xs font-medium text-muted-foreground" style={{ width: `${widthPct}%` }}>
                  {format(m, "MMM yyyy")}
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign rows */}
        {campaigns.map((c) => (
          <div key={c.id} className="flex border-b last:border-0 hover:bg-muted/10 transition-colors">
            <div className="w-44 flex-shrink-0 p-3 flex flex-col gap-0.5">
              <span className="text-sm font-medium truncate">{c.name}</span>
              <Badge className={cn("text-[10px] w-fit capitalize", statusColors[c.status])} variant="secondary">{c.status}</Badge>
            </div>
            <div className="flex-1 relative h-16">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn("absolute top-4 h-8 rounded-md cursor-pointer transition-opacity hover:opacity-80", barColors[c.status])}
                    style={getBarStyle(c)}
                  />
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p className="font-medium">{c.name}</p>
                  <p>{goalLabels[c.goal]} · {c.leads.toLocaleString()} leads · ${c.revenue.toLocaleString()}</p>
                  <p>{format(parseISO(c.start_date), "MMM d")} – {c.end_date ? format(parseISO(c.end_date), "MMM d") : "Ongoing"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}

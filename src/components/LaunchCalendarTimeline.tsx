import { useMemo, useRef } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, isBefore, isAfter, addMonths } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface LaunchEvent {
  id: string;
  title: string;
  event_type: string;
  content_creation_start: string | null;
  prelaunch_start: string | null;
  enrollment_opens: string | null;
  enrollment_closes: string | null;
  program_delivery_start: string | null;
  program_delivery_end: string | null;
  rest_period_start: string | null;
  rest_period_end: string | null;
}

interface LaunchCalendarTimelineProps {
  events: LaunchEvent[];
}

interface TimelineBar {
  eventId: string;
  eventTitle: string;
  phase: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

const phaseConfig: Record<string, { bg: string; border: string; label: string; shortLabel: string }> = {
  content_creation: { 
    bg: "bg-amber-500", 
    border: "border-amber-600", 
    label: "Content Creation",
    shortLabel: "Content"
  },
  prelaunch: { 
    bg: "bg-violet-500", 
    border: "border-violet-600", 
    label: "Prelaunch",
    shortLabel: "Prelaunch"
  },
  enrollment: { 
    bg: "bg-emerald-500", 
    border: "border-emerald-600", 
    label: "Enrollment",
    shortLabel: "Enroll"
  },
  delivery: { 
    bg: "bg-blue-500", 
    border: "border-blue-600", 
    label: "Program Delivery",
    shortLabel: "Delivery"
  },
  rest: { 
    bg: "bg-slate-400", 
    border: "border-slate-500", 
    label: "Rest Period",
    shortLabel: "Rest"
  },
};

export function LaunchCalendarTimeline({ events }: LaunchCalendarTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Collect all dates from events
  const allDates = useMemo(() => {
    const dates: Date[] = [];
    
    events.forEach(event => {
      if (event.content_creation_start) dates.push(parseISO(event.content_creation_start));
      if (event.prelaunch_start) dates.push(parseISO(event.prelaunch_start));
      if (event.enrollment_opens) dates.push(parseISO(event.enrollment_opens));
      if (event.enrollment_closes) dates.push(parseISO(event.enrollment_closes));
      if (event.program_delivery_start) dates.push(parseISO(event.program_delivery_start));
      if (event.program_delivery_end) dates.push(parseISO(event.program_delivery_end));
      if (event.rest_period_start) dates.push(parseISO(event.rest_period_start));
      if (event.rest_period_end) dates.push(parseISO(event.rest_period_end));
    });
    
    return dates;
  }, [events]);

  // Calculate timeline range based on events
  const { timelineStart, timelineEnd, months, totalDays } = useMemo(() => {
    if (allDates.length === 0) {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(addMonths(now, 5));
      return {
        timelineStart: start,
        timelineEnd: end,
        months: eachMonthOfInterval({ start, end }),
        totalDays: differenceInDays(end, start) + 1,
      };
    }
    
    const earliestDate = allDates.reduce((a, b) => (a < b ? a : b));
    const latestDate = allDates.reduce((a, b) => (a > b ? a : b));
    
    // Start from the beginning of the earliest month
    const start = startOfMonth(earliestDate);
    // End at the end of the latest month, plus 1 extra month for padding
    const end = endOfMonth(addMonths(latestDate, 1));
    
    return {
      timelineStart: start,
      timelineEnd: end,
      months: eachMonthOfInterval({ start, end }),
      totalDays: differenceInDays(end, start) + 1,
    };
  }, [allDates]);

  const timelineBars = useMemo(() => {
    const bars: TimelineBar[] = [];

    events.forEach((event) => {
      if (event.content_creation_start && event.prelaunch_start) {
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "content_creation",
          startDate: parseISO(event.content_creation_start),
          endDate: parseISO(event.prelaunch_start),
          color: "content_creation",
        });
      }

      // For prelaunch phase: if enrollment_opens exists use it as end, otherwise use 7 weeks after prelaunch_start
      if (event.prelaunch_start) {
        const prelaunchEnd = event.enrollment_opens 
          ? parseISO(event.enrollment_opens)
          : addMonths(parseISO(event.prelaunch_start), 2); // ~7-8 weeks approximation
        
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "prelaunch",
          startDate: parseISO(event.prelaunch_start),
          endDate: prelaunchEnd,
          color: "prelaunch",
        });
      }

      if (event.enrollment_opens && event.enrollment_closes) {
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "enrollment",
          startDate: parseISO(event.enrollment_opens),
          endDate: parseISO(event.enrollment_closes),
          color: "enrollment",
        });
      }

      if (event.program_delivery_start && event.program_delivery_end) {
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "delivery",
          startDate: parseISO(event.program_delivery_start),
          endDate: parseISO(event.program_delivery_end),
          color: "delivery",
        });
      }

      if (event.rest_period_start && event.rest_period_end) {
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "rest",
          startDate: parseISO(event.rest_period_start),
          endDate: parseISO(event.rest_period_end),
          color: "rest",
        });
      }
    });

    return bars;
  }, [events]);

  const getBarStyle = (bar: TimelineBar) => {
    const barStart = isBefore(bar.startDate, timelineStart) ? timelineStart : bar.startDate;
    const barEnd = isAfter(bar.endDate, timelineEnd) ? timelineEnd : bar.endDate;
    
    const startOffset = differenceInDays(barStart, timelineStart);
    const duration = differenceInDays(barEnd, barStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { 
      left: `${Math.max(0, left)}%`, 
      width: `${Math.max(0.5, Math.min(width, 100 - left))}%` 
    };
  };

  // Group bars by event
  const eventGroups = useMemo(() => {
    const groups: Record<string, { title: string; bars: TimelineBar[] }> = {};
    
    timelineBars.forEach((bar) => {
      if (!groups[bar.eventId]) {
        groups[bar.eventId] = { title: bar.eventTitle, bars: [] };
      }
      groups[bar.eventId].bars.push(bar);
    });
    
    return Object.entries(groups);
  }, [timelineBars]);

  // Calculate month widths proportionally
  const getMonthWidth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = differenceInDays(monthEnd, monthStart) + 1;
    return (days / totalDays) * 100;
  };

  // Minimum width per month in pixels for readability
  const minMonthWidth = 80;
  const totalMinWidth = months.length * minMonthWidth;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Year at a Glance</h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(phaseConfig).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${value.bg}`} />
              <span className="text-xs text-muted-foreground">{value.label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Timeline */}
        <ScrollArea className="w-full" ref={scrollRef}>
          <div 
            className="border rounded-lg overflow-hidden bg-card"
            style={{ minWidth: `${totalMinWidth}px` }}
          >
            {/* Month Headers */}
            <div className="flex border-b bg-muted/50">
              {months.map((month, index) => {
                const isNewYear = index === 0 || month.getMonth() === 0;
                return (
                  <div
                    key={month.toISOString()}
                    className="flex-shrink-0 px-1 py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
                    style={{ width: `${getMonthWidth(month)}%`, minWidth: `${minMonthWidth}px` }}
                  >
                    {format(month, "MMM")}
                    {isNewYear && (
                      <span className="ml-1 text-foreground font-semibold">
                        {format(month, "yyyy")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline Rows */}
            {eventGroups.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">No events scheduled</p>
                <p className="text-xs mt-1">Add an event to see it on the timeline</p>
              </div>
            ) : (
              <div className="divide-y">
                {eventGroups.map(([eventId, { title, bars }]) => (
                  <div key={eventId} className="relative">
                    {/* Event Title */}
                    <div className="px-3 py-2 text-sm font-medium text-foreground bg-muted/20 border-b sticky left-0">
                      {title}
                    </div>
                    
                    {/* Timeline Row */}
                    <div className="relative h-10 bg-card">
                      {/* Month Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {months.map((month, i) => (
                          <div
                            key={month.toISOString()}
                            className={`flex-shrink-0 border-r border-border/30 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}
                            style={{ width: `${getMonthWidth(month)}%`, minWidth: `${minMonthWidth}px` }}
                          />
                        ))}
                      </div>
                      
                      {/* Phase Bars */}
                      <div className="absolute inset-0 py-1.5">
                        {bars.map((bar, index) => {
                          const style = getBarStyle(bar);
                          const config = phaseConfig[bar.color];
                          const widthNum = parseFloat(style.width);
                          
                          return (
                            <Tooltip key={`${bar.eventId}-${bar.phase}-${index}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`absolute h-7 rounded-sm ${config.bg} opacity-90 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center overflow-hidden shadow-sm`}
                                  style={{
                                    left: style.left,
                                    width: style.width,
                                  }}
                                >
                                  <span className="text-[10px] font-medium text-white truncate px-1">
                                    {widthNum > 4 ? config.shortLabel : ''}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-medium">{config.label}</p>
                                  <p className="text-muted-foreground">
                                    {format(bar.startDate, "MMM d, yyyy")} - {format(bar.endDate, "MMM d, yyyy")}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

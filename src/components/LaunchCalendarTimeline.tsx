import { useMemo, useState } from "react";
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, differenceInDays, isWithinInterval, isBefore, isAfter } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // Determine the best year to display based on events
  const getInitialYear = () => {
    const now = new Date();
    if (events.length === 0) return now.getFullYear();
    
    // Find the earliest event date
    const eventDates = events.flatMap(e => [
      e.prelaunch_start,
      e.content_creation_start,
      e.enrollment_opens,
      e.program_delivery_start,
    ].filter(Boolean).map(d => parseISO(d!)));
    
    if (eventDates.length === 0) return now.getFullYear();
    
    const earliestDate = eventDates.reduce((a, b) => a < b ? a : b);
    return earliestDate.getFullYear();
  };

  const [year, setYear] = useState(getInitialYear);
  
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;

  const timelineBars = useMemo(() => {
    const bars: TimelineBar[] = [];

    events.forEach((event) => {
      // Content Creation phase
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

      // Prelaunch phase
      if (event.prelaunch_start && event.enrollment_opens) {
        bars.push({
          eventId: event.id,
          eventTitle: event.title,
          phase: "prelaunch",
          startDate: parseISO(event.prelaunch_start),
          endDate: parseISO(event.enrollment_opens),
          color: "prelaunch",
        });
      }

      // Enrollment phase
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

      // Program Delivery phase
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

      // Rest Period phase
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
    // Clamp dates to the visible year
    const barStart = isBefore(bar.startDate, yearStart) ? yearStart : bar.startDate;
    const barEnd = isAfter(bar.endDate, yearEnd) ? yearEnd : bar.endDate;
    
    const startOffset = differenceInDays(barStart, yearStart);
    const duration = differenceInDays(barEnd, barStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { 
      left: `${Math.max(0, left)}%`, 
      width: `${Math.max(0.5, Math.min(width, 100 - left))}%` 
    };
  };

  const isBarVisibleInYear = (bar: TimelineBar) => {
    // Check if any part of the bar falls within the current year
    return (
      isWithinInterval(bar.startDate, { start: yearStart, end: yearEnd }) ||
      isWithinInterval(bar.endDate, { start: yearStart, end: yearEnd }) ||
      (isBefore(bar.startDate, yearStart) && isAfter(bar.endDate, yearEnd))
    );
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

  // Filter to only show events that have bars visible in the current year
  const visibleEventGroups = eventGroups.filter(([, { bars }]) => 
    bars.some(bar => isBarVisibleInYear(bar))
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with Year Navigation */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Year at a Glance</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold w-16 text-center">{year}</span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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

        {/* Timeline */}
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Month Headers */}
          <div className="grid grid-cols-12 border-b bg-muted/50">
            {months.map((month) => (
              <div
                key={month.toISOString()}
                className="px-1 py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
              >
                {format(month, "MMM")}
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          {visibleEventGroups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">No events scheduled for {year}</p>
              <p className="text-xs mt-1">Use the arrows to navigate to a different year</p>
            </div>
          ) : (
            <div className="divide-y">
              {visibleEventGroups.map(([eventId, { title, bars }]) => (
                <div key={eventId} className="relative">
                  {/* Event Title */}
                  <div className="px-3 py-2 text-sm font-medium text-foreground bg-muted/20 border-b">
                    {title}
                  </div>
                  
                  {/* Timeline Row */}
                  <div className="relative h-10 bg-card">
                    {/* Month Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                      {months.map((month, i) => (
                        <div
                          key={month.toISOString()}
                          className={`border-r border-border/30 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}
                        />
                      ))}
                    </div>
                    
                    {/* Phase Bars */}
                    <div className="absolute inset-0 py-1.5 px-0.5">
                      {bars.filter(isBarVisibleInYear).map((bar, index) => {
                        const style = getBarStyle(bar);
                        const config = phaseConfig[bar.color];
                        
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
                                  {parseFloat(style.width) > 6 ? config.shortLabel : ''}
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
      </div>
    </TooltipProvider>
  );
}

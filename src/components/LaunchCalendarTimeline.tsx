import { useMemo } from "react";
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

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
  year?: number;
}

interface TimelineBar {
  eventId: string;
  eventTitle: string;
  phase: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

const phaseColors: Record<string, { bg: string; border: string; label: string }> = {
  content_creation: { 
    bg: "bg-amber-500/20", 
    border: "border-amber-500", 
    label: "Content Creation" 
  },
  prelaunch: { 
    bg: "bg-violet-500/20", 
    border: "border-violet-500", 
    label: "Prelaunch" 
  },
  enrollment: { 
    bg: "bg-emerald-500/20", 
    border: "border-emerald-500", 
    label: "Enrollment" 
  },
  delivery: { 
    bg: "bg-blue-500/20", 
    border: "border-blue-500", 
    label: "Program Delivery" 
  },
  rest: { 
    bg: "bg-slate-500/20", 
    border: "border-slate-500", 
    label: "Rest Period" 
  },
};

export function LaunchCalendarTimeline({ events, year = new Date().getFullYear() }: LaunchCalendarTimelineProps) {
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

  const getBarPosition = (bar: TimelineBar) => {
    const barStart = bar.startDate < yearStart ? yearStart : bar.startDate;
    const barEnd = bar.endDate > yearEnd ? yearEnd : bar.endDate;
    
    const startOffset = differenceInDays(barStart, yearStart);
    const duration = differenceInDays(barEnd, barStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  const isBarVisible = (bar: TimelineBar) => {
    return isWithinInterval(bar.startDate, { start: yearStart, end: yearEnd }) ||
           isWithinInterval(bar.endDate, { start: yearStart, end: yearEnd }) ||
           (bar.startDate <= yearStart && bar.endDate >= yearEnd);
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

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(phaseColors).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${value.bg} border-l-4 ${value.border}`} />
            <span className="text-xs text-muted-foreground">{value.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="border rounded-lg overflow-hidden">
        {/* Month Headers */}
        <div className="grid grid-cols-12 border-b bg-muted/50">
          {months.map((month) => (
            <div
              key={month.toISOString()}
              className="px-2 py-3 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
            >
              {format(month, "MMM")}
            </div>
          ))}
        </div>

        {/* Timeline Rows */}
        {eventGroups.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No events to display for {year}
          </div>
        ) : (
          <div className="divide-y">
            {eventGroups.map(([eventId, { title, bars }]) => (
              <div key={eventId} className="relative">
                {/* Event Title */}
                <div className="px-3 py-2 text-sm font-medium text-foreground bg-muted/30">
                  {title}
                </div>
                
                {/* Timeline Row */}
                <div className="relative h-12 bg-card">
                  {/* Month Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-12">
                    {months.map((month, i) => (
                      <div
                        key={month.toISOString()}
                        className={`border-r border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}
                      />
                    ))}
                  </div>
                  
                  {/* Phase Bars */}
                  <div className="absolute inset-0 px-1 py-2">
                    {bars.filter(isBarVisible).map((bar, index) => {
                      const position = getBarPosition(bar);
                      const colors = phaseColors[bar.color];
                      
                      return (
                        <div
                          key={`${bar.eventId}-${bar.phase}-${index}`}
                          className={`absolute h-8 rounded ${colors.bg} border-l-4 ${colors.border} flex items-center px-2 overflow-hidden`}
                          style={{
                            left: position.left,
                            width: position.width,
                          }}
                          title={`${colors.label}: ${format(bar.startDate, "MMM d")} - ${format(bar.endDate, "MMM d")}`}
                        >
                          <span className="text-xs font-medium text-foreground truncate">
                            {colors.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-lg font-semibold text-foreground">{year}</span>
      </div>
    </div>
  );
}

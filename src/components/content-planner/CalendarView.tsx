import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContentItem {
  id: string;
  phase: string;
  day_number: number;
  time_of_day: string;
  content_type: string;
  title: string;
  description: string | null;
  content: string | null;
  status: string;
  labels: string[];
  media_url: string | null;
  media_type: string | null;
  scheduled_platforms: string[];
  scheduled_at: string | null;
}

interface Phase {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

interface ContentType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StatusOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface CalendarViewProps {
  contentItems: ContentItem[];
  phases: Phase[];
  contentTypes: ContentType[];
  statusOptions: StatusOption[];
  draggedItem: ContentItem | null;
  onEdit: (item: ContentItem) => void;
  onDragStart: (e: React.DragEvent, item: ContentItem) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetPhase: string, targetDay: number) => void;
  onDragEnd: () => void;
}

export const CalendarView = React.memo(function CalendarView({
  contentItems,
  phases,
  contentTypes,
  statusOptions,
  draggedItem,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CalendarViewProps) {
  const getContentTypeInfo = (typeId: string) => {
    return contentTypes.find(t => t.id === typeId) || contentTypes[0];
  };

  const getStatusInfo = (statusId: string) => {
    return statusOptions.find(s => s.id === statusId) || statusOptions[0];
  };

  const getPhaseItems = (phaseId: string) => {
    return contentItems.filter(item => item.phase === phaseId);
  };

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span>Timeline showing all {contentItems.length} content items across {phases.length} phases. Drag items to move them.</span>
      </div>
      
      {/* Content Type Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {contentTypes.map(type => (
          <Badge key={type.id} variant="outline" className="gap-1">
            <div className={`w-2 h-2 rounded-full ${type.color}`} />
            {type.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-[1100px]">
          {/* Day Headers */}
          <div className="flex border-b pb-2 mb-2">
            <div className="w-24 flex-shrink-0 font-medium text-muted-foreground text-sm">Phase</div>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="flex-1 text-center font-medium text-sm text-muted-foreground">
                Day {day}
              </div>
            ))}
          </div>

          {/* Phase Rows */}
          {phases.map(phase => {
            const phaseItems = getPhaseItems(phase.id);
            
            return (
              <div key={phase.id} className="flex border-b last:border-0 py-2 min-h-[80px]">
                <div className="w-24 flex-shrink-0 flex items-center">
                  <Badge variant="outline" className="text-xs">
                    <div className={`w-2 h-2 rounded-full ${phase.color} mr-1`} />
                    {phase.shortLabel}
                  </Badge>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const dayItems = phaseItems.filter(item => item.day_number === day);
                  const isDropTarget = draggedItem && (draggedItem.phase !== phase.id || draggedItem.day_number !== day);
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex-1 px-1 flex flex-col gap-1 min-h-[60px] rounded transition-colors ${
                        isDropTarget ? "bg-primary/10 border-2 border-dashed border-primary/30" : ""
                      }`}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, phase.id, day)}
                    >
                      {dayItems.map(item => {
                        const typeInfo = getContentTypeInfo(item.content_type);
                        const statusInfo = getStatusInfo(item.status);
                        
                        return (
                          <TooltipProvider key={item.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={(e) => onDragStart(e, item)}
                                  onDragEnd={onDragEnd}
                                  onClick={() => onEdit(item)}
                                  className={`p-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${typeInfo.color} text-white flex flex-col gap-0.5 ${
                                    item.status === "completed" ? "opacity-60" : ""
                                  } ${draggedItem?.id === item.id ? "opacity-50 scale-95" : ""}`}
                                >
                                  <div className="flex items-center gap-1">
                                    <typeInfo.icon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate font-medium">{typeInfo.label}</span>
                                    {item.status === "completed" && (
                                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 ml-auto" />
                                    )}
                                  </div>
                                  <span className="text-[10px] opacity-80 capitalize">{item.time_of_day}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                                    <span className={statusInfo.color}>{statusInfo.label}</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {dayItems.length === 0 && (
                        <div className={`h-full min-h-[40px] rounded border border-dashed ${
                          isDropTarget ? "border-primary/50" : "border-muted-foreground/20"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
});

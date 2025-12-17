import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface LabelConfig {
  id: string;
  color: string;
}

interface ListViewProps {
  contentItems: ContentItem[];
  expandedPhases: string[];
  selectedItems: string[];
  phases: Phase[];
  contentTypes: ContentType[];
  statusOptions: StatusOption[];
  labels: LabelConfig[];
  onTogglePhase: (phaseId: string) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onAddNew: (phase: string) => void;
  onToggleItemSelection: (id: string) => void;
  onSelectAllInPhase: (phaseId: string) => void;
}

export const ListView = React.memo(function ListView({
  contentItems,
  expandedPhases,
  selectedItems,
  phases,
  contentTypes,
  statusOptions,
  labels,
  onTogglePhase,
  onEdit,
  onDelete,
  onAddNew,
  onToggleItemSelection,
  onSelectAllInPhase,
}: ListViewProps) {
  const getContentTypeInfo = (typeId: string) => {
    return contentTypes.find(t => t.id === typeId) || contentTypes[0];
  };

  const getStatusInfo = (statusId: string) => {
    return statusOptions.find(s => s.id === statusId) || statusOptions[0];
  };

  const getPhaseItems = (phaseId: string) => {
    return contentItems.filter(item => item.phase === phaseId);
  };

  const getCompletionPercentage = (phaseId: string) => {
    const items = getPhaseItems(phaseId);
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.status === "completed").length;
    return Math.round((completed / items.length) * 100);
  };

  return (
    <div className="space-y-3">
      {phases.map((phase) => {
        const isExpanded = expandedPhases.includes(phase.id);
        const phaseItems = getPhaseItems(phase.id);
        const completionPercent = getCompletionPercentage(phase.id);
        const phaseIds = phaseItems.map(item => item.id);
        const allSelected = phaseIds.length > 0 && phaseIds.every(id => selectedItems.includes(id));

        return (
          <Card key={phase.id} variant="elevated">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onTogglePhase(phase.id)}
            >
              <div className="flex items-center gap-3">
                {selectedItems.length > 0 && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => onSelectAllInPhase(phase.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                <div>
                  <h3 className="font-semibold text-foreground">{phase.label}</h3>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{phaseItems.length} items</p>
                  <p className="text-xs text-muted-foreground">{completionPercent}% complete</p>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    {phaseItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">No content for this phase</p>
                        <Button size="sm" variant="outline" onClick={() => onAddNew(phase.id)}>
                          <Plus className="w-4 h-4" />
                          Add Content
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Group by day */}
                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                          const dayItems = phaseItems.filter(item => item.day_number === day);
                          if (dayItems.length === 0) return null;

                          return (
                            <div key={day} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2">
                                <span>Day {day}</span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                              {dayItems.map(item => {
                                const typeInfo = getContentTypeInfo(item.content_type);
                                const statusInfo = getStatusInfo(item.status);
                                const StatusIcon = statusInfo.icon;
                                const isSelected = selectedItems.includes(item.id);

                                return (
                                  <div
                                    key={item.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group ${
                                      isSelected ? "ring-2 ring-primary" : ""
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => onToggleItemSelection(item.id)}
                                    />
                                    <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                                      <typeInfo.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-muted-foreground capitalize">
                                              {item.time_of_day}
                                            </span>
                                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                          </div>
                                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                                            {item.title}
                                          </h4>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => onDelete(item.id)}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      {item.labels && item.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {item.labels.map(label => {
                                            const labelInfo = labels.find(l => l.id === label);
                                            return (
                                              <Badge
                                                key={label}
                                                variant="outline"
                                                className={`text-xs ${labelInfo?.color || ""}`}
                                              >
                                                {label}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => onAddNew(phase.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to {phase.label}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
});

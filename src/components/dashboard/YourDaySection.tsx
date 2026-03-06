import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, isToday, isPast, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { CheckCircle2, Circle, Calendar, Clock, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface YourDaySectionProps {
  projectId: string;
}

export const YourDaySection = ({ projectId }: YourDaySectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plannerTasks = [] } = useQuery({
    queryKey: ["planner-tasks-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_scope", "planner")
        .order("due_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: contentCount = 0 } = useQuery({
    queryKey: ["content-shipping-count", projectId],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const { count, error } = await supabase
        .from("content_planner")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", weekStart.toISOString())
        .lte("scheduled_at", weekEnd.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
  });

  const todayTasks = plannerTasks.filter(
    (t: any) => t.due_at && isToday(parseISO(t.due_at)) && t.column_id !== "done"
  );
  const overdueTasks = plannerTasks.filter(
    (t: any) => t.due_at && isPast(parseISO(t.due_at)) && !isToday(parseISO(t.due_at)) && t.column_id !== "done"
  );
  const scheduledNext = plannerTasks.filter(
    (t: any) => t.start_at && parseISO(t.start_at) >= new Date()
  ).slice(0, 3);

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    await supabase.from("tasks").update({ column_id: newStatus } as any).eq("id", taskId);
    queryClient.invalidateQueries({ queryKey: ["planner-tasks-dashboard"] });
  };

  const dueCount = todayTasks.length + overdueTasks.length;
  const topPriorities = todayTasks.slice(0, 3);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Day</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Top Priorities */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Top Priorities
          </h4>
          {topPriorities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks due today</p>
          ) : (
            <div className="space-y-2">
              {topPriorities.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2">
                  <button onClick={() => handleToggle(task.id, task.column_id)} className="shrink-0">
                    <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                  <span className="text-sm truncate">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Due Today */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            Due Today
          </h4>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", dueCount > 0 ? "text-foreground" : "text-muted-foreground")}>{dueCount}</span>
            <span className="text-xs text-muted-foreground">
              {overdueTasks.length > 0 && <span className="text-destructive">{overdueTasks.length} overdue</span>}
            </span>
          </div>
          {dueCount > 0 && (
            <Link to="/planner" className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Scheduled */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            Scheduled
          </h4>
          {scheduledNext.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-1.5">
              {scheduledNext.map((task: any) => (
                <div key={task.id} className="text-xs">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-muted-foreground ml-1">
                    {format(parseISO(task.start_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/planner" className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
            Open Calendar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Content Shipping */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Send className="w-4 h-4 text-primary" />
            Content Shipping
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{contentCount}</span>
            <span className="text-xs text-muted-foreground">posts this week</span>
          </div>
          <Link to={`/projects/${projectId}/content`} className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
            Social Planner <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

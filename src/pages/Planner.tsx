import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Search, ChevronDown, List, CalendarDays, Columns3 } from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlannerListView } from "@/components/planner/PlannerListView";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerBoardView } from "@/components/planner/PlannerBoardView";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";

const Planner = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [defaultTaskType, setDefaultTaskType] = useState<"task" | "event">("task");

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching planner tasks:", error);
      toast.error("Failed to load planner tasks");
    } else {
      setTasks((data as unknown as PlannerTask[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (data: Partial<PlannerTask>) => {
    if (!user) return;

    // Get a project_id - use stored one
    let projectId: string | null = null;
    try {
      const stored = localStorage.getItem("lastProjectInfo");
      if (stored) projectId = JSON.parse(stored).id;
    } catch {}

    if (!projectId) {
      // Fetch first project
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      projectId = projects?.[0]?.id || null;
    }

    if (!projectId) {
      toast.error("No project found. Create a project first.");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title!,
      description: data.description || null,
      column_id: data.column_id || "todo",
      task_origin: "user",
      task_scope: "planner",
      task_type: data.task_type || "task",
      category: data.category || "business",
      due_at: data.due_at || null,
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      location: data.location || null,
      position: 0,
    } as any);

    if (error) {
      console.error("Error creating planner task:", error);
      toast.error("Failed to create task");
      return;
    }

    toast.success("Task created");
    fetchTasks();
  };

  const handleUpdateTask = async (data: Partial<PlannerTask>) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        column_id: data.column_id || "todo",
        task_type: data.task_type || "task",
        category: data.category || "business",
        due_at: data.due_at || null,
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        location: data.location || null,
      } as any)
      .eq("id", editingTask.id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return;
    }

    toast.success("Task updated");
    setEditingTask(null);
    fetchTasks();
  };

  const handleToggleComplete = async (task: PlannerTask) => {
    const newStatus = task.column_id === "done" ? "todo" : "done";
    const { error } = await supabase
      .from("tasks")
      .update({ column_id: newStatus } as any)
      .eq("id", task.id);

    if (error) {
      toast.error("Failed to update task");
      return;
    }
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    toast.success("Task deleted");
    fetchTasks();
  };

  const handleEditTask = (task: PlannerTask) => {
    setEditingTask(task);
    setDefaultTaskType(task.task_type as "task" | "event" || "task");
    setDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <ProjectLayout>
      <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">Planner</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9 pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditingTask(null); setDefaultTaskType("task"); setDialogOpen(true); }}>
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditingTask(null); setDefaultTaskType("event"); setDialogOpen(true); }}>
                    Add Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* View Tabs */}
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="gap-1.5">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5">
                <Columns3 className="w-4 h-4" />
                Board
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <PlannerListView
                tasks={filteredTasks}
                isLoading={isLoading}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <PlannerCalendarView
                tasks={filteredTasks}
                onEditTask={handleEditTask}
              />
            </TabsContent>

            <TabsContent value="board">
              <PlannerBoardView
                tasks={filteredTasks}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusChange={async (taskId, newStatus) => {
                  const { error } = await supabase
                    .from("tasks")
                    .update({ column_id: newStatus } as any)
                    .eq("id", taskId);
                  if (!error) fetchTasks();
                }}
              />
            </TabsContent>
          </Tabs>
      </div>

      <PlannerTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editTask={editingTask}
        defaultTaskType={defaultTaskType}
      />
    </ProjectLayout>
  );
};

export default Planner;

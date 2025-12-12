import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import {
  FolderKanban,
  Calendar,
  CheckSquare,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  project_type: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  column_id: string;
  project_id: string;
  projects?: { name: string } | null;
}

interface LaunchEvent {
  id: string;
  title: string;
  enrollment_opens: string | null;
  prelaunch_start: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState(0);
  const [tasksDue, setTasksDue] = useState(0);
  const [upcomingLaunches, setUpcomingLaunches] = useState(0);
  const [contentPieces, setContentPieces] = useState(0);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Fetch all data in parallel
      const [projectsRes, tasksRes, launchEventsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, status, project_type, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("id, title, due_date, column_id, project_id, projects(name)")
          .neq("column_id", "done")
          .order("due_date", { ascending: true }),
        supabase
          .from("launch_events")
          .select("id, title, enrollment_opens, prelaunch_start")
          .gte("enrollment_opens", new Date().toISOString().split("T")[0]),
      ]);

      // Process projects
      if (projectsRes.data) {
        const active = projectsRes.data.filter((p) => p.status === "active").length;
        setActiveProjects(active);
        setRecentProjects(projectsRes.data.slice(0, 5));
      }

      // Process tasks
      if (tasksRes.data) {
        const today = startOfDay(new Date());
        const dueTasks = tasksRes.data.filter((t) => {
          if (!t.due_date) return false;
          const dueDate = startOfDay(parseISO(t.due_date));
          return isBefore(dueDate, today) || isToday(parseISO(t.due_date));
        });
        setTasksDue(dueTasks.length);

        // Get upcoming tasks (next 5 with due dates)
        const upcoming = tasksRes.data
          .filter((t) => t.due_date)
          .slice(0, 5);
        setUpcomingTasks(upcoming as Task[]);

        // Content pieces (tasks with "Creative" or "Copy" or "Video" labels would be content)
        // For now, we'll count all tasks as a placeholder since we don't have a content table
        setContentPieces(tasksRes.data.length);
      }

      // Process launch events
      if (launchEventsRes.data) {
        setUpcomingLaunches(launchEventsRes.data.length);
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const stats = [
    { icon: FolderKanban, label: "Active Projects", value: activeProjects.toString(), color: "primary" },
    { icon: CheckSquare, label: "Tasks Due", value: tasksDue.toString(), color: "secondary" },
    { icon: Calendar, label: "Upcoming Launches", value: upcomingLaunches.toString(), color: "warning" },
    { icon: FileText, label: "Content Pieces", value: contentPieces.toString(), color: "info" },
  ];

  const getTaskDueStatus = (dueDate: string) => {
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    if (isBefore(due, today)) return "overdue";
    if (isToday(parseISO(dueDate))) return "today";
    return "upcoming";
  };

  const statusVariants: Record<string, { label: string; className: string }> = {
    planning: { label: "Planning", className: "text-warning border-warning" },
    active: { label: "Active", className: "text-success border-success" },
    completed: { label: "Completed", className: "text-muted-foreground border-muted" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your launches.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/projects">
              <Plus className="w-5 h-5" />
              New Project
            </Link>
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="elevated" className="hover:shadow-xl transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stat.color === "primary" ? "bg-primary/10 text-primary" :
                      stat.color === "secondary" ? "bg-secondary/10 text-secondary" :
                      stat.color === "warning" ? "bg-warning/10 text-warning" :
                      "bg-info/10 text-info"
                    }`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/projects">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FolderKanban className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Create your first project to start planning your launch.
                    </p>
                    <Button asChild>
                      <Link to="/projects">
                        <Plus className="w-4 h-4" />
                        Create Project
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated {format(parseISO(project.updated_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={statusVariants[project.status]?.className}>
                            {statusVariants[project.status]?.label || project.status}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {project.project_type === 'prelaunch' ? 'Pre-Launch' : 'Launch'}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : upcomingTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <CheckSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No tasks scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => {
                      const dueStatus = task.due_date ? getTaskDueStatus(task.due_date) : null;
                      return (
                        <Link
                          key={task.id}
                          to={`/projects/${task.project_id}`}
                          className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                          <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground truncate">
                              {task.projects?.name || "Unknown project"}
                            </p>
                            {task.due_date && (
                              <span className={`text-xs font-medium ${
                                dueStatus === "overdue" ? "text-destructive" :
                                dueStatus === "today" ? "text-warning" :
                                "text-muted-foreground"
                              }`}>
                                {format(parseISO(task.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="gradient-hero border-0">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="text-primary-foreground">
                    <h3 className="text-xl font-semibold">Ready to plan your next launch?</h3>
                    <p className="opacity-90">Create a project and let AI help you craft the perfect transformation statement.</p>
                  </div>
                </div>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/projects">
                    Get Started <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

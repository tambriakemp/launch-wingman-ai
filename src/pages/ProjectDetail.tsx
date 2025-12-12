import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Kanban,
  FileText,
  Settings,
  Plus,
  Loader2,
  ClipboardCheck,
  Rocket,
  MoreHorizontal,
  Pencil,
  Trash2,
  Gift,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransformationBuilder } from "@/components/TransformationBuilder";
import { LaunchCalendarEventDialog } from "@/components/LaunchCalendarEventDialog";
import { LaunchCalendarTimeline } from "@/components/LaunchCalendarTimeline";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { ProjectBoard } from "@/components/ProjectBoard";
import { ProjectSettingsDialog } from "@/components/ProjectSettingsDialog";
import { OfferBuilder } from "@/components/OfferBuilder";
import { MessagingBuilder } from "@/components/MessagingBuilder";
import { ContentPlanner } from "@/components/ContentPlanner";

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
  program_weeks?: number | null;
  rest_weeks?: number | null;
}

type ProjectStatus = "active" | "draft" | "archived";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  transformation_statement: string | null;
  project_type: "launch" | "prelaunch";
}

const statusVariants: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "text-success border-success" },
  draft: { label: "Draft", className: "text-warning border-warning" },
  archived: { label: "Archived", className: "text-muted-foreground border-muted" },
  planning: { label: "Active", className: "text-success border-success" }, // Legacy fallback
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [launchEvents, setLaunchEvents] = useState<LaunchEvent[]>([]);
  
  // Edit and delete state
  const [editingEvent, setEditingEvent] = useState<LaunchEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<LaunchEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLaunchEvents = useCallback(async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from("launch_events")
      .select("id, title, event_type, content_creation_start, prelaunch_start, enrollment_opens, enrollment_closes, program_delivery_start, program_delivery_end, rest_period_start, rest_period_end, program_weeks, rest_weeks")
      .eq("project_id", id)
      .order("prelaunch_start", { ascending: true });
    
    if (error) {
      console.error("Error fetching launch events:", error);
    } else {
      setLaunchEvents(data || []);
    }
  }, [id]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status, transformation_statement, project_type")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load project");
        console.error(error);
        navigate("/projects");
      } else if (!data) {
        toast.error("Project not found");
        navigate("/projects");
      } else {
        setProject(data as Project);
      }
      setIsLoading(false);
    };

    fetchProject();
    fetchLaunchEvents();
  }, [id, navigate, fetchLaunchEvents]);

  const handleStatementSaved = (statement: string) => {
    setProject((prev) => prev ? { ...prev, transformation_statement: statement } : null);
  };

  const handleProjectUpdated = (name: string, description: string | null, status: ProjectStatus) => {
    setProject((prev) => prev ? { ...prev, name, description, status } : null);
  };

  const handleEditEvent = (event: LaunchEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (event: LaunchEvent) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    
    const { error } = await supabase
      .from("launch_events")
      .delete()
      .eq("id", eventToDelete.id);

    if (error) {
      toast.error("Failed to delete event");
      console.error(error);
    } else {
      toast.success("Event deleted");
      fetchLaunchEvents();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = statusVariants[project.status];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <Badge variant="outline" className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {project.project_type === 'prelaunch' ? 'Pre-Launch' : 'Launch'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {project.description || "Manage your launch calendar, tasks, and content."}
              </p>
            </div>
            <ProjectSettingsDialog
              projectId={project.id}
              projectName={project.name}
              projectDescription={project.description}
              projectStatus={project.status}
              onProjectUpdated={handleProjectUpdated}
              trigger={
                <Button variant="outline">
                  <Settings className="w-4 h-4" />
                  Project Settings
                </Button>
              }
            />
          </div>
        </motion.div>

        {/* Transformation Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Transformation Statement</CardTitle>
                    <CardDescription>AI-generated statement for your launch</CardDescription>
                  </div>
                </div>
                <TransformationBuilder
                  projectId={project.id}
                  currentStatement={project.transformation_statement}
                  onStatementSaved={handleStatementSaved}
                />
              </div>
            </CardHeader>
            {project.transformation_statement && (
              <CardContent>
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-lg text-foreground italic">"{project.transformation_statement}"</p>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="offers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
              <TabsTrigger value="offers" className="gap-2">
                <Gift className="w-4 h-4" />
                Offer Builder
              </TabsTrigger>
              <TabsTrigger value="messaging" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Messaging
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban className="w-4 h-4" />
                Project Board
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="assessment" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers">
              <div className="space-y-6">
                {/* Launch Calendar Summary */}
                {launchEvents.length > 0 && (
                  <Card variant="elevated">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{project.project_type === 'prelaunch' ? 'Pre-Launch' : 'Launch'} Timeline</CardTitle>
                            <CardDescription>{launchEvents[0]?.title}</CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditEvent(launchEvents[0])}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Dates
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {launchEvents[0]?.prelaunch_start && (
                          <div className="p-3 rounded-lg bg-accent/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Rocket className="w-4 h-4" />
                              <span className="text-xs font-medium">Prelaunch Starts</span>
                            </div>
                            <p className="font-semibold text-foreground">{format(parseISO(launchEvents[0].prelaunch_start), "MMM d, yyyy")}</p>
                          </div>
                        )}
                        {launchEvents[0]?.enrollment_opens && (
                          <div className="p-3 rounded-lg bg-accent/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Rocket className="w-4 h-4" />
                              <span className="text-xs font-medium">Enrollment Opens</span>
                            </div>
                            <p className="font-semibold text-foreground">{format(parseISO(launchEvents[0].enrollment_opens), "MMM d, yyyy")}</p>
                          </div>
                        )}
                        {launchEvents[0]?.enrollment_closes && (
                          <div className="p-3 rounded-lg bg-accent/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-medium">Enrollment Closes</span>
                            </div>
                            <p className="font-semibold text-foreground">{format(parseISO(launchEvents[0].enrollment_closes), "MMM d, yyyy")}</p>
                          </div>
                        )}
                        {launchEvents[0]?.program_delivery_start && (
                          <div className="p-3 rounded-lg bg-accent/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <FileText className="w-4 h-4" />
                              <span className="text-xs font-medium">Program Starts</span>
                            </div>
                            <p className="font-semibold text-foreground">{format(parseISO(launchEvents[0].program_delivery_start), "MMM d, yyyy")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card variant="elevated" className="min-h-[400px]">
                  <CardHeader>
                    <div>
                      <CardTitle>Offer Builder</CardTitle>
                      <CardDescription>Design offers that attract and convert your ideal clients</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <OfferBuilder projectId={project.id} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messaging">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader>
                  <div>
                    <CardTitle>Messaging</CardTitle>
                    <CardDescription>Build copy for your sales pages, emails, and social media</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <MessagingBuilder projectId={project.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader>
                  <div>
                    <CardTitle>Project Board</CardTitle>
                    <CardDescription>Manage tasks with due dates</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProjectBoard projectId={project.id} projectType={project.project_type} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader>
                  <div>
                    <CardTitle>Content Planner</CardTitle>
                    <CardDescription>Plan your pre-launch and launch content based on proven strategies</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ContentPlanner projectId={project.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assessment Quizzes</CardTitle>
                    <CardDescription>Create quizzes with scoring to assess your audience</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Create Quiz
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes created</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Create assessment quizzes with scoring to evaluate your audience's readiness for your program.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4" />
                      Create Your First Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <LaunchCalendarEventDialog
          projectId={project.id}
          projectType={project.project_type}
          editEvent={editingEvent}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingEvent(null);
          }}
          onEventAdded={fetchLaunchEvents}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Launch Event"
        description={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
};

export default ProjectDetail;

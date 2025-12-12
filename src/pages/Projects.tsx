import { useState, useEffect } from "react";
import { format, addWeeks, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  FolderKanban,
  Calendar as CalendarIcon,
  MoreVertical,
  Sparkles,
  ArrowRight,
  Loader2,
  Trash2,
  Archive,
  RotateCcw,
  Crown,
  Rocket,
  Clock,
  Coffee,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ProjectStatus = "active" | "draft" | "archived";

interface LaunchEvent {
  prelaunch_start: string | null;
  enrollment_opens: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  launch_date: string | null;
  status: ProjectStatus;
  project_type: "launch" | "prelaunch";
  launch_events: LaunchEvent[];
}

interface LaunchDates {
  prelaunchStart: Date | undefined;
  contentCreationStart: Date | undefined;
  enrollmentOpens: Date | undefined;
  enrollmentCloses: Date | undefined;
  programDeliveryStart: Date | undefined;
  programDeliveryEnd: Date | undefined;
  restPeriodStart: Date | undefined;
  restPeriodEnd: Date | undefined;
}

const statusColors: Record<ProjectStatus, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-warning/10 text-warning",
  archived: "bg-muted text-muted-foreground",
};

const DEFAULT_PROGRAM_WEEKS = 8;
const DEFAULT_REST_WEEKS = 2;
const PRELAUNCH_WEEKS = 7;
const CONTENT_CREATION_WEEKS = 2;

const Projects = () => {
  const { user, isSubscribed } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newProject, setNewProject] = useState({ name: "", description: "", eventType: "launch" as "launch" | "prelaunch" });
  
  // Launch calendar state for project creation
  const [programWeeks, setProgramWeeks] = useState(DEFAULT_PROGRAM_WEEKS);
  const [restWeeks, setRestWeeks] = useState(DEFAULT_REST_WEEKS);
  const [dates, setDates] = useState<LaunchDates>({
    prelaunchStart: undefined,
    contentCreationStart: undefined,
    enrollmentOpens: undefined,
    enrollmentCloses: undefined,
    programDeliveryStart: undefined,
    programDeliveryEnd: undefined,
    restPeriodStart: undefined,
    restPeriodEnd: undefined,
  });
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Archive sheet state
  const [archiveSheetOpen, setArchiveSheetOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, launch_date, status, project_type, launch_events(prelaunch_start, enrollment_opens)")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load projects");
        console.error(error);
      } else {
        setProjects(data as Project[]);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [user]);

  const activeProjectCount = projects.filter((p) => p.status !== "archived").length;
  const canCreateProject = isSubscribed || activeProjectCount < 1;

  const calculateDatesFromPrelaunch = (prelaunch: Date, weeks: number, rest: number) => {
    const contentCreation = subWeeks(prelaunch, CONTENT_CREATION_WEEKS);
    const enrollmentOpen = addWeeks(prelaunch, PRELAUNCH_WEEKS);
    const enrollmentClose = addWeeks(enrollmentOpen, 1);
    const programStart = enrollmentClose;
    const programEnd = addWeeks(programStart, weeks);
    const restStart = programEnd;
    const restEnd = addWeeks(restStart, rest);

    return {
      contentCreationStart: contentCreation,
      enrollmentOpens: enrollmentOpen,
      enrollmentCloses: enrollmentClose,
      programDeliveryStart: programStart,
      programDeliveryEnd: programEnd,
      restPeriodStart: restStart,
      restPeriodEnd: restEnd,
    };
  };

  const handlePrelaunchDateChange = (date: Date | undefined) => {
    if (date) {
      const calculatedDates = calculateDatesFromPrelaunch(date, programWeeks, restWeeks);
      setDates({
        prelaunchStart: date,
        ...calculatedDates,
      });
    } else {
      setDates({
        prelaunchStart: undefined,
        contentCreationStart: undefined,
        enrollmentOpens: undefined,
        enrollmentCloses: undefined,
        programDeliveryStart: undefined,
        programDeliveryEnd: undefined,
        restPeriodStart: undefined,
        restPeriodEnd: undefined,
      });
    }
  };

  const recalculateDates = () => {
    if (dates.prelaunchStart) {
      const calculatedDates = calculateDatesFromPrelaunch(dates.prelaunchStart, programWeeks, restWeeks);
      setDates({
        prelaunchStart: dates.prelaunchStart,
        ...calculatedDates,
      });
    }
  };

  const resetCreateDialog = () => {
    setCreateStep(1);
    setNewProject({ name: "", description: "", eventType: "launch" });
    setProgramWeeks(DEFAULT_PROGRAM_WEEKS);
    setRestWeeks(DEFAULT_REST_WEEKS);
    setDates({
      prelaunchStart: undefined,
      contentCreationStart: undefined,
      enrollmentOpens: undefined,
      enrollmentCloses: undefined,
      programDeliveryStart: undefined,
      programDeliveryEnd: undefined,
      restPeriodStart: undefined,
      restPeriodEnd: undefined,
    });
  };

  const handleStep1Next = () => {
    if (!newProject.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    setCreateStep(2);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!dates.prelaunchStart) {
      toast.error("Please select a prelaunch start date");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a project");
      return;
    }

    if (!canCreateProject) {
      toast.error("Free plan is limited to 1 project. Upgrade to Pro for unlimited projects.");
      return;
    }

    setIsCreating(true);

    try {
      // Create project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          user_id: user.id,
          status: "active",
          project_type: newProject.eventType,
        })
        .select("id, name, description, launch_date, status, project_type")
        .single();

      if (projectError) {
        toast.error("Failed to create project");
        console.error(projectError);
        setIsCreating(false);
        return;
      }

      // Create launch event
      const eventData = {
        title: newProject.name.trim(),
        event_type: newProject.eventType,
        project_id: projectData.id,
        user_id: user.id,
        prelaunch_start: dates.prelaunchStart?.toISOString().split('T')[0],
        content_creation_start: dates.contentCreationStart?.toISOString().split('T')[0],
        enrollment_opens: newProject.eventType === 'launch' ? dates.enrollmentOpens?.toISOString().split('T')[0] : null,
        enrollment_closes: newProject.eventType === 'launch' ? dates.enrollmentCloses?.toISOString().split('T')[0] : null,
        program_delivery_start: newProject.eventType === 'launch' ? dates.programDeliveryStart?.toISOString().split('T')[0] : null,
        program_delivery_end: newProject.eventType === 'launch' ? dates.programDeliveryEnd?.toISOString().split('T')[0] : null,
        rest_period_start: newProject.eventType === 'launch' ? dates.restPeriodStart?.toISOString().split('T')[0] : null,
        rest_period_end: newProject.eventType === 'launch' ? dates.restPeriodEnd?.toISOString().split('T')[0] : null,
        program_weeks: newProject.eventType === 'launch' ? programWeeks : null,
        rest_weeks: newProject.eventType === 'launch' ? restWeeks : null,
      };

      const { error: eventError } = await supabase
        .from("launch_events")
        .insert(eventData);

      if (eventError) {
        console.error("Failed to create launch event:", eventError);
        // Still show success since project was created
      }

      // Refetch projects to get launch_events
      const { data: updatedProject } = await supabase
        .from("projects")
        .select("id, name, description, launch_date, status, project_type, launch_events(prelaunch_start, enrollment_opens)")
        .eq("id", projectData.id)
        .single();

      if (updatedProject) {
        setProjects([updatedProject as Project, ...projects]);
      }

      resetCreateDialog();
      setIsCreateOpen(false);
      toast.success("Project created successfully!");
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Failed to create project");
    }

    setIsCreating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmText.toLowerCase() !== "delete") {
      toast.error("Please type 'delete' to confirm");
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    if (error) {
      toast.error("Failed to delete project");
      console.error(error);
    } else {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }

    setIsDeleting(false);
  };

  const handleUpdateStatus = async (projectId: string, newStatus: ProjectStatus) => {
    setIsUpdatingStatus(projectId);

    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to update project status");
      console.error(error);
    } else {
      setProjects(projects.map((p) => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ));
      toast.success(`Project ${newStatus === "archived" ? "archived" : "restored"}`);
    }

    setIsUpdatingStatus(null);
  };

  const activeProjects = projects.filter((p) => p.status !== "archived");
  const archivedProjects = projects.filter((p) => p.status === "archived");

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Projects</h1>
              {!isSubscribed && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {activeProjectCount}/1
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Manage your launch projects and programs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {archivedProjects.length > 0 && (
              <Sheet open={archiveSheetOpen} onOpenChange={setArchiveSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Archive className="w-4 h-4" />
                    Archived ({archivedProjects.length})
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Archived Projects</SheetTitle>
                    <SheetDescription>
                      View and restore your archived projects.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    {archivedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isUpdatingStatus === project.id}>
                              {isUpdatingStatus === project.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                              Restore
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, "active")}>
                              Set as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(project.id, "draft")}>
                              Set as Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            {canCreateProject ? (
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) resetCreateDialog();
              }}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="w-5 h-5" />
                    New Project
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {createStep === 1 ? "Create New Project" : "Plan Your Launch"}
                  </DialogTitle>
                  <DialogDescription>
                    {createStep === 1 
                      ? "Start a new launch project for your program or membership."
                      : "Enter your prelaunch start date. We'll suggest dates for everything else."}
                  </DialogDescription>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                      createStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      1
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      createStep >= 1 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Details
                    </span>
                  </div>
                  <div className={cn(
                    "w-8 h-0.5 transition-colors",
                    createStep >= 2 ? "bg-primary" : "bg-muted"
                  )} />
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                      createStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      2
                    </div>
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      createStep >= 2 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Timeline
                    </span>
                  </div>
                </div>

                {createStep === 1 ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Spring Launch 2024"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your launch..."
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Project Type</Label>
                      <Select 
                        value={newProject.eventType} 
                        onValueChange={(value: "launch" | "prelaunch") => setNewProject({ ...newProject, eventType: value })}
                      >
                        <SelectTrigger id="eventType" className="bg-background">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="launch">Launch</SelectItem>
                          <SelectItem value="prelaunch">Prelaunch</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {newProject.eventType === "launch" 
                          ? "A full launch includes prelaunch, enrollment, and delivery phases."
                          : "A prelaunch focuses on warming up your audience before opening enrollment."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Prelaunch Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dates.prelaunchStart && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dates.prelaunchStart ? format(dates.prelaunchStart, "PPP") : "Pick your prelaunch start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={dates.prelaunchStart}
                            onSelect={handlePrelaunchDateChange}
                            defaultMonth={dates.prelaunchStart}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        This is when you'll start building relationships and warming up your audience (6-8 weeks before enrollment opens).
                      </p>
                    </div>

                    {dates.prelaunchStart && newProject.eventType === 'launch' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="programWeeks">Program Length (weeks)</Label>
                          <Input
                            id="programWeeks"
                            type="number"
                            min="1"
                            max="52"
                            value={programWeeks}
                            onChange={(e) => setProgramWeeks(parseInt(e.target.value) || DEFAULT_PROGRAM_WEEKS)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="restWeeks">Rest Period (weeks)</Label>
                          <Input
                            id="restWeeks"
                            type="number"
                            min="1"
                            max="12"
                            value={restWeeks}
                            onChange={(e) => setRestWeeks(parseInt(e.target.value) || DEFAULT_REST_WEEKS)}
                          />
                        </div>
                      </div>
                    )}

                    {dates.prelaunchStart && newProject.eventType === 'launch' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={recalculateDates}
                        className="w-full"
                        type="button"
                      >
                        Recalculate All Dates
                      </Button>
                    )}

                    {dates.prelaunchStart && (
                      <div className="space-y-4">
                        <span className="text-sm font-semibold">Suggested Timeline</span>
                        <div className="rounded-lg border bg-card px-3">
                          <div className="flex items-start gap-3 py-3 border-b border-border/50">
                            <div className="mt-1 text-muted-foreground"><Sparkles className="w-4 h-4" /></div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium">Content Creation Starts</Label>
                              <p className="text-xs text-muted-foreground">2 weeks before prelaunch</p>
                            </div>
                            <span className="text-sm font-medium">{dates.contentCreationStart ? format(dates.contentCreationStart, "MMM d, yyyy") : "-"}</span>
                          </div>
                          <div className="flex items-start gap-3 py-3 border-b border-border/50">
                            <div className="mt-1 text-muted-foreground"><Rocket className="w-4 h-4" /></div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium">Prelaunch Starts</Label>
                              <p className="text-xs text-muted-foreground">Your selected start date</p>
                            </div>
                            <span className="text-sm font-medium">{dates.prelaunchStart ? format(dates.prelaunchStart, "MMM d, yyyy") : "-"}</span>
                          </div>
                          {newProject.eventType === 'launch' && (
                            <>
                              <div className="flex items-start gap-3 py-3 border-b border-border/50">
                                <div className="mt-1 text-muted-foreground"><Rocket className="w-4 h-4" /></div>
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">Enrollment Opens</Label>
                                  <p className="text-xs text-muted-foreground">~7 weeks after prelaunch</p>
                                </div>
                                <span className="text-sm font-medium">{dates.enrollmentOpens ? format(dates.enrollmentOpens, "MMM d, yyyy") : "-"}</span>
                              </div>
                              <div className="flex items-start gap-3 py-3 border-b border-border/50">
                                <div className="mt-1 text-muted-foreground"><Clock className="w-4 h-4" /></div>
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">Enrollment Closes</Label>
                                  <p className="text-xs text-muted-foreground">1 week enrollment window</p>
                                </div>
                                <span className="text-sm font-medium">{dates.enrollmentCloses ? format(dates.enrollmentCloses, "MMM d, yyyy") : "-"}</span>
                              </div>
                              <div className="flex items-start gap-3 py-3 border-b border-border/50">
                                <div className="mt-1 text-muted-foreground"><Package className="w-4 h-4" /></div>
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">Program Delivery</Label>
                                  <p className="text-xs text-muted-foreground">{programWeeks} week program</p>
                                </div>
                                <span className="text-sm font-medium">
                                  {dates.programDeliveryStart ? format(dates.programDeliveryStart, "MMM d") : "-"} - {dates.programDeliveryEnd ? format(dates.programDeliveryEnd, "MMM d, yyyy") : "-"}
                                </span>
                              </div>
                              <div className="flex items-start gap-3 py-3">
                                <div className="mt-1 text-muted-foreground"><Coffee className="w-4 h-4" /></div>
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">Rest Period</Label>
                                  <p className="text-xs text-muted-foreground">{restWeeks} week rest</p>
                                </div>
                                <span className="text-sm font-medium">
                                  {dates.restPeriodStart ? format(dates.restPeriodStart, "MMM d") : "-"} - {dates.restPeriodEnd ? format(dates.restPeriodEnd, "MMM d, yyyy") : "-"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="bg-accent/50 rounded-lg p-3 text-sm">
                          <p className="font-medium mb-1">Hot Launch Windows:</p>
                          <ul className="text-muted-foreground space-y-1 text-xs">
                            <li>• <strong>January - February:</strong> New year energy</li>
                            <li>• <strong>September - October:</strong> Back-to-school energy</li>
                          </ul>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Avoid: July-August (summer) and Late Nov-Dec (holidays)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  {createStep === 1 ? (
                    <>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleStep1Next}>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setCreateStep(1)}>
                        Back
                      </Button>
                      <Button onClick={handleCreateProject} disabled={isCreating || !dates.prelaunchStart}>
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        Create Project
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            ) : (
              <Button 
                size="lg" 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('create-checkout');
                    if (error) throw error;
                    if (data?.url) {
                      window.open(data.url, '_blank');
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    toast.error("Failed to start checkout. Please try again.");
                  }
                }}
              >
                <Crown className="w-5 h-5" />
                Upgrade to Add More
              </Button>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeProjects.length > 0 ? (
          /* Projects Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/projects/${project.id}`} className="h-full">
                  <Card variant="elevated" className="h-full hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColors[project.status]}`}>
                            {project.status}
                          </span>
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary capitalize">
                            {project.project_type === 'prelaunch' ? 'Pre-Launch' : 'Launch'}
                          </span>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              handleUpdateStatus(project.id, "archived");
                            }}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDeleteClick(e, project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {project.project_type === "prelaunch" 
                              ? (project.launch_events?.[0]?.prelaunch_start 
                                  ? `Pre-Launch: ${new Date(project.launch_events[0].prelaunch_start).toLocaleDateString()}`
                                  : "No pre-launch date")
                              : (project.launch_events?.[0]?.enrollment_opens 
                                  ? `Launch: ${new Date(project.launch_events[0].enrollment_opens).toLocaleDateString()}`
                                  : "No launch date")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="py-16">
              <CardContent className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FolderKanban className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {archivedProjects.length > 0 ? "No Active Projects" : "Create Your First Project"}
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  {archivedProjects.length > 0 
                    ? "All your projects are archived. Restore one or create a new project."
                    : "Start by creating a project for your upcoming launch. Each project includes a calendar, kanban board, and content planner."}
                </p>
                <Button size="lg" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-5 h-5" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upgrade Banner for Free Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-dashed border-border bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Free Plan: 1 Active Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro for unlimited projects and advanced features.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('create-checkout');
                      if (error) throw error;
                      if (data?.url) {
                        window.open(data.url, '_blank');
                      }
                    } catch (error) {
                      console.error('Checkout error:', error);
                      toast.error("Failed to start checkout. Please try again.");
                    }
                  }}
                >
                  Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <span className="font-semibold">{projectToDelete?.name}</span>? 
                This action cannot be undone.
              </p>
              <p className="text-sm">
                Type <span className="font-mono font-semibold text-destructive">delete</span> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={deleteConfirmText.toLowerCase() !== "delete" || isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Project
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Projects;

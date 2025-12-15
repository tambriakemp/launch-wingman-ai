import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, Check, Loader2, CalendarIcon, Rocket, Clock, Coffee, Package, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addWeeks, subWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ProjectSelectorProps {
  currentProjectId?: string;
  onCreateNew?: () => void;
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

const DEFAULT_PROGRAM_WEEKS = 8;
const DEFAULT_REST_WEEKS = 2;
const PRELAUNCH_WEEKS = 7;
const CONTENT_CREATION_WEEKS = 2;

export const ProjectSelector = ({ currentProjectId, onCreateNew }: ProjectSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [projectName, setProjectName] = useState("");
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-selector", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, project_type")
        .neq("status", "archived")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  useEffect(() => {
    if (dates.prelaunchStart) {
      const calculatedDates = calculateDatesFromPrelaunch(dates.prelaunchStart, programWeeks, restWeeks);
      setDates(prev => ({
        ...prev,
        ...calculatedDates,
      }));
    }
  }, [dates.prelaunchStart, programWeeks, restWeeks]);

  const createProjectMutation = useMutation({
    mutationFn: async ({ name, launchDates }: { name: string; launchDates?: LaunchDates }) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Project name is required");
      if (trimmedName.length > 100) throw new Error("Project name must be less than 100 characters");

      // Create project
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: trimmedName,
          user_id: user!.id,
          status: "active",
          project_type: "launch",
        })
        .select()
        .single();

      if (error) throw error;

      // If launch dates provided, create launch event
      if (launchDates?.prelaunchStart) {
        const { error: eventError } = await supabase.from("launch_events").insert({
          title: trimmedName,
          event_type: "launch",
          project_id: project.id,
          user_id: user!.id,
          prelaunch_start: launchDates.prelaunchStart.toISOString().split('T')[0],
          content_creation_start: launchDates.contentCreationStart?.toISOString().split('T')[0],
          enrollment_opens: launchDates.enrollmentOpens?.toISOString().split('T')[0],
          enrollment_closes: launchDates.enrollmentCloses?.toISOString().split('T')[0],
          program_delivery_start: launchDates.programDeliveryStart?.toISOString().split('T')[0],
          program_delivery_end: launchDates.programDeliveryEnd?.toISOString().split('T')[0],
          rest_period_start: launchDates.restPeriodStart?.toISOString().split('T')[0],
          rest_period_end: launchDates.restPeriodEnd?.toISOString().split('T')[0],
          program_weeks: programWeeks,
          rest_weeks: restWeeks,
        });

        if (eventError) {
          console.error("Error creating launch event:", eventError);
          // Don't throw - project still created successfully
        }
      }

      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects-selector"] });
      resetDialog();
      navigate(`/projects/${data.id}/funnel-type`);
      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    },
  });

  const resetDialog = () => {
    setShowNameDialog(false);
    setProjectName("");
    setStep(1);
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
    setProgramWeeks(DEFAULT_PROGRAM_WEEKS);
    setRestWeeks(DEFAULT_REST_WEEKS);
  };

  const currentProject = projects?.find((p) => p.id === currentProjectId);

  const handleSelectProject = (projectId: string) => {
    setOpen(false);
    navigate(`/projects/${projectId}`);
  };

  const handleOpenCreateDialog = () => {
    setOpen(false);
    setProjectName("");
    setStep(1);
    setShowNameDialog(true);
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    createProjectMutation.mutate({ name: projectName, launchDates: dates });
  };

  const handleNextStep = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    setStep(2);
  };

  const handleSkipTimeline = () => {
    createProjectMutation.mutate({ name: projectName });
  };

  const getProjectInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-[#2a2a2a] border-0 hover:bg-[#333] text-white h-10 px-3"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-xs font-semibold text-accent-foreground">
                {currentProject ? getProjectInitial(currentProject.name) : "?"}
              </div>
              <span className="truncate font-medium text-sm">
                {isLoading ? "Loading..." : currentProject?.name || "Select project"}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-0 bg-[#1a1a1a] border-[#333] shadow-xl" 
          align="start"
          sideOffset={4}
        >
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search projects..." 
              className="h-9 border-0 bg-transparent text-white placeholder:text-gray-500 focus:ring-0"
            />
            <CommandList className="max-h-[280px]">
              <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                No projects found.
              </CommandEmpty>
              <CommandGroup heading="Your Projects" className="text-gray-400 text-xs px-2 py-1.5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                ) : (
                  projects?.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.name}
                      onSelect={() => handleSelectProject(project.id)}
                      className="flex items-center gap-2.5 cursor-pointer py-2 px-2 text-white hover:bg-[#2a2a2a] rounded-md mx-1 aria-selected:bg-[#2a2a2a]"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-xs font-semibold text-accent-foreground">
                        {getProjectInitial(project.name)}
                      </div>
                      <span className="truncate flex-1 text-sm">{project.name}</span>
                      {project.id === currentProjectId && (
                        <Check className="h-4 w-4 text-accent flex-shrink-0" />
                      )}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
              <CommandSeparator className="bg-[#333]" />
              <CommandGroup className="p-1">
                <CommandItem 
                  onSelect={handleOpenCreateDialog} 
                  className="cursor-pointer py-2 px-2 text-white hover:bg-[#2a2a2a] rounded-md mx-1 aria-selected:bg-[#2a2a2a]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-sm">New Project</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Project Dialog */}
      <Dialog open={showNameDialog} onOpenChange={(open) => {
        if (!open) resetDialog();
        else setShowNameDialog(true);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Create New Project" : "Set Launch Timeline"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 
                ? "Give your project a name to get started" 
                : "Set your prelaunch start date and we'll suggest the rest (optional)"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Spring Launch 2025"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={100}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && projectName.trim()) {
                      handleNextStep();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {projectName.length}/100 characters
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Prelaunch Start Date */}
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
                      onSelect={(date) => setDates(prev => ({ ...prev, prelaunchStart: date }))}
                      defaultMonth={dates.prelaunchStart}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  This is when you'll start building relationships (6-8 weeks before enrollment opens).
                </p>
              </div>

              {/* Program & Rest Weeks */}
              {dates.prelaunchStart && (
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

              {/* Suggested Timeline Preview - Editable */}
              {dates.prelaunchStart && (
                <div className="space-y-3">
                  <span className="text-sm font-semibold">Suggested Timeline <span className="text-muted-foreground font-normal">(click to edit)</span></span>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Sparkles className="w-3 h-3" />
                            Content Creation
                          </div>
                          <p className="font-medium">{dates.contentCreationStart ? format(dates.contentCreationStart, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.contentCreationStart}
                          onSelect={(date) => setDates(prev => ({ ...prev, contentCreationStart: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Rocket className="w-3 h-3" />
                            Prelaunch Starts
                          </div>
                          <p className="font-medium">{dates.prelaunchStart ? format(dates.prelaunchStart, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.prelaunchStart}
                          onSelect={(date) => setDates(prev => ({ ...prev, prelaunchStart: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Rocket className="w-3 h-3" />
                            Enrollment Opens
                          </div>
                          <p className="font-medium">{dates.enrollmentOpens ? format(dates.enrollmentOpens, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.enrollmentOpens}
                          onSelect={(date) => setDates(prev => ({ ...prev, enrollmentOpens: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Clock className="w-3 h-3" />
                            Enrollment Closes
                          </div>
                          <p className="font-medium">{dates.enrollmentCloses ? format(dates.enrollmentCloses, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.enrollmentCloses}
                          onSelect={(date) => setDates(prev => ({ ...prev, enrollmentCloses: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Package className="w-3 h-3" />
                            Program Starts
                          </div>
                          <p className="font-medium">{dates.programDeliveryStart ? format(dates.programDeliveryStart, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.programDeliveryStart}
                          onSelect={(date) => setDates(prev => ({ ...prev, programDeliveryStart: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-2 rounded bg-callout text-callout-foreground text-left hover:ring-2 hover:ring-callout-accent/50 transition-all">
                          <div className="flex items-center gap-1.5 text-callout-accent text-xs mb-0.5">
                            <Coffee className="w-3 h-3" />
                            Rest Starts
                          </div>
                          <p className="font-medium">{dates.restPeriodStart ? format(dates.restPeriodStart, "MMM d, yyyy") : "-"}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dates.restPeriodStart}
                          onSelect={(date) => setDates(prev => ({ ...prev, restPeriodStart: date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {step === 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowNameDialog(false)}
                  disabled={createProjectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!projectName.trim() || createProjectMutation.isPending}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={createProjectMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkipTimeline}
                  disabled={createProjectMutation.isPending}
                >
                  Skip
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

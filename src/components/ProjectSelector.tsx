import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const ProjectSelector = ({ currentProjectId, onCreateNew }: ProjectSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
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

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Project name is required");
      if (trimmedName.length > 100) throw new Error("Project name must be less than 100 characters");

      const { data, error } = await supabase
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects-selector"] });
      setShowNameDialog(false);
      setProjectName("");
      navigate(`/projects/${data.id}/funnel-type`);
      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    },
  });

  const currentProject = projects?.find((p) => p.id === currentProjectId);

  const handleSelectProject = (projectId: string) => {
    setOpen(false);
    navigate(`/projects/${projectId}`);
  };

  const handleOpenCreateDialog = () => {
    setOpen(false);
    setProjectName("");
    setShowNameDialog(true);
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    createProjectMutation.mutate(projectName);
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

      {/* Create Project Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name to get started
            </DialogDescription>
          </DialogHeader>
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
                    handleCreateProject();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {projectName.length}/100 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNameDialog(false)}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || createProjectMutation.isPending}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

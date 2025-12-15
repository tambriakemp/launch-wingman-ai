import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, Check, FolderKanban, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

interface ProjectSelectorProps {
  currentProjectId?: string;
  onCreateNew?: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  draft: "bg-warning/10 text-warning",
  archived: "bg-muted text-muted-foreground",
};

export const ProjectSelector = ({ currentProjectId, onCreateNew }: ProjectSelectorProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const currentProject = projects?.find((p) => p.id === currentProjectId);

  const handleSelectProject = (projectId: string) => {
    setOpen(false);
    navigate(`/projects/${projectId}`);
  };

  const handleCreateNew = () => {
    setOpen(false);
    if (onCreateNew) {
      onCreateNew();
    } else {
      navigate("/projects");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="truncate font-medium">
              {isLoading ? "Loading..." : currentProject?.name || "Select project"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-popover border-border shadow-lg" align="start">
        <Command>
          <CommandInput placeholder="Search projects..." className="h-9" />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup heading="Your Projects">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                projects?.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelectProject(project.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          project.status === "active" ? "bg-success" : "bg-warning"
                        )}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {project.id === currentProjectId && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleCreateNew} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                <span>New Project</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

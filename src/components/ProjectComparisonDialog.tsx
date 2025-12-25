import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCompare } from "lucide-react";

interface ProjectComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectId: string;
  onSelectProject: (projectId: string) => void;
}

interface CompletedProject {
  id: string;
  name: string;
  created_at: string;
}

export function ProjectComparisonDialog({
  open,
  onOpenChange,
  currentProjectId,
  onSelectProject,
}: ProjectComparisonDialogProps) {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["completed-projects-for-comparison", user?.id],
    queryFn: async (): Promise<CompletedProject[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .neq("id", currentProjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!user?.id,
  });

  const handleSelect = (projectId: string) => {
    onSelectProject(projectId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Compare Projects
          </DialogTitle>
          <DialogDescription>
            Select a completed project to view side-by-side with the current one.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-4 text-left"
                  onClick={() => handleSelect(project.id)}
                >
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No other completed projects found.</p>
              <p className="text-xs mt-1">
                Complete another project to compare how your thinking has evolved.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

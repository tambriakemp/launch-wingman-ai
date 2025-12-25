import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ProjectState,
  PROJECT_STATE_LABELS,
} from "@/types/projectLifecycle";

interface ProjectSettingsDialogProps {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  projectStatus: ProjectState;
  onProjectUpdated: (name: string, description: string | null, status: ProjectState) => void;
  trigger?: React.ReactNode;
}

export function ProjectSettingsDialog({
  projectId,
  projectName,
  projectDescription,
  projectStatus,
  onProjectUpdated,
  trigger,
}: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(projectName);
      setDescription(projectDescription || "");
    }
  }, [open, projectName, projectDescription]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to update project");
      console.error(error);
    } else {
      toast.success("Project updated");
      onProjectUpdated(name.trim(), description.trim() || null, projectStatus);
      setOpen(false);
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Project Settings</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          
          {/* Status Display (Read-only) */}
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Current Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {PROJECT_STATE_LABELS[projectStatus]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Status changes automatically as you progress
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

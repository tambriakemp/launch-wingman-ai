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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pause, Play, Archive, RotateCcw } from "lucide-react";
import {
  ProjectState,
  PROJECT_STATE_LABELS,
  PROJECT_STATE_DESCRIPTIONS,
  canTransitionTo,
} from "@/types/projectLifecycle";

interface ProjectSettingsDialogProps {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  projectStatus: ProjectState;
  onProjectUpdated: (name: string, description: string | null, status: ProjectState) => void;
  trigger?: React.ReactNode;
}

// Status groups for UI organization
const ACTIVE_STATES: ProjectState[] = ['draft', 'in_progress', 'launched', 'completed'];
const INACTIVE_STATES: ProjectState[] = ['paused', 'archived'];

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
  const [status, setStatus] = useState<ProjectState>(projectStatus);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(projectName);
      setDescription(projectDescription || "");
      setStatus(projectStatus);
    }
  }, [open, projectName, projectDescription, projectStatus]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    // Validate status transition if it changed
    if (status !== projectStatus && !canTransitionTo(projectStatus, status)) {
      toast.error(`Cannot change status from ${PROJECT_STATE_LABELS[projectStatus]} to ${PROJECT_STATE_LABELS[status]}`);
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        status: status,
      })
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to update project");
      console.error(error);
    } else {
      toast.success("Project updated");
      onProjectUpdated(name.trim(), description.trim() || null, status);
      setOpen(false);
    }

    setIsSaving(false);
  };

  // Quick action handlers
  const handlePause = async () => {
    if (!canTransitionTo(projectStatus, 'paused')) {
      toast.error("Cannot pause this project in its current state");
      return;
    }
    setStatus('paused');
  };

  const handleResume = async () => {
    // Resume goes to in_progress or draft depending on progress
    const targetState: ProjectState = projectStatus === 'paused' ? 'in_progress' : 'draft';
    if (!canTransitionTo(projectStatus, targetState)) {
      toast.error("Cannot resume this project");
      return;
    }
    setStatus(targetState);
  };

  const handleArchive = async () => {
    if (!canTransitionTo(projectStatus, 'archived')) {
      toast.error("Cannot archive this project in its current state");
      return;
    }
    setStatus('archived');
  };

  const handleRestore = async () => {
    if (!canTransitionTo(projectStatus, 'in_progress')) {
      toast.error("Cannot restore this project");
      return;
    }
    setStatus('in_progress');
  };

  // Get available status transitions
  const getAvailableTransitions = (): ProjectState[] => {
    const allStates: ProjectState[] = ['draft', 'in_progress', 'launched', 'completed', 'paused', 'archived'];
    return allStates.filter(s => s === projectStatus || canTransitionTo(projectStatus, s));
  };

  const availableStatuses = getAvailableTransitions();
  const isPaused = status === 'paused';
  const isArchived = status === 'archived';
  const canPause = canTransitionTo(projectStatus, 'paused');
  const canArchive = canTransitionTo(projectStatus, 'archived');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Project Settings</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project details and manage its lifecycle.
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
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: ProjectState) => setStatus(value)}>
              <SelectTrigger id="status" className="bg-background">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROJECT_STATE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PROJECT_STATE_DESCRIPTIONS[status]}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-2 pt-2 border-t border-border">
            <Label className="text-muted-foreground">Quick Actions</Label>
            <div className="flex flex-wrap gap-2">
              {isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResume}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </Button>
              ) : canPause ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePause}
                  className="gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </Button>
              ) : null}

              {isArchived ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </Button>
              ) : canArchive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </Button>
              ) : null}
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

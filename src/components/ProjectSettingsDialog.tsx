import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Undo2 } from "lucide-react";
import {
  ProjectState,
  PROJECT_STATE_LABELS,
} from "@/types/projectLifecycle";
import { differenceInHours } from "date-fns";

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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [relaunchInfo, setRelaunchInfo] = useState<{
    isRelaunch: boolean;
    parentId: string | null;
    createdAt: string | null;
  }>({ isRelaunch: false, parentId: null, createdAt: null });

  useEffect(() => {
    if (open) {
      setName(projectName);
      setDescription(projectDescription || "");
      
      // Fetch relaunch info
      supabase
        .from("projects")
        .select("is_relaunch, parent_project_id, created_at")
        .eq("id", projectId)
        .single()
        .then(({ data }) => {
          if (data) {
            setRelaunchInfo({
              isRelaunch: data.is_relaunch,
              parentId: data.parent_project_id,
              createdAt: data.created_at,
            });
          }
        });
    }
  }, [open, projectName, projectDescription, projectId]);

  // Check if undo is available (relaunch created within last 24 hours)
  const canUndo = relaunchInfo.isRelaunch && 
    relaunchInfo.createdAt && 
    differenceInHours(new Date(), new Date(relaunchInfo.createdAt)) < 24;

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

  const handleUndoRelaunch = async () => {
    if (!relaunchInfo.parentId) return;

    setIsUndoing(true);

    try {
      // Delete the current relaunch project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Relaunch undone. Returning to original project.");
      navigate(`/projects/${relaunchInfo.parentId}`);
    } catch (error) {
      console.error("Error undoing relaunch:", error);
      toast.error("Failed to undo relaunch");
    } finally {
      setIsUndoing(false);
      setShowUndoConfirm(false);
    }
  };

  return (
    <>
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

            {/* Undo Relaunch Option */}
            {canUndo && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowUndoConfirm(true)}
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Undo Relaunch
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Delete this relaunch and return to the original project
                </p>
              </div>
            )}
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

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo Relaunch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this relaunch project and all its data. 
              You'll be returned to your original project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndoRelaunch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUndoing}
            >
              {isUndoing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Yes, Undo Relaunch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

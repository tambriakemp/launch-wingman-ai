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
import { Loader2 } from "lucide-react";

type ProjectStatus = "active" | "draft" | "archived";

interface ProjectSettingsDialogProps {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  projectStatus: ProjectStatus;
  onProjectUpdated: (name: string, description: string | null, status: ProjectStatus) => void;
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
  const [status, setStatus] = useState<ProjectStatus>(projectStatus);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Project Settings</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project name, description, and status.
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
            <Select value={status} onValueChange={(value: ProjectStatus) => setStatus(value)}>
              <SelectTrigger id="status" className="bg-background">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {status === "archived" && "Archived projects won't appear in the main projects list."}
              {status === "draft" && "Draft projects are visible but marked as work in progress."}
              {status === "active" && "Active projects are your current focus."}
            </p>
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

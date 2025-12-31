import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialDate?: Date;
  onSchedulePost?: (item: {
    id: string;
    title: string;
    content: string | null;
    content_type: string;
  }) => void;
}

const PHASES = [
  { id: "pre-launch-week-1", label: "Pre-Launch: Week 1" },
  { id: "pre-launch-week-2", label: "Pre-Launch: Week 2" },
  { id: "pre-launch-week-3", label: "Pre-Launch: Week 3" },
  { id: "pre-launch-week-4", label: "Pre-Launch: Week 4" },
  { id: "launch", label: "Launch Week" },
];

const CONTENT_TYPES = [
  { id: "general", label: "General" },
  { id: "stories", label: "Stories" },
  { id: "offer", label: "Offer" },
  { id: "behind-the-scenes", label: "Behind the Scenes" },
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export const CreatePostDialog = ({
  open,
  onOpenChange,
  projectId,
  initialDate,
  onSchedulePost,
}: CreatePostDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("general");
  const [phase, setPhase] = useState("pre-launch-week-1");
  const [dayNumber, setDayNumber] = useState(1);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setContentType("general");
    setPhase("pre-launch-week-1");
    setDayNumber(1);
  };

  const handleSave = async (andSchedule = false) => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("content_planner")
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim() || null,
          content_type: contentType,
          phase,
          day_number: dayNumber,
          time_of_day: "morning",
          status: content.trim() ? "draft" : "idea",
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Post created successfully");
      
      if (andSchedule && data && onSchedulePost) {
        onSchedulePost({
          id: data.id,
          title: data.title,
          content: data.content,
          content_type: data.content_type,
        });
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Add a new post to your launch content timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's this post about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Brief Description (optional)</Label>
            <Input
              id="description"
              placeholder="A short summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (optional)</Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={String(dayNumber)} onValueChange={(v) => setDayNumber(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save to Timeline
          </Button>
          {onSchedulePost && (
            <Button
              onClick={() => handleSave(true)}
              disabled={isLoading}
            >
              <CalendarClock className="w-4 h-4 mr-2" />
              Save & Schedule
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

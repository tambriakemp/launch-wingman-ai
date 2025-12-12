import { useState } from "react";
import { Plus, Mail, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface EmailSequence {
  id: string;
  title: string;
  content: string;
}

interface EmailSequencesSectionProps {
  projectId: string;
}

export const EmailSequencesSection = ({ projectId }: EmailSequencesSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingItem, setEditingItem] = useState<EmailSequence | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Fetch email sequences from database
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["email-sequences", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
      }));
    },
    enabled: !!projectId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const { error } = await supabase.from("email_sequences").insert({
        project_id: projectId,
        user_id: user?.id,
        title: data.title,
        content: data.content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences", projectId] });
      toast.success("Email sequence added");
      resetForm();
    },
    onError: () => toast.error("Failed to save email sequence"),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from("email_sequences")
        .update({ title: data.title, content: data.content })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences", projectId] });
      toast.success("Email sequence updated");
      resetForm();
    },
    onError: () => toast.error("Failed to update email sequence"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences", projectId] });
      toast.success("Email sequence deleted");
    },
    onError: () => toast.error("Failed to delete email sequence"),
  });

  const resetForm = () => {
    setIsAddMode(false);
    setEditingItem(null);
    setTitle("");
    setContent("");
  };

  const handleAdd = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setIsAddMode(true);
  };

  const handleEdit = (item: EmailSequence) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setIsAddMode(true);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, title, content });
    } else {
      createMutation.mutate({ title, content });
    }
  };

  // Show inline form when adding/editing
  if (isAddMode) {
    return (
      <Card className="border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {editingItem ? "Edit" : "Add"} Email Sequence
                </CardTitle>
                <CardDescription className="text-sm">
                  Nurture sequences, launch emails, and follow-ups
                </CardDescription>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for this email sequence..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter your email sequence content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="min-h-[200px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save Changes" : "Add Email Sequence"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Email Sequences</CardTitle>
              <CardDescription className="text-sm">
                Nurture sequences, launch emails, and follow-ups
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No email sequences added yet</p>
            <Button size="sm" variant="ghost" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              Add Your First
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

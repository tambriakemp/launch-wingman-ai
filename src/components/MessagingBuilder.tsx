import { useState } from "react";
import { Plus, Mail, Package, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SocialBioBuilder } from "./SocialBioBuilder";
import { SalesPageCopyBuilder } from "./SalesPageCopyBuilder";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface MessagingItem {
  id: string;
  title: string;
  content: string;
  type: "email-sequence" | "deliverable";
}

interface MessagingSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "email-sequence" | "deliverable";
  items: MessagingItem[];
  onAdd: (type: MessagingItem["type"]) => void;
  onEdit: (item: MessagingItem) => void;
  onDelete: (item: MessagingItem) => void;
  isLoading?: boolean;
}

const MessagingSection = ({
  title,
  description,
  icon,
  type,
  items,
  onAdd,
  onEdit,
  onDelete,
  isLoading,
}: MessagingSectionProps) => {
  const sectionItems = items.filter((item) => item.type === type as string);

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onAdd(type)}>
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sectionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              {icon}
            </div>
            <p className="text-sm text-muted-foreground mb-3">No {title.toLowerCase()} added yet</p>
            <Button size="sm" variant="ghost" onClick={() => onAdd(type)}>
              <Plus className="w-4 h-4" />
              Add Your First
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sectionItems.map((item) => (
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
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(item)}
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

interface MessagingBuilderProps {
  projectId: string;
}

const sectionConfig = {
  "email-sequence": {
    title: "Email Sequences",
    description: "Nurture sequences, launch emails, and follow-ups",
    icon: <Mail className="w-5 h-5 text-primary" />,
  },
  deliverable: {
    title: "Deliverable Copy",
    description: "Descriptions and copy for your program deliverables",
    icon: <Package className="w-5 h-5 text-primary" />,
  },
};

export const MessagingBuilder = ({ projectId }: MessagingBuilderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MessagingItem | null>(null);
  const [currentType, setCurrentType] = useState<MessagingItem["type"]>("email-sequence");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Fetch email sequences from database
  const { data: emailSequences = [], isLoading: isLoadingEmails } = useQuery({
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
        type: "email-sequence" as const,
      }));
    },
    enabled: !!projectId,
  });

  // Fetch deliverable copy from database
  const { data: deliverableCopy = [], isLoading: isLoadingDeliverables } = useQuery({
    queryKey: ["deliverable-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliverable_copy")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: "deliverable" as const,
      }));
    },
    enabled: !!projectId,
  });

  // Combine both data sources
  const items: MessagingItem[] = [...emailSequences, ...deliverableCopy];

  // Create email sequence mutation
  const createEmailMutation = useMutation({
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
    },
    onError: () => toast.error("Failed to save email sequence"),
  });

  // Update email sequence mutation
  const updateEmailMutation = useMutation({
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
    },
    onError: () => toast.error("Failed to update email sequence"),
  });

  // Delete email sequence mutation
  const deleteEmailMutation = useMutation({
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

  // Create deliverable copy mutation
  const createDeliverableMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const { error } = await supabase.from("deliverable_copy").insert({
        project_id: projectId,
        user_id: user?.id,
        title: data.title,
        content: data.content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-copy", projectId] });
      toast.success("Deliverable copy added");
    },
    onError: () => toast.error("Failed to save deliverable copy"),
  });

  // Update deliverable copy mutation
  const updateDeliverableMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from("deliverable_copy")
        .update({ title: data.title, content: data.content })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-copy", projectId] });
      toast.success("Deliverable copy updated");
    },
    onError: () => toast.error("Failed to update deliverable copy"),
  });

  // Delete deliverable copy mutation
  const deleteDeliverableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliverable_copy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable-copy", projectId] });
      toast.success("Deliverable copy deleted");
    },
    onError: () => toast.error("Failed to delete deliverable copy"),
  });

  const handleAdd = (type: MessagingItem["type"]) => {
    setCurrentType(type);
    setEditingItem(null);
    setTitle("");
    setContent("");
    setDialogOpen(true);
  };

  const handleEdit = (item: MessagingItem) => {
    setEditingItem(item);
    setCurrentType(item.type);
    setTitle(item.title);
    setContent(item.content);
    setDialogOpen(true);
  };

  const handleDelete = (item: MessagingItem) => {
    if (item.type === "email-sequence") {
      deleteEmailMutation.mutate(item.id);
    } else {
      deleteDeliverableMutation.mutate(item.id);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingItem) {
      if (currentType === "email-sequence") {
        updateEmailMutation.mutate({ id: editingItem.id, title, content });
      } else {
        updateDeliverableMutation.mutate({ id: editingItem.id, title, content });
      }
    } else {
      if (currentType === "email-sequence") {
        createEmailMutation.mutate({ title, content });
      } else {
        createDeliverableMutation.mutate({ title, content });
      }
    }

    setDialogOpen(false);
    setTitle("");
    setContent("");
    setEditingItem(null);
  };

  const config = sectionConfig[currentType];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SalesPageCopyBuilder projectId={projectId} />
        <SocialBioBuilder projectId={projectId} />
        <MessagingSection
          title={sectionConfig["email-sequence"].title}
          description={sectionConfig["email-sequence"].description}
          icon={sectionConfig["email-sequence"].icon}
          type="email-sequence"
          items={items}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoadingEmails}
        />
        <MessagingSection
          title={sectionConfig.deliverable.title}
          description={sectionConfig.deliverable.description}
          icon={sectionConfig.deliverable.icon}
          type="deliverable"
          items={items}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoadingDeliverables}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.icon}
              {editingItem ? "Edit" : "Add"} {config.title}
            </DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for this copy..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your copy here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save Changes" : "Add Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

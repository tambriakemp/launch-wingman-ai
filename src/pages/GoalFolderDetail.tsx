import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { GoalGridCard } from "@/components/goals/GoalGridCard";
import { GoalDialog } from "@/components/goals/GoalDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Folder, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalFolder {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  business: "#f5c842",
  personal: "#0ea572",
  health: "#f43f5e",
  finance: "#8b5cf6",
  relationships: "#3b82f6",
  mindset: "#f97316",
};

const GoalFolderDetail = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [folder, setFolder] = useState<GoalFolder | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [allFolders, setAllFolders] = useState<GoalFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [sortBy, setSortBy] = useState("updated");
  const [showArchived, setShowArchived] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const fetchFolder = useCallback(async () => {
    if (!user || !folderId) return;
    const { data } = await supabase
      .from("goal_folders" as any)
      .select("*")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();
    setFolder((data as unknown as GoalFolder) || null);
  }, [user, folderId]);

  const fetchGoals = useCallback(async () => {
    if (!user || !folderId) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });
    setGoals((data as unknown as Goal[]) || []);
    setIsLoading(false);
  }, [user, folderId]);

  const fetchTargets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goal_targets" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setTargets((data as unknown as GoalTarget[]) || []);
  }, [user]);

  useEffect(() => {
    fetchFolder();
    fetchGoals();
    fetchTargets();
  }, [fetchFolder, fetchGoals, fetchTargets]);

  const handleCreateGoal = async (
    data: Partial<Goal>,
    newTargets: Partial<GoalTarget>[]
  ) => {
    if (!user || !folderId) return;
    const { data: created, error } = await supabase
      .from("goals" as any)
      .insert({
        user_id: user.id,
        title: data.title!,
        description: data.description || null,
        category: data.category || "business",
        color: CATEGORY_COLORS[data.category || "business"] || "#f5c842",
        why_statement: data.why_statement || null,
        target_date: data.target_date || null,
        status: "active",
        folder_id: folderId,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create goal");
      return;
    }
    if (newTargets.length > 0 && created) {
      await supabase.from("goal_targets" as any).insert(
        newTargets.map((t, i) => ({
          goal_id: (created as any).id,
          user_id: user.id,
          name: t.name!,
          target_type: t.target_type || "number",
          unit: t.unit || null,
          start_value: t.start_value ?? 0,
          target_value: t.target_value ?? 1,
          current_value: t.start_value ?? 0,
          position: i,
        }))
      );
    }
    toast.success("Goal created");
    fetchGoals();
    fetchTargets();
  };

  const handleUpdateGoal = async (
    data: Partial<Goal>,
    updatedTargets: Partial<GoalTarget>[]
  ) => {
    if (!editingGoal || !user) return;
    await supabase
      .from("goals" as any)
      .update({
        title: data.title,
        description: data.description || null,
        category: data.category,
        color: CATEGORY_COLORS[data.category || "business"] || editingGoal.color,
        why_statement: data.why_statement || null,
        target_date: data.target_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingGoal.id);
    await supabase
      .from("goal_targets" as any)
      .delete()
      .eq("goal_id", editingGoal.id);
    if (updatedTargets.length > 0) {
      await supabase.from("goal_targets" as any).insert(
        updatedTargets.map((t, i) => ({
          goal_id: editingGoal.id,
          user_id: user.id,
          name: t.name!,
          target_type: t.target_type || "number",
          unit: t.unit || null,
          start_value: t.start_value ?? 0,
          target_value: t.target_value ?? 1,
          current_value: t.current_value ?? t.start_value ?? 0,
          is_done: t.is_done || false,
          position: i,
        }))
      );
    }
    toast.success("Goal updated");
    setEditingGoal(null);
    fetchGoals();
    fetchTargets();
  };

  const handleRenameFolder = async () => {
    if (!folder || !renameValue.trim()) return;
    await supabase
      .from("goal_folders" as any)
      .update({ name: renameValue.trim() })
      .eq("id", folder.id);
    toast.success("Folder renamed");
    setIsRenaming(false);
    fetchFolder();
  };

  const handleDeleteFolder = async () => {
    if (!folder) return;
    // Move goals to unfiled first
    await supabase
      .from("goals" as any)
      .update({ folder_id: null })
      .eq("folder_id", folder.id);
    await supabase
      .from("goal_folders" as any)
      .delete()
      .eq("id", folder.id);
    toast.success("Folder deleted");
    navigate("/goals");
  };

  const filteredGoals = useMemo(() => {
    let filtered = goals.filter((g) =>
      showArchived ? g.status === "archived" : g.status !== "archived"
    );
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "created":
        filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      default:
        // updated — already default order
        break;
    }
    return filtered;
  }, [goals, sortBy, showArchived]);

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ProjectLayout>
    );
  }

  if (!folder) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Folder not found</p>
          <Button variant="outline" onClick={() => navigate("/goals")}>
            Back to Goals
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/goals")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              All Goals
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-primary" />
              {isRenaming ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRenameFolder(); }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="h-7 px-2 text-sm border border-border rounded bg-background text-foreground w-40"
                    onBlur={() => setIsRenaming(false)}
                  />
                </form>
              ) : (
                <span className="font-medium text-foreground">{folder.name}</span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => { setRenameValue(folder.name); setIsRenaming(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteFolder} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-7 text-xs w-24 border-none shadow-none px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Archived: {showArchived ? "Show" : "Hide"}
              </button>
            </div>
            <Button
              onClick={() => { setEditingGoal(null); setDialogOpen(true); }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </div>

          {/* Goal cards grid */}
          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-muted-foreground">
                {showArchived ? "No archived goals in this folder." : "No goals in this folder yet."}
              </p>
              {!showArchived && (
                <Button onClick={() => setDialogOpen(true)} className="gap-2 mt-4" variant="outline">
                  <Plus className="w-4 h-4" /> Create First Goal
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <GoalGridCard
                  key={goal.id}
                  goal={goal}
                  targets={targets.filter((t) => t.goal_id === goal.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        editGoal={editingGoal}
        existingTargets={
          editingGoal ? targets.filter((t) => t.goal_id === editingGoal.id) : []
        }
      />
    </ProjectLayout>
  );
};

export default GoalFolderDetail;

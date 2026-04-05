import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { GoalFolderCard, NewFolderCard } from "@/components/goals/GoalFolderCard";
import { GoalGridCard } from "@/components/goals/GoalGridCard";
import { GoalDialog } from "@/components/goals/GoalDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  color: string;
  why_statement: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
  folder_id: string | null;
}

export interface GoalTarget {
  id: string;
  goal_id: string;
  user_id: string;
  name: string;
  target_type: string;
  unit: string | null;
  start_value: number;
  target_value: number;
  current_value: number;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface GoalTargetUpdate {
  id: string;
  target_id: string;
  user_id: string;
  previous_value: number;
  new_value: number;
  note: string | null;
  created_at: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  position: number;
}

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

const Goals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [folders, setFolders] = useState<GoalFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showFolders, setShowFolders] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [createInFolderId, setCreateInFolderId] = useState<string | null>(null);

  // Folder create/rename dialog
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">("create");
  const [folderName, setFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as unknown as Goal[]) || []);
    setIsLoading(false);
  }, [user]);

  const fetchTargets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goal_targets" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setTargets((data as unknown as GoalTarget[]) || []);
  }, [user]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goal_folders" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setFolders((data as unknown as GoalFolder[]) || []);
  }, [user]);

  useEffect(() => {
    fetchGoals();
    fetchTargets();
    fetchFolders();
  }, [fetchGoals, fetchTargets, fetchFolders]);

  const handleCreateGoal = async (
    data: Partial<Goal>,
    newTargets: Partial<GoalTarget>[]
  ) => {
    if (!user) return;
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

  const handleCreateFolder = async () => {
    if (!user || !folderName.trim()) return;
    await supabase.from("goal_folders" as any).insert({
      user_id: user.id,
      name: folderName.trim(),
      position: folders.length,
    });
    toast.success("Folder created");
    setFolderDialogOpen(false);
    setFolderName("");
    fetchFolders();
  };

  const handleRenameFolder = async () => {
    if (!renamingFolderId || !folderName.trim()) return;
    await supabase
      .from("goal_folders" as any)
      .update({ name: folderName.trim() })
      .eq("id", renamingFolderId);
    toast.success("Folder renamed");
    setFolderDialogOpen(false);
    setFolderName("");
    setRenamingFolderId(null);
    fetchFolders();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await supabase
      .from("goals" as any)
      .update({ folder_id: null })
      .eq("folder_id", folderId);
    await supabase
      .from("goal_folders" as any)
      .delete()
      .eq("id", folderId);
    toast.success("Folder deleted");
    fetchFolders();
    fetchGoals();
  };

  const handleMoveGoalToFolder = async (goalId: string, folderId: string | null) => {
    await supabase
      .from("goals" as any)
      .update({ folder_id: folderId })
      .eq("id", goalId);
    toast.success(folderId ? "Goal moved to folder" : "Goal removed from folder");
    fetchGoals();
  };

  const handleArchiveGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    const newStatus = goal?.status === "archived" ? "active" : "archived";
    await supabase
      .from("goals" as any)
      .update({ status: newStatus })
      .eq("id", goalId);
    toast.success(newStatus === "archived" ? "Goal archived" : "Goal unarchived");
    fetchGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await supabase.from("goal_targets" as any).delete().eq("goal_id", goalId);
    await supabase.from("goals" as any).delete().eq("id", goalId);
    toast.success("Goal deleted");
    fetchGoals();
    fetchTargets();
  };


  const unfiledGoals = useMemo(() => {
    return goals.filter((g) => {
      if (!showArchived && g.status === "archived") return false;
      if (showArchived && g.status !== "archived") return false;
      return !g.folder_id;
    });
  }, [goals, showArchived]);

  const allFilteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (!showArchived && g.status === "archived") return false;
      if (showArchived && g.status !== "archived") return false;
      return true;
    });
  }, [goals, showArchived]);

  const goalsToShow = showFolders ? unfiledGoals : allFilteredGoals;

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-xl shrink-0">
              <Target className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Goals</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Organize your goals into folders and track measurable progress.
                  </p>
                </div>
                <Button
                  onClick={() => { setEditingGoal(null); setDialogOpen(true); }}
                  className="gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> New Goal
                </Button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFolders(!showFolders)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                showFolders
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              Folders: {showFolders ? "Show" : "Hide"}
            </button>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                showArchived
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              Archived: {showArchived ? "Show" : "Hide"}
            </button>
          </div>

          {/* Folders grid */}
          {showFolders && folders.length >= 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Folders
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map((f) => {
                  const folderGoalCount = goals.filter(
                    (g) => g.folder_id === f.id && g.status !== "archived"
                  ).length;
                  return (
                    <GoalFolderCard
                      key={f.id}
                      id={f.id}
                      name={f.name}
                      goalCount={folderGoalCount}
                      onClick={() => navigate(`/goals/folder/${f.id}`)}
                      onRename={() => {
                        setFolderDialogMode("rename");
                        setRenamingFolderId(f.id);
                        setFolderName(f.name);
                        setFolderDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteFolder(f.id)}
                    />
                  );
                })}
                <NewFolderCard
                  onClick={() => {
                    setFolderDialogMode("create");
                    setFolderName("");
                    setFolderDialogOpen(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* Goals grid */}
          {goalsToShow.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goalsToShow.map((goal) => (
                <GoalGridCard
                  key={goal.id}
                  goal={goal}
                  targets={targets.filter((t) => t.goal_id === goal.id)}
                  folders={folders}
                  onRename={(g) => { setEditingGoal(g); setDialogOpen(true); }}
                  onMoveToFolder={handleMoveGoalToFolder}
                  onArchive={handleArchiveGoal}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && folders.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Set your first goal with measurable targets and track your progress over time.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2 mt-4">
                <Plus className="w-4 h-4" /> Create First Goal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Folder create/rename dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {folderDialogMode === "create" ? "New Folder" : "Rename Folder"}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name..."
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                folderDialogMode === "create" ? handleCreateFolder() : handleRenameFolder();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={folderDialogMode === "create" ? handleCreateFolder : handleRenameFolder}
              disabled={!folderName.trim()}
            >
              {folderDialogMode === "create" ? "Create" : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default Goals;

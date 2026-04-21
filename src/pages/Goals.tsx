import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import {
  EditorialFolderCard,
  NewEditorialFolderCard,
  type EditorialFolderData,
} from "@/components/goals/EditorialFolderCard";
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
import { Folder as FolderIcon, Plus, Sparkles } from "lucide-react";

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
  updated_at?: string;
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
  const [showArchived, setShowArchived] = useState(false);
  const [createInFolderId, setCreateInFolderId] = useState<string | null>(null);

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
        folder_id: createInFolderId || null,
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
    setCreateInFolderId(null);
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
    await supabase.from("goal_folders" as any).delete().eq("id", folderId);
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
    const goal = goals.find((g) => g.id === goalId);
    const newStatus = goal?.status === "archived" ? "active" : "archived";
    await supabase.from("goals" as any).update({ status: newStatus }).eq("id", goalId);
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

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  const confirmDelete = (title: string, action: () => void) => {
    setDeleteConfirmTitle(title);
    setPendingDeleteAction(() => action);
    setDeleteConfirmOpen(true);
  };

  // ==== Derived data ====

  const activeGoals = useMemo(
    () => goals.filter((g) => (showArchived ? g.status === "archived" : g.status !== "archived")),
    [goals, showArchived]
  );

  const unfiledGoals = useMemo(
    () => activeGoals.filter((g) => !g.folder_id),
    [activeGoals]
  );

  // Target progress aggregator per goal
  const goalProgress = useCallback(
    (goalId: string) => {
      const ts = targets.filter((t) => t.goal_id === goalId);
      if (ts.length === 0) return { pct: 0, isDone: false, hasMotion: false };
      const totalRange = ts.reduce((s, t) => s + Math.max(0, t.target_value - t.start_value), 0);
      const totalCurrent = ts.reduce((s, t) => s + Math.max(0, t.current_value - t.start_value), 0);
      const pct = totalRange > 0 ? Math.round((totalCurrent / totalRange) * 100) : 0;
      const isDone = ts.every((t) => t.is_done);
      const hasMotion = ts.some((t) => t.current_value > t.start_value && !t.is_done);
      return { pct, isDone, hasMotion };
    },
    [targets]
  );

  // Folder data for editorial cards
  const folderCardsData: EditorialFolderData[] = useMemo(() => {
    return folders.map((f, idx) => {
      const fGoals = activeGoals.filter((g) => g.folder_id === f.id);
      let complete = 0;
      let inMotion = 0;
      let totalPct = 0;
      fGoals.forEach((g) => {
        const p = goalProgress(g.id);
        totalPct += p.pct;
        if (g.status === "completed" || p.isDone) complete += 1;
        else if (p.hasMotion || p.pct > 0) inMotion += 1;
      });
      const idle = fGoals.length - complete - inMotion;
      const pct = fGoals.length > 0 ? Math.round(totalPct / fGoals.length) : 0;

      // last update
      const lastGoal = [...fGoals].sort((a, b) => {
        const ad = new Date(a.updated_at || a.created_at).getTime();
        const bd = new Date(b.updated_at || b.created_at).getTime();
        return bd - ad;
      })[0];
      const last = lastGoal
        ? `Updated ${formatDistanceToNow(new Date(lastGoal.updated_at || lastGoal.created_at), { addSuffix: true })} · ${lastGoal.title}`
        : `Created ${formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}`;

      const yearMatch = f.name.match(/^(\d{4})/);
      return {
        id: f.id,
        name: f.name,
        tag: yearMatch ? yearMatch[1] : "Folder",
        active: idx === 0,
        goals: fGoals.length,
        complete,
        inMotion,
        idle: Math.max(0, idle),
        pct,
        note: null,
        last,
      };
    });
  }, [folders, activeGoals, goalProgress]);

  // Stats strip
  const stats = useMemo(() => {
    const inMotion = activeGoals.filter((g) => {
      const p = goalProgress(g.id);
      return p.hasMotion || (p.pct > 0 && !p.isDone);
    }).length;
    const completed = goals.filter((g) => {
      const p = goalProgress(g.id);
      return g.status === "completed" || p.isDone;
    }).length;
    return {
      folders: folders.length,
      total: goals.length,
      inMotion,
      completed,
    };
  }, [goals, activeGoals, folders, goalProgress]);

  return (
    <ProjectLayout>
      <div className="app-cream flex-1 overflow-y-auto" style={{ background: "hsl(var(--bg))" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 1240, padding: "36px 40px 96px" }}
        >
          {/* Header */}
          <div
            className="flex flex-wrap items-end justify-between gap-6 pb-7"
            style={{ borderBottom: "1px solid hsl(var(--border-hairline))" }}
          >
            <div className="min-w-0 flex-1" style={{ flexBasis: 420 }}>
              <div
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "hsl(var(--terracotta-500))",
                }}
              >
                Goals
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: 48,
                  letterSpacing: "-0.025em",
                  color: "hsl(var(--ink-900))",
                  margin: "6px 0 0",
                  lineHeight: 1.05,
                }}
              >
                What are you{" "}
                <em style={{ color: "hsl(var(--terracotta-500))", fontWeight: 400 }}>
                  quietly working toward?
                </em>
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "hsl(var(--fg-secondary))",
                  marginTop: 12,
                  maxWidth: 520,
                }}
              >
                Group your goals into folders — by year, theme, or project. Break them into
                targets and track honest progress.
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2.5">
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  background: "transparent",
                  border: "1px solid hsl(var(--border-default))",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: showArchived ? "hsl(var(--terracotta-500))" : "hsl(var(--ink-900))",
                  cursor: "pointer",
                }}
              >
                <FolderIcon className="h-3.5 w-3.5" /> {showArchived ? "Active" : "Archived"}
              </button>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setCreateInFolderId(null);
                  setDialogOpen(true);
                }}
                className="inline-flex items-center gap-2 whitespace-nowrap"
                style={{
                  background: "hsl(var(--ink-900))",
                  color: "hsl(var(--paper-50))",
                  border: 0,
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New goal
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div
            className="flex flex-wrap gap-10 py-5"
            style={{ borderBottom: "1px solid hsl(var(--border-hairline))" }}
          >
            {[
              { value: stats.folders, label: "Folders", color: "hsl(var(--ink-900))" },
              { value: stats.total, label: "Total goals", color: "hsl(var(--ink-900))" },
              { value: stats.inMotion, label: "In motion", color: "hsl(var(--terracotta-500))" },
              { value: stats.completed, label: "Completed", color: "hsl(var(--moss-500))" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 30,
                    letterSpacing: "-0.02em",
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="font-semibold uppercase"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "hsl(var(--fg-muted))",
                    marginTop: 6,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Folders grid */}
          <section style={{ paddingTop: 28 }}>
            <div className="mb-[18px] flex items-baseline justify-between">
              <div
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "hsl(var(--fg-muted))",
                }}
              >
                Folders
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "hsl(var(--fg-muted))",
                }}
              >
                Sort:{" "}
                <strong style={{ color: "hsl(var(--ink-900))", fontWeight: 500 }}>
                  Most active
                </strong>
              </div>
            </div>
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
            >
              {folderCardsData.map((f) => (
                <EditorialFolderCard
                  key={f.id}
                  folder={f}
                  onClick={() => navigate(`/goals/folder/${f.id}`)}
                  onRename={() => {
                    setFolderDialogMode("rename");
                    setRenamingFolderId(f.id);
                    setFolderName(f.name);
                    setFolderDialogOpen(true);
                  }}
                  onDelete={() =>
                    confirmDelete("Delete this folder?", () => handleDeleteFolder(f.id))
                  }
                  onCreateGoal={() => {
                    setCreateInFolderId(f.id);
                    setEditingGoal(null);
                    setDialogOpen(true);
                  }}
                />
              ))}
              <NewEditorialFolderCard
                onClick={() => {
                  setFolderDialogMode("create");
                  setFolderName("");
                  setFolderDialogOpen(true);
                }}
              />
            </div>
          </section>

          {/* Unfiled goals */}
          {unfiledGoals.length > 0 && (
            <section style={{ paddingTop: 36 }}>
              <div
                className="mb-[18px] font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "hsl(var(--fg-muted))",
                }}
              >
                Unfiled goals
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unfiledGoals.map((goal) => (
                  <GoalGridCard
                    key={goal.id}
                    goal={goal}
                    targets={targets.filter((t) => t.goal_id === goal.id)}
                    folders={folders}
                    onRename={(g) => {
                      setEditingGoal(g);
                      setDialogOpen(true);
                    }}
                    onMoveToFolder={handleMoveGoalToFolder}
                    onArchive={handleArchiveGoal}
                    onDelete={(goalId) =>
                      confirmDelete("Delete this goal?", () => handleDeleteGoal(goalId))
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* AI helper strip */}
          <div
            className="mt-12 flex flex-wrap items-center justify-between gap-[18px]"
            style={{
              padding: "24px 28px",
              background: "#fff",
              border: "1px solid hsl(var(--border-hairline))",
              borderRadius: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "hsl(var(--ink-900))",
                }}
              >
                Need help shaping a goal?
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "hsl(var(--fg-secondary))",
                  marginTop: 4,
                }}
              >
                Describe what you want in a sentence — the AI will break it into measurable
                targets.
              </div>
            </div>
            <button
              onClick={() => {
                setEditingGoal(null);
                setCreateInFolderId(null);
                setDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap"
              style={{
                background: "transparent",
                color: "hsl(var(--terracotta-500))",
                border: "1px solid hsl(var(--terracotta-500))",
                borderRadius: 999,
                padding: "9px 18px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Plan with AI
            </button>
          </div>

          {/* Empty state */}
          {goals.length === 0 && folders.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "hsl(var(--fg-secondary))",
                }}
              >
                Start with a folder, or jump in with your first goal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Folder dialog */}
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
          if (!open) {
            setEditingGoal(null);
            setCreateInFolderId(null);
          }
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        editGoal={editingGoal}
        existingTargets={
          editingGoal ? targets.filter((t) => t.goal_id === editingGoal.id) : []
        }
      />
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          pendingDeleteAction?.();
        }}
        title={deleteConfirmTitle}
      />
    </ProjectLayout>
  );
};

export default Goals;

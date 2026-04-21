import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { differenceInCalendarDays, endOfYear, startOfYear } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { EditorialGoalCard, NewEditorialGoalCard } from "@/components/goals/EditorialGoalCard";
import { GoalDialog } from "@/components/goals/GoalDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder, ChevronRight, MoreHorizontal, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
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

type FilterKey = "all" | "in-motion" | "planning" | "not-started" | "complete";

function classifyGoal(g: Goal, targets: GoalTarget[]): FilterKey {
  if (g.status === "completed") return "complete";
  if (targets.length === 0) return "planning";
  if (targets.every((t) => t.is_done)) return "complete";
  if (targets.some((t) => t.current_value > t.start_value || t.is_done)) return "in-motion";
  return "not-started";
}

const GoalFolderDetail = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [folder, setFolder] = useState<GoalFolder | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [allFolders, setAllFolders] = useState<GoalFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  const confirmDelete = (title: string, action: () => void) => {
    setDeleteConfirmTitle(title);
    setPendingDeleteAction(() => action);
    setDeleteConfirmOpen(true);
  };

  const fetchFolder = useCallback(async () => {
    if (!user || !folderId) return;
    const { data } = await supabase
      .from("goal_folders" as any)
      .select("*")
      .eq("id", folderId)
      .eq("user_id", userId)
      .single();
    setFolder((data as unknown as GoalFolder) || null);
  }, [userId, folderId]);

  const fetchGoals = useCallback(async () => {
    if (!user || !folderId) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("folder_id", folderId)
      .order("updated_at", { ascending: false });
    setGoals((data as unknown as Goal[]) || []);
    setIsLoading(false);
  }, [userId, folderId]);

  const fetchTargets = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("goal_targets" as any)
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });
    setTargets((data as unknown as GoalTarget[]) || []);
  }, [userId]);

  const fetchAllFolders = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("goal_folders" as any)
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });
    setAllFolders((data as unknown as GoalFolder[]) || []);
  }, [userId]);

  useEffect(() => {
    fetchFolder();
    fetchGoals();
    fetchTargets();
    fetchAllFolders();
  }, [fetchFolder, fetchGoals, fetchTargets, fetchAllFolders]);

  const handleCreateGoal = async (data: Partial<Goal>, newTargets: Partial<GoalTarget>[]) => {
    if (!user || !folderId) return;
    const { data: created, error } = await supabase
      .from("goals" as any)
      .insert({
        user_id: userId,
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
          user_id: userId,
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
    await supabase.from("goal_targets" as any).delete().eq("goal_id", editingGoal.id);
    if (updatedTargets.length > 0) {
      await supabase.from("goal_targets" as any).insert(
        updatedTargets.map((t, i) => ({
          goal_id: editingGoal.id,
          user_id: userId,
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
    await supabase.from("goals" as any).update({ folder_id: null }).eq("folder_id", folder.id);
    await supabase.from("goal_folders" as any).delete().eq("id", folder.id);
    toast.success("Folder deleted");
    navigate("/goals");
  };

  const handleMoveGoalToFolder = async (goalId: string, newFolderId: string | null) => {
    await supabase.from("goals" as any).update({ folder_id: newFolderId }).eq("id", goalId);
    toast.success(newFolderId ? "Goal moved to folder" : "Goal removed from folder");
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

  // ==== Derived data ====

  const visibleGoals = useMemo(
    () => goals.filter((g) => (showArchived ? g.status === "archived" : g.status !== "archived")),
    [goals, showArchived]
  );

  const targetsFor = useCallback(
    (goalId: string) => targets.filter((t) => t.goal_id === goalId),
    [targets]
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: visibleGoals.length,
      "in-motion": 0,
      planning: 0,
      "not-started": 0,
      complete: 0,
    };
    visibleGoals.forEach((g) => {
      const k = classifyGoal(g, targetsFor(g.id));
      c[k] += 1;
    });
    return c;
  }, [visibleGoals, targetsFor]);

  const filteredGoals = useMemo(() => {
    if (activeFilter === "all") return visibleGoals;
    return visibleGoals.filter((g) => classifyGoal(g, targetsFor(g.id)) === activeFilter);
  }, [visibleGoals, activeFilter, targetsFor]);

  // Year stats — derived from folder name (e.g. "2026") or current year
  const yearMatch = folder?.name.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  const isYearFolder = !!yearMatch;
  const today = new Date();
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const totalDays = differenceInCalendarDays(yearEnd, yearStart) + 1;
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, differenceInCalendarDays(today, yearStart))
  );
  const yearPct = isYearFolder ? Math.round((elapsedDays / totalDays) * 100) : 0;
  const daysLeft = isYearFolder ? Math.max(0, totalDays - elapsedDays) : 0;

  if (isLoading) {
    return (
      <ProjectLayout>
        <PageLoader containerClassName="flex flex-1 items-center justify-center min-h-[60vh]" />
      </ProjectLayout>
    );
  }

  if (!folder) {
    return (
      <ProjectLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Folder not found</p>
          <Button variant="outline" onClick={() => navigate("/goals")}>
            Back to Goals
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const inMotion = counts["in-motion"];
  const planning = counts.planning;

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All · ${counts.all}` },
    { key: "in-motion", label: `In motion · ${counts["in-motion"]}` },
    { key: "planning", label: `Planning · ${counts.planning}` },
    { key: "not-started", label: `Not started · ${counts["not-started"]}` },
    { key: "complete", label: `Complete · ${counts.complete}` },
  ];

  return (
    <ProjectLayout>
      <div className="app-cream flex-1 overflow-y-auto" style={{ background: "hsl(var(--bg))" }}>
        <div className="mx-auto" style={{ maxWidth: 1280, padding: "28px 40px 96px" }}>
          {/* Breadcrumb */}
          <div
            className="mb-6 flex items-center gap-2"
            style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "hsl(var(--fg-muted))" }}
          >
            <button
              onClick={() => navigate("/goals")}
              className="transition-colors hover:text-[hsl(var(--ink-900))]"
            >
              All Goals
            </button>
            <span>/</span>
            <Folder className="h-3 w-3" style={{ color: "hsl(var(--fg-muted))" }} />
            {isRenaming ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameFolder();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="h-7 w-40 rounded border border-[hsl(var(--border-default))] bg-white px-2 text-sm text-[hsl(var(--ink-900))]"
                  onBlur={() => setIsRenaming(false)}
                />
              </form>
            ) : (
              <span style={{ color: "hsl(var(--ink-900))", fontWeight: 500 }}>{folder.name}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded p-1 text-[hsl(var(--fg-muted))] hover:bg-black/5">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(folder.name);
                    setIsRenaming(true);
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => confirmDelete("Delete this folder?", handleDeleteFolder)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Year hero */}
          <div
            className="relative grid gap-10 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--ink-900)) 0%, #2E2822 100%)",
              color: "hsl(var(--paper-100))",
              borderRadius: 20,
              padding: "36px 40px",
              gridTemplateColumns: "1.4fr 1fr",
            }}
          >
            <div
              className="pointer-events-none absolute"
              style={{
                right: -160,
                top: -160,
                width: 420,
                height: 420,
                borderRadius: 999,
                background:
                  "radial-gradient(circle, rgba(198,90,62,0.25), transparent 65%)",
              }}
            />
            <div className="relative z-10">
              <div
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: "hsl(var(--terracotta-500))",
                }}
              >
                {isYearFolder ? `Your year · ${year}` : folder.name}
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: 52,
                  letterSpacing: "-0.025em",
                  margin: "10px 0 0",
                  lineHeight: 1.08,
                  color: "hsl(var(--paper-100))",
                }}
              >
                {visibleGoals.length === 0 ? (
                  <>
                    No <em style={{ color: "hsl(var(--terracotta-500))", fontStyle: "italic", fontWeight: 300 }}>promises</em> yet
                    <span className="block">— start with one.</span>
                  </>
                ) : (
                  <>
                    {visibleGoals.length}{" "}
                    <em style={{ color: "hsl(var(--terracotta-500))", fontStyle: "italic", fontWeight: 300 }}>
                      quiet promise{visibleGoals.length === 1 ? "" : "s"}
                    </em>
                    <span className="block">
                      {isYearFolder ? "for the year ahead." : "in this folder."}
                    </span>
                  </>
                )}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "rgba(251,247,241,0.72)",
                  marginTop: 14,
                  maxWidth: 440,
                }}
              >
                The ones in motion are getting quiet attention; the ones not started are still
                waiting. That's okay.
              </p>
            </div>

            {/* Year stats */}
            <div
              className="relative z-10 grid content-center gap-5"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              {isYearFolder && (
                <>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 400,
                        fontSize: 44,
                        letterSpacing: "-0.02em",
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {yearPct}
                      <span style={{ fontSize: 22, color: "rgba(251,247,241,0.4)" }}> %</span>
                    </div>
                    <div
                      className="mt-1.5 font-semibold uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        color: "rgba(251,247,241,0.5)",
                      }}
                    >
                      Year complete
                    </div>
                    <div
                      className="relative mt-2.5 h-1 overflow-hidden rounded-full"
                      style={{ background: "rgba(251,247,241,0.1)" }}
                    >
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${yearPct}%`,
                          background: "hsl(var(--terracotta-500))",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 400,
                        fontSize: 44,
                        letterSpacing: "-0.02em",
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {daysLeft}
                      <span style={{ fontSize: 22, color: "rgba(251,247,241,0.4)" }}> d</span>
                    </div>
                    <div
                      className="mt-1.5 font-semibold uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        color: "rgba(251,247,241,0.5)",
                      }}
                    >
                      Left in year
                    </div>
                  </div>
                </>
              )}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 32,
                    letterSpacing: "-0.02em",
                    color: "hsl(var(--terracotta-500))",
                    lineHeight: 1,
                  }}
                >
                  {inMotion}
                </div>
                <div
                  className="mt-1.5 font-semibold uppercase"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "rgba(251,247,241,0.5)",
                  }}
                >
                  In motion
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 32,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {planning}
                </div>
                <div
                  className="mt-1.5 font-semibold uppercase"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "rgba(251,247,241,0.5)",
                  }}
                >
                  Planning
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            className="flex flex-wrap items-center justify-between gap-4"
            style={{ margin: "28px 0 18px" }}
          >
            <div
              className="flex gap-1.5"
              style={{
                padding: 4,
                background: "hsl(var(--paper-200))",
                borderRadius: 999,
              }}
            >
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className="whitespace-nowrap"
                    style={{
                      padding: "6px 14px",
                      border: 0,
                      borderRadius: 999,
                      cursor: "pointer",
                      background: isActive ? "#fff" : "transparent",
                      color: isActive ? "hsl(var(--ink-900))" : "hsl(var(--fg-secondary))",
                      fontFamily: "var(--font-body)",
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 500,
                      boxShadow: isActive ? "0 1px 2px rgba(31,27,23,0.06)" : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center gap-3"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "hsl(var(--fg-secondary))",
              }}
            >
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="bg-transparent transition-colors hover:text-[hsl(var(--ink-900))]"
                style={{ border: 0, cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: 13 }}
              >
                {showArchived ? "Active" : "Archived"}
              </button>
              <span style={{ color: "hsl(var(--border-default))" }}>|</span>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" /> Grid
              </span>
            </div>
          </div>

          {/* Goals grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gridAutoRows: "minmax(240px, auto)",
              gap: 18,
            }}
          >
            {filteredGoals.map((g, i) => (
              <EditorialGoalCard
                key={g.id}
                goal={g}
                targets={targetsFor(g.id)}
                folders={allFolders.filter((f) => f.id !== folder.id)}
                hero={i === 0 && activeFilter === "all"}
                onEdit={(goal) => {
                  setEditingGoal(goal);
                  setDialogOpen(true);
                }}
                onMoveToFolder={handleMoveGoalToFolder}
                onArchive={handleArchiveGoal}
                onDelete={(goalId) =>
                  confirmDelete("Delete this goal?", () => handleDeleteGoal(goalId))
                }
              />
            ))}
            {!showArchived && (
              <NewEditorialGoalCard
                onClick={() => {
                  setEditingGoal(null);
                  setDialogOpen(true);
                }}
                folderName={folder.name}
              />
            )}
          </div>

          {filteredGoals.length === 0 && activeFilter !== "all" && (
            <div className="mt-8 text-center" style={{ color: "hsl(var(--fg-muted))", fontFamily: "var(--font-body)", fontSize: 13 }}>
              No goals match this filter.
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
        existingTargets={editingGoal ? targets.filter((t) => t.goal_id === editingGoal.id) : []}
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

export default GoalFolderDetail;

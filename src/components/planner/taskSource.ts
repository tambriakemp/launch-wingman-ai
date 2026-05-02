import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

export type TaskSource = "Launch" | "Social" | "Goal" | "Habit" | "Personal" | "AI";

export const SOURCE_HUES: Record<TaskSource, { bg: string; fg: string; dot: string }> = {
  Launch:   { bg: "rgba(168, 110, 156, 0.10)", fg: "#7B4F73", dot: "#A86E9C" },
  Social:   { bg: "rgba(198, 90, 62, 0.10)",  fg: "#A14730", dot: "#C65A3E" },
  Goal:     { bg: "rgba(212, 174, 122, 0.18)", fg: "#7A5A2E", dot: "#B98A4D" },
  Habit:    { bg: "rgba(126, 144, 110, 0.14)", fg: "#475838", dot: "#7E906E" },
  Personal: { bg: "rgba(31, 27, 23, 0.06)",   fg: "#3A332C", dot: "#615248" },
  AI:       { bg: "rgba(198, 90, 62, 0.08)",  fg: "#A14730", dot: "#C65A3E" },
};

export function getTaskSource(
  task: PlannerTask,
  spaces: PlannerSpace[] = [],
  categories: SpaceCategory[] = []
): TaskSource {
  const tt = (task.task_type || "").toLowerCase();
  if (tt === "habit") return "Habit";
  if (tt === "goal") return "Goal";

  const space = spaces.find((s) => s.id === (task as any).space_id);
  const cat = categories.find((c) => c.id === task.category);
  const hay = `${space?.name || ""} ${cat?.name || ""} ${task.title || ""}`.toLowerCase();

  if (/\b(habit|routine)\b/.test(hay)) return "Habit";
  if (/\b(goal|review|quarter)\b/.test(hay)) return "Goal";
  if (/\b(launch|sales page|email|funnel|webinar|offer)\b/.test(hay)) return "Launch";
  if (/\b(social|carousel|post|instagram|tiktok|reel|thread|facebook|pinterest)\b/.test(hay)) return "Social";
  if (/\b(ai|hook generator|prompt|chatgpt|gemini)\b/.test(hay)) return "AI";

  // Default: any task tied to a non-personal space → Launch
  if (space && !/personal/i.test(space.name)) return "Launch";
  return "Personal";
}

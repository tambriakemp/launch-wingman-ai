import { useState, useCallback } from "react";

const STORAGE_KEY = "planner_status_visibility";

export const ALL_STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "in-review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
  { id: "abandoned", label: "Abandoned" },
] as const;

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  todo: true,
  "in-progress": true,
  "in-review": true,
  done: true,
  blocked: true,
  abandoned: true,
};

function loadVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_VISIBILITY, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_VISIBILITY };
}

export function useStatusVisibility() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(loadVisibility);

  const toggle = useCallback((statusId: string) => {
    setVisibility((prev) => {
      const next = { ...prev, [statusId]: !prev[statusId] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isVisible = useCallback(
    (statusId: string) => visibility[statusId] !== false,
    [visibility]
  );

  return { visibility, toggle, isVisible };
}

import { useState, useEffect, useCallback } from "react";

export interface HabitTag {
  name: string;
  color: string;
}

const STORAGE_KEY = "habits.tags.v1";
const DEFAULTS: HabitTag[] = [
  { name: "Care", color: "#C65A3E" },
  { name: "Body", color: "#4F6B52" },
  { name: "Mind", color: "#6B3A5C" },
  { name: "Rhythm", color: "#C48B2E" },
  { name: "Launch", color: "#8F857B" },
];

function load(): HabitTag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULTS;
    return parsed;
  } catch {
    return DEFAULTS;
  }
}

function persist(tags: HabitTag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  window.dispatchEvent(new CustomEvent("habits:tags-changed"));
}

/**
 * Local-first CRUD for habit tags. Persisted in localStorage so the same
 * user keeps their taxonomy across sessions on the same device.
 */
export function useHabitTags() {
  const [tags, setTags] = useState<HabitTag[]>(() => load());

  useEffect(() => {
    const sync = () => setTags(load());
    window.addEventListener("habits:tags-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("habits:tags-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const create = useCallback((name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTags((prev) => {
      if (prev.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, { name: trimmed, color }];
      persist(next);
      return next;
    });
  }, []);

  const update = useCallback((oldName: string, name: string, color: string) => {
    setTags((prev) => {
      const next = prev.map((t) => (t.name === oldName ? { name: name.trim() || t.name, color } : t));
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((name: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t.name !== name);
      persist(next);
      return next;
    });
  }, []);

  const colorFor = useCallback(
    (name: string | null | undefined) => tags.find((t) => t.name === name)?.color ?? "#4F6B52",
    [tags]
  );

  return { tags, create, update, remove, colorFor };
}

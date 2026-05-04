import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { ChevronRight, Sparkles, ArrowRight, X, Check, Folder, Calendar as CalIcon, Flame, Flag, Repeat, Bell, StickyNote, Loader2, Wand2, Search, Plus, Trash2, ListChecks } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/utils";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";
import type { PlannerTask } from "@/components/planner/PlannerTaskDialog";

interface Subtask {
  id: string;
  task_id?: string;
  title: string;
  completed: boolean;
  position: number;
  _local?: boolean;
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  notes: z.string().max(2000, "Notes are too long").optional(),
});

const SF = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const SERIF = '"Fraunces", "New York", Georgia, serif';
const TERRACOTTA = "#C65A3E";
const PAPER = "#FBF7F1";
const INK = "#1F1B17";
const INK_60 = "rgba(31,27,23,0.62)";
const INK_40 = "rgba(31,27,23,0.42)";
const INK_20 = "rgba(31,27,23,0.20)";
const HAIRLINE = "rgba(31,27,23,0.10)";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<PlannerTask>) => Promise<string | void>;
  onUpdate?: (id: string, data: Partial<PlannerTask>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  selectedSpaceId: string | null;
  onCreateCategory?: (spaceId: string, name: string, color?: string) => Promise<SpaceCategory | null>;
  editTask?: PlannerTask | null;
}

const CATEGORY_PALETTE = ["#E0B341", "#7E906E", "#C65A3E", "#7C6FB3", "#5B8FB9", "#D08AA1", "#4FAF8C", "#E08A3F"];

const PRIORITIES = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

type PickerType = null | "space" | "category" | "priority" | "due";

export function MobileAddTaskSheet({ open, onClose, onCreate, onUpdate, onDelete, spaces, categories, selectedSpaceId, onCreateCategory, editTask }: Props) {
  const isEdit = !!editTask;
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(selectedSpaceId);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("normal");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categorySearchRef = useRef<HTMLInputElement>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const fetchSubtasks = useCallback(async (taskId: string) => {
    const { data } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    if (data) setSubtasks(data as unknown as Subtask[]);
  }, []);

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title || "");
        setNotes(editTask.description || "");
        setSpaceId((editTask as any).space_id || selectedSpaceId);
        setCategoryId(editTask.category || null);
        setPriority((editTask as any).priority || "normal");
        const d = editTask.due_at || editTask.start_at;
        setDueAt(d ? new Date(d) : null);
        fetchSubtasks(editTask.id);
      } else {
        setTitle("");
        setNotes("");
        setSpaceId(selectedSpaceId);
        setCategoryId(null);
        setPriority("normal");
        setDueAt(null);
        setSubtasks([]);
      }
      setPicker(null);
      setSuggestions([]);
      setCategoryQuery("");
      setNewSubtaskTitle("");
      requestAnimationFrame(() => setMounted(true));
      if (!editTask) setTimeout(() => inputRef.current?.focus(), 240);
    } else {
      setMounted(false);
    }
  }, [open, selectedSpaceId, editTask, fetchSubtasks]);

  // Debounced AI suggestions while typing (only in create mode).
  useEffect(() => {
    if (!open || isEdit) return;
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke("parse-task-nl", {
          body: { mode: "suggest", partial: trimmed },
        });
        if (!error && data?.suggestions) {
          setSuggestions(
            (data.suggestions as string[])
              .filter((s) => s && s.toLowerCase() !== trimmed.toLowerCase())
              .slice(0, 4)
          );
        }
      } catch { /* silent */ }
      finally { setLoadingSuggestions(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, open, isEdit]);

  const space = useMemo(() => spaces.find((s) => s.id === spaceId) || null, [spaces, spaceId]);
  const spaceCategories = useMemo(
    () => categories.filter((c) => c.space_id === spaceId),
    [categories, spaceId]
  );
  const category = spaceCategories.find((c) => c.id === categoryId) || null;
  const isComposer = title.trim().length === 0;

  const handleAIParse = async () => {
    const input = title.trim();
    if (!input || parsing) return;
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-task-nl", {
        body: { mode: "parse", input },
      });
      if (error) throw error;
      if (data?.title) setTitle(data.title);
      if (data?.due_date) {
        const d = new Date(data.due_date);
        if (!isNaN(d.getTime())) setDueAt(d);
      }
      if (data?.priority) setPriority(data.priority);
      toast.success("Parsed", { description: "Filled fields from your sentence." });
    } catch (e: any) {
      toast.error("Couldn't parse", { description: e?.message || "Try editing manually." });
    } finally {
      setParsing(false);
    }
  };

  const flushSubtasksForTask = async (taskId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const local = subtasks.filter((s) => s._local);
    if (local.length === 0) return;
    await supabase.from("subtasks").insert(
      local.map((s, i) => ({
        task_id: taskId,
        user_id: uid,
        title: s.title,
        completed: s.completed,
        position: i,
      })) as any
    );
  };

  const handleSave = async () => {
    if (submitting) return;
    const result = taskSchema.safeParse({ title: title.trim(), notes: notes.trim() });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Invalid task");
      return;
    }
    setSubmitting(true);
    try {
      const dueIso = dueAt ? dueAt.toISOString() : null;
      const payload: Partial<PlannerTask> = {
        title: toTitleCase(result.data.title),
        description: result.data.notes || "",
        task_type: "task",
        priority,
        category: categoryId,
        due_at: dueIso,
        start_at: dueIso,
        end_at: dueIso,
        ...(({ space_id: spaceId } as any)),
      };
      if (isEdit && editTask && onUpdate) {
        await onUpdate(editTask.id, payload);
      } else {
        const newId = await onCreate({ ...payload, column_id: "todo" });
        if (typeof newId === "string") {
          await flushSubtasksForTask(newId);
        }
      }
      onClose();
    } catch (e: any) {
      toast.error(isEdit ? "Couldn't update task" : "Couldn't add task", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Subtask handlers ---
  const addSubtask = async () => {
    const t = newSubtaskTitle.trim();
    if (!t) return;
    if (isEdit && editTask) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { error } = await supabase.from("subtasks").insert({
        task_id: editTask.id,
        user_id: userData.user.id,
        title: toTitleCase(t),
        position: subtasks.length,
      });
      if (error) { toast.error("Failed to add subtask"); return; }
      setNewSubtaskTitle("");
      fetchSubtasks(editTask.id);
    } else {
      // Buffer locally; flush on save
      setSubtasks((prev) => [...prev, {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        title: toTitleCase(t),
        completed: false,
        position: prev.length,
        _local: true,
      }]);
      setNewSubtaskTitle("");
    }
  };

  const toggleSubtask = async (st: Subtask) => {
    if (st._local || !isEdit) {
      setSubtasks((prev) => prev.map((s) => s.id === st.id ? { ...s, completed: !s.completed } : s));
      return;
    }
    setSubtasks((prev) => prev.map((s) => s.id === st.id ? { ...s, completed: !s.completed } : s));
    await supabase.from("subtasks").update({ completed: !st.completed }).eq("id", st.id);
  };

  const deleteSubtask = async (st: Subtask) => {
    if (st._local || !isEdit) {
      setSubtasks((prev) => prev.filter((s) => s.id !== st.id));
      return;
    }
    setSubtasks((prev) => prev.filter((s) => s.id !== st.id));
    await supabase.from("subtasks").delete().eq("id", st.id);
  };

  const handleDeleteTask = async () => {
    if (!isEdit || !editTask || !onDelete) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await onDelete(editTask.id);
      onClose();
    } catch (e: any) {
      toast.error("Couldn't delete task", { description: e?.message });
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        background: mounted ? "rgba(31,27,23,0.40)" : "rgba(31,27,23,0)",
        transition: "background 240ms ease",
      }}
    >
      <div onClick={onClose} style={{ flex: 1 }} />

      <div
        style={{
          background: PAPER,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          boxShadow: "0 -10px 40px rgba(31,27,23,0.18)",
          maxHeight: "92%",
          display: "flex",
          flexDirection: "column",
          transform: mounted ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        {/* drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 36, height: 5, borderRadius: 999, background: INK_20 }} />
        </div>

        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 18px 12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              fontFamily: SF,
              fontSize: 15.5,
              color: INK_60,
              fontWeight: 500,
              letterSpacing: -0.2,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: -0.4,
              color: INK,
            }}
          >
            {isEdit ? "Edit task" : "New task"}
          </div>
          <button
            onClick={handleSave}
            disabled={isComposer || submitting}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              fontFamily: SF,
              fontSize: 15.5,
              color: isComposer ? INK_40 : TERRACOTTA,
              fontWeight: 700,
              letterSpacing: -0.2,
              cursor: isComposer ? "default" : "pointer",
            }}
          >
            Save
          </button>
        </div>

        {/* AI composer */}
        <div style={{ padding: "4px 16px 0" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: `1.5px solid ${isComposer ? "rgba(198,90,62,0.45)" : HAIRLINE}`,
              padding: "14px 16px",
              boxShadow: isComposer ? "0 0 0 4px rgba(198,90,62,0.10)" : "0 1px 2px rgba(31,27,23,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <Sparkles size={14} color={TERRACOTTA} strokeWidth={2.2} />
              <span
                style={{
                  fontFamily: SF,
                  fontSize: 11,
                  fontWeight: 700,
                  color: TERRACOTTA,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {isEdit ? "Title" : "Type naturally"}
              </span>
            </div>
            <textarea
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              placeholder="Sales page review with Tam Tuesday at 2pm…"
              style={{
                width: "100%",
                border: 0,
                outline: "none",
                resize: "none",
                background: "transparent",
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: 19,
                lineHeight: 1.3,
                letterSpacing: -0.4,
                color: INK,
                fontStyle: isComposer ? "italic" : "normal",
              }}
            />
            {!isEdit && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleAIParse}
                disabled={isComposer || parsing}
                style={{
                  background: "rgba(198,90,62,0.10)",
                  color: TERRACOTTA,
                  border: 0,
                  borderRadius: 999,
                  padding: "6px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: SF,
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: -0.1,
                  cursor: isComposer ? "default" : "pointer",
                  opacity: isComposer ? 0.5 : 1,
                }}
              >
                {parsing
                  ? <Loader2 size={13} color={TERRACOTTA} strokeWidth={2} className="animate-spin" />
                  : <Wand2 size={13} color={TERRACOTTA} strokeWidth={2} />}
                {parsing ? "Parsing…" : "Parse with AI"}
              </button>
              {loadingSuggestions && suggestions.length === 0 && (
                <span style={{ fontFamily: SF, fontSize: 12, color: INK_40 }}>Thinking…</span>
              )}
            </div>
            )}
            {suggestions.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setTitle(s); setSuggestions([]); }}
                    style={{
                      background: "rgba(31,27,23,0.05)",
                      color: INK,
                      border: `1px solid ${HAIRLINE}`,
                      borderRadius: 999,
                      padding: "5px 10px",
                      fontFamily: SF,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* fields scroller */}
        <div
          style={{
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            flex: 1,
            paddingTop: 18,
          }}
        >
          <FieldGroup>
            <Field
              icon={<Folder size={16} color="#fff" strokeWidth={2} />}
              iconBg="#C65A3E"
              label="Space"
              value={space?.name || "Choose space"}
              valueDot={space?.color || null}
              placeholder={!space}
              divider
              onClick={() => setPicker("space")}
            />
            <Field
              icon={<CalIcon size={16} color="#fff" strokeWidth={2} />}
              iconBg="#A86E9C"
              label="Due"
              value={dueAt ? format(dueAt, "EEE, MMM d · h:mma").toLowerCase() : "No date"}
              placeholder={!dueAt}
              divider
              onClick={() => setPicker("due")}
            />
            <Field
              icon={<Flame size={16} color="#fff" strokeWidth={2} />}
              iconBg="#7E906E"
              label="Category"
              value={category?.name || "No category"}
              placeholder={!category}
              divider
              onClick={() => setPicker("category")}
            />
            <Field
              icon={<Flag size={16} color="#fff" strokeWidth={2} />}
              iconBg="#C9A84A"
              label="Priority"
              value={PRIORITIES.find((p) => p.id === priority)?.label || "Normal"}
              placeholder={priority === "normal"}
              divider
              onClick={() => setPicker("priority")}
            />
            <Field
              icon={<Repeat size={16} color="#fff" strokeWidth={2} />}
              iconBg="#7B8FA1"
              label="Repeat"
              value="One-time"
              placeholder
              divider
            />
            <Field
              icon={<Bell size={16} color="#fff" strokeWidth={2} />}
              iconBg="#615248"
              label="Remind me"
              value="Off"
              placeholder
            />
          </FieldGroup>

          {/* Notes */}
          <div style={{ padding: "24px 22px 6px" }}>
            <div
              style={{
                fontFamily: SF,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: INK_60,
              }}
            >
              Notes
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              margin: "0 16px",
              padding: "14px 16px",
              minHeight: 84,
              boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
            }}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes, links, anything that helps future-you…"
              rows={3}
              style={{
                width: "100%",
                border: 0,
                outline: "none",
                resize: "none",
                background: "transparent",
                fontFamily: SF,
                fontSize: 14.5,
                color: INK,
                letterSpacing: -0.2,
                lineHeight: 1.45,
              }}
            />
          </div>

          {/* Subtasks */}
          <div style={{ padding: "24px 22px 6px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div
              style={{
                fontFamily: SF,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: INK_60,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ListChecks size={13} color={INK_60} strokeWidth={2.2} />
              Subtasks
              {subtasks.length > 0 && (
                <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 600, color: INK_40, letterSpacing: 0.2 }}>
                  · {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              margin: "0 16px",
              boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
              overflow: "hidden",
            }}
          >
            {subtasks.map((st, i) => (
              <SubtaskRow
                key={st.id}
                subtask={st}
                isLast={i === subtasks.length - 1}
                onToggle={() => toggleSubtask(st)}
                onDelete={() => deleteSubtask(st)}
              />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "rgba(198,90,62,0.10)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Plus size={13} color={TERRACOTTA} strokeWidth={2.6} />
              </span>
              <input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask"
                enterKeyHint="done"
                autoCapitalize="sentences"
                style={{
                  flex: 1,
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  fontFamily: SF,
                  fontSize: 15,
                  color: INK,
                  letterSpacing: -0.2,
                }}
              />
              {newSubtaskTitle.trim().length > 0 && (
                <button
                  type="button"
                  onClick={addSubtask}
                  style={{
                    background: TERRACOTTA,
                    color: PAPER,
                    border: 0,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontFamily: SF,
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: -0.1,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {isEdit && onDelete && (
            <div style={{ padding: "20px 16px 4px" }}>
              <button
                type="button"
                onClick={handleDeleteTask}
                style={{
                  width: "100%",
                  background: "rgba(198,90,62,0.08)",
                  color: TERRACOTTA,
                  border: 0,
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontFamily: SF,
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Trash2 size={15} color={TERRACOTTA} strokeWidth={2} />
                Delete task
              </button>
            </div>
          )}

          <div style={{ height: 100 }} />
        </div>

        {/* sticky bottom */}
        <div
          style={{
            padding: "12px 16px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            background: "rgba(251,247,241,0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderTop: `0.5px solid ${HAIRLINE}`,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: 0,
              background: "rgba(31,27,23,0.06)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Note"
          >
            <StickyNote size={18} color={INK} strokeWidth={1.8} />
          </button>
          <button
            onClick={handleSave}
            disabled={isComposer || submitting}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 14,
              border: 0,
              background: isComposer ? "rgba(31,27,23,0.20)" : INK,
              color: PAPER,
              fontFamily: SF,
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: isComposer ? "default" : "pointer",
              boxShadow: isComposer ? "none" : "0 4px 14px -4px rgba(31,27,23,0.4)",
            }}
          >
            {isComposer ? "Type to add task" : submitting ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save changes" : "Add task")}
            {!isComposer && !submitting && <ArrowRight size={16} color={PAPER} strokeWidth={2.4} />}
          </button>
        </div>
      </div>

      {/* Pickers */}
      {picker && (
        <PickerSheet onClose={() => setPicker(null)} title={
          picker === "space" ? "Choose space"
          : picker === "category" ? "Choose category"
          : picker === "priority" ? "Priority"
          : "Due date"
        }>
          {picker === "space" && (
            <>
              <PickerRow active={spaceId === null} label="No space" onClick={() => { setSpaceId(null); setCategoryId(null); setPicker(null); }} />
              {spaces.map((s) => (
                <PickerRow
                  key={s.id}
                  active={spaceId === s.id}
                  label={s.name}
                  dot={s.color}
                  onClick={() => { setSpaceId(s.id); setCategoryId(null); setPicker(null); }}
                />
              ))}
            </>
          )}
          {picker === "category" && (() => {
            const q = categoryQuery.trim();
            const qLower = q.toLowerCase();
            const filtered = q
              ? spaceCategories.filter(c => c.name.toLowerCase().includes(qLower))
              : spaceCategories;
            const exactMatch = spaceCategories.some(c => c.name.toLowerCase() === qLower);
            const canCreate = !!spaceId && q.length > 0 && q.length <= 40 && !exactMatch && !!onCreateCategory;
            const handleCreate = async () => {
              if (!canCreate || creatingCategory) return;
              setCreatingCategory(true);
              try {
                const name = toTitleCase(q);
                const color = CATEGORY_PALETTE[spaceCategories.length % CATEGORY_PALETTE.length];
                const created = await onCreateCategory!(spaceId!, name, color);
                if (created) {
                  try { (navigator as any).vibrate?.(8); } catch {}
                  setCategoryId(created.id);
                  setCategoryQuery("");
                  setPicker(null);
                }
              } finally {
                setCreatingCategory(false);
              }
            };
            return (
              <>
                {spaceId && (
                  <div style={{ position: "sticky", top: 0, background: PAPER, paddingBottom: 8, zIndex: 1 }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Search size={15} color={INK_40} strokeWidth={2} style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
                      <input
                        ref={categorySearchRef}
                        autoFocus
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filtered.length > 0) {
                              setCategoryId(filtered[0].id);
                              setPicker(null);
                            } else if (canCreate) {
                              handleCreate();
                            }
                          }
                        }}
                        placeholder="Search or create category"
                        inputMode="search"
                        enterKeyHint="done"
                        autoCapitalize="words"
                        autoCorrect="off"
                        style={{
                          width: "100%",
                          height: 40,
                          borderRadius: 12,
                          border: `1px solid ${HAIRLINE}`,
                          background: "#fff",
                          padding: "0 36px 0 34px",
                          fontFamily: SF,
                          fontSize: 16,
                          color: INK,
                          outline: "none",
                          WebkitAppearance: "none",
                        }}
                      />
                      {categoryQuery && (
                        <button
                          type="button"
                          onClick={() => { setCategoryQuery(""); categorySearchRef.current?.focus(); }}
                          aria-label="Clear search"
                          style={{ position: "absolute", right: 8, width: 24, height: 24, borderRadius: 999, border: 0, background: "rgba(31,27,23,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <X size={12} color={INK} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!q && <PickerRow active={categoryId === null} label="No category" onClick={() => { setCategoryId(null); setPicker(null); }} />}
                {filtered.map((c) => (
                  <PickerRow
                    key={c.id}
                    active={categoryId === c.id}
                    label={c.name}
                    dot={c.color}
                    onClick={() => { setCategoryId(c.id); setPicker(null); }}
                  />
                ))}
                {canCreate && (
                  <button
                    onClick={handleCreate}
                    disabled={creatingCategory}
                    style={{
                      width: "100%",
                      background: "rgba(198,90,62,0.08)",
                      border: `1px dashed rgba(198,90,62,0.35)`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: TERRACOTTA, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {creatingCategory ? <Loader2 size={11} color={PAPER} className="animate-spin" /> : <Plus size={12} color={PAPER} strokeWidth={2.6} />}
                    </span>
                    <span style={{ flex: 1, fontFamily: SF, fontSize: 15, fontWeight: 500, color: INK, letterSpacing: -0.2 }}>
                      Create "<span style={{ color: TERRACOTTA, fontWeight: 600 }}>{toTitleCase(q)}</span>"
                    </span>
                  </button>
                )}
                {spaceCategories.length === 0 && !q && (
                  <div style={{ padding: 16, fontFamily: SF, fontSize: 13, color: INK_60, textAlign: "center" }}>
                    {spaceId ? "No categories yet — type a name above to create one." : "Pick a space first"}
                  </div>
                )}
                {q && filtered.length === 0 && !canCreate && spaceId && (
                  <div style={{ padding: 16, fontFamily: SF, fontSize: 13, color: INK_60, textAlign: "center" }}>
                    No matches.
                  </div>
                )}
              </>
            );
          })()}
          {picker === "priority" && (
            <>
              {PRIORITIES.map((p) => (
                <PickerRow
                  key={p.id}
                  active={priority === p.id}
                  label={p.label}
                  onClick={() => { setPriority(p.id); setPicker(null); }}
                />
              ))}
            </>
          )}
          {picker === "due" && (
            <div style={{ padding: 16 }}>
              <input
                type="datetime-local"
                value={dueAt ? format(dueAt, "yyyy-MM-dd'T'HH:mm") : ""}
                onChange={(e) => setDueAt(e.target.value ? new Date(e.target.value) : null)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${HAIRLINE}`,
                  padding: "0 14px",
                  fontFamily: SF,
                  fontSize: 16,
                  background: "#fff",
                  color: INK,
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => { setDueAt(null); setPicker(null); }}
                  style={{ flex: 1, height: 40, borderRadius: 12, border: 0, background: "rgba(31,27,23,0.06)", fontFamily: SF, fontSize: 14, fontWeight: 600, color: INK, cursor: "pointer" }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setPicker(null)}
                  style={{ flex: 1, height: 40, borderRadius: 12, border: 0, background: INK, color: PAPER, fontFamily: SF, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </PickerSheet>
      )}
    </div>
  );
}

function Field({
  icon,
  iconBg,
  label,
  value,
  valueDot,
  placeholder,
  divider,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueDot?: string | null;
  placeholder?: boolean;
  divider?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: "100%",
        background: "#fff",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: divider ? `0.5px solid ${HAIRLINE}` : "none",
        border: 0,
        borderTop: 0,
        borderLeft: 0,
        borderRight: 0,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flexShrink: 0,
          background: iconBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <span style={{ fontFamily: SF, fontSize: 15, fontWeight: 500, color: INK, letterSpacing: -0.2 }}>
        {label}
      </span>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: SF,
          fontSize: 14.5,
          fontWeight: 500,
          color: placeholder ? INK_40 : INK,
          letterSpacing: -0.2,
        }}
      >
        {valueDot && <span style={{ width: 7, height: 7, borderRadius: 999, background: valueDot }} />}
        {value}
      </div>
      <ChevronRight size={14} color={INK_40} strokeWidth={2} />
    </button>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        margin: "0 16px",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function PickerSheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "rgba(31,27,23,0.40)" }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{ background: PAPER, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: "calc(16px + env(safe-area-inset-bottom))", maxHeight: "70%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 36, height: 5, borderRadius: 999, background: INK_20 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px 12px" }}>
          <div style={{ width: 28 }} />
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 17, fontWeight: 500, color: INK }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 28, height: 28, border: 0, borderRadius: 999, background: "rgba(31,27,23,0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color={INK} strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 12px 12px" }}>{children}</div>
      </div>
    </div>
  );
}

function PickerRow({ label, dot, active, onClick }: { label: string; dot?: string | null; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: active ? "rgba(198,90,62,0.08)" : "#fff",
        border: 0,
        borderRadius: 12,
        padding: "12px 14px",
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {dot ? (
        <span style={{ width: 10, height: 10, borderRadius: 999, background: dot }} />
      ) : (
        <span style={{ width: 10 }} />
      )}
      <span style={{ flex: 1, fontFamily: SF, fontSize: 15, fontWeight: 500, color: INK, letterSpacing: -0.2 }}>{label}</span>
      {active && <Check size={16} color={TERRACOTTA} strokeWidth={2.4} />}
    </button>
  );
}

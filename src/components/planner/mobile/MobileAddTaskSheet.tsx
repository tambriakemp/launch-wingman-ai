import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronRight, Sparkles, Mic, Link as LinkIcon, ArrowRight, X, Check, Folder, Calendar as CalIcon, Flame, Flag, Repeat, Bell, StickyNote } from "lucide-react";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";
import type { PlannerTask } from "@/components/planner/PlannerTaskDialog";

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
  onCreate: (data: Partial<PlannerTask>) => Promise<void>;
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  selectedSpaceId: string | null;
}

const PRIORITIES = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

type PickerType = null | "space" | "category" | "priority" | "due";

export function MobileAddTaskSheet({ open, onClose, onCreate, spaces, categories, selectedSpaceId }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(selectedSpaceId);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("normal");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setNotes("");
      setSpaceId(selectedSpaceId);
      setCategoryId(null);
      setPriority("normal");
      setDueAt(null);
      setPicker(null);
      requestAnimationFrame(() => setMounted(true));
      setTimeout(() => inputRef.current?.focus(), 240);
    } else {
      setMounted(false);
    }
  }, [open, selectedSpaceId]);

  const space = useMemo(() => spaces.find((s) => s.id === spaceId) || null, [spaces, spaceId]);
  const spaceCategories = useMemo(
    () => categories.filter((c) => c.space_id === spaceId),
    [categories, spaceId]
  );
  const category = spaceCategories.find((c) => c.id === categoryId) || null;
  const isComposer = title.trim().length === 0;

  const handleSave = async () => {
    if (isComposer || submitting) return;
    setSubmitting(true);
    try {
      const dueIso = dueAt ? dueAt.toISOString() : null;
      await onCreate({
        title: title.trim(),
        description: notes.trim(),
        column_id: "todo",
        task_type: "task",
        priority,
        category: categoryId,
        due_at: dueIso,
        start_at: dueIso,
        end_at: dueIso,
        ...(({ space_id: spaceId } as any)),
      });
      onClose();
    } finally {
      setSubmitting(false);
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
            New task
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
                Type naturally
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <button
                type="button"
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
                  cursor: "pointer",
                }}
              >
                <Mic size={13} color={TERRACOTTA} strokeWidth={2} /> Voice
              </button>
              <button
                type="button"
                style={{
                  background: "rgba(31,27,23,0.06)",
                  color: INK,
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
                  cursor: "pointer",
                }}
              >
                <LinkIcon size={13} color={INK} strokeWidth={2} /> Paste
              </button>
            </div>
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
            {isComposer ? "Type to add task" : submitting ? "Adding…" : "Add task"}
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
          {picker === "category" && (
            <>
              <PickerRow active={categoryId === null} label="No category" onClick={() => { setCategoryId(null); setPicker(null); }} />
              {spaceCategories.length === 0 && (
                <div style={{ padding: 16, fontFamily: SF, fontSize: 13, color: INK_60, textAlign: "center" }}>
                  {spaceId ? "No categories in this space" : "Pick a space first"}
                </div>
              )}
              {spaceCategories.map((c) => (
                <PickerRow
                  key={c.id}
                  active={categoryId === c.id}
                  label={c.name}
                  dot={c.color}
                  onClick={() => { setCategoryId(c.id); setPicker(null); }}
                />
              ))}
            </>
          )}
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

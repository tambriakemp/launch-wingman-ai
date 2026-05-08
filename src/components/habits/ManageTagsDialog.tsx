import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHabitTags, type HabitTag } from "@/hooks/useHabitTags";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SWATCHES = ["#C65A3E", "#4F6B52", "#6B3A5C", "#C48B2E", "#8F857B", "#1F1B17", "#E08F72", "#4A6FA5"];

export function ManageTagsDialog({ open, onOpenChange }: Props) {
  const { tags, create, update, remove } = useHabitTags();
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(SWATCHES[0]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[0]);

  const startEdit = (t: HabitTag) => {
    setEditing(t.name);
    setDraftName(t.name);
    setDraftColor(t.color);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!draftName.trim()) { toast.error("Tag name required"); return; }
    update(editing, draftName, draftColor);
    setEditing(null);
    toast.success("Tag updated");
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error("Tag name required"); return; }
    create(newName, newColor);
    setNewName("");
    setNewColor(SWATCHES[0]);
    toast.success("Tag added");
  };

  const handleDelete = (name: string) => {
    remove(name);
    toast.success("Tag removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hb-theme max-w-md" style={{ background: "var(--hb-cream)", border: "1px solid var(--hb-line)" }}>
        <DialogHeader>
          <DialogTitle>
            <span className="hb-display" style={{ fontWeight: 500, fontSize: 22, color: "var(--hb-ink)" }}>Manage tags</span>
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, maxHeight: 320, overflowY: "auto" }}>
          {tags.map((t) => (
            <div key={t.name} style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              {editing === t.name ? (
                <>
                  <ColorDots value={draftColor} onChange={setDraftColor} />
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    style={{ flex: 1, fontSize: 14, fontFamily: "var(--hb-body)", color: "var(--hb-ink)", background: "transparent", border: "none", outline: "none" }}
                  />
                  <button onClick={saveEdit} aria-label="Save" style={iconBtn}><Check className="w-4 h-4" style={{ color: "var(--hb-sage)" }} /></button>
                  <button onClick={() => setEditing(null)} aria-label="Cancel" style={iconBtn}><X className="w-4 h-4" style={{ color: "var(--hb-mute)" }} /></button>
                </>
              ) : (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.color }} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--hb-ink)" }}>{t.name}</div>
                  <button onClick={() => startEdit(t)} aria-label="Edit" style={iconBtn}><Pencil className="w-3.5 h-3.5" style={{ color: "var(--hb-mute)" }} /></button>
                  <button onClick={() => handleDelete(t.name)} aria-label="Delete" style={iconBtn}><Trash2 className="w-3.5 h-3.5" style={{ color: "var(--hb-terracotta)" }} /></button>
                </>
              )}
            </div>
          ))}
          {tags.length === 0 && (
            <div className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute)", padding: "12px 4px" }}>No tags yet — add one below.</div>
          )}
        </div>

        <div style={{ marginTop: 12, padding: 12, background: "var(--hb-warm)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="hb-eyebrow">New tag</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Energy"
              style={{ flex: 1, padding: "9px 12px", fontSize: 14, fontFamily: "var(--hb-body)", color: "var(--hb-ink)", background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 8, outline: "none" }}
            />
            <button onClick={handleCreate} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 500, color: "var(--hb-cream)", background: "var(--hb-ink)", border: "none", borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <ColorDots value={newColor} onChange={setNewColor} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: "none", cursor: "pointer", borderRadius: 6,
};

function ColorDots({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          style={{
            width: 22, height: 22, borderRadius: "50%", background: c,
            border: value === c ? "2px solid var(--hb-ink)" : "2px solid transparent",
            cursor: "pointer", padding: 0,
          }}
        />
      ))}
    </div>
  );
}

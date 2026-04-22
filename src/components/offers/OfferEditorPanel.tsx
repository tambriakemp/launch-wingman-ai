import { useEffect, useState } from "react";
import { Info, Sparkles, Copy, Trash2, X, Rocket, Image as ImageIcon } from "lucide-react";
import {
  EXPLAINERS,
  OFFER_FORMATS,
  OFFER_TYPES,
  type OfferDraft,
  type OfferTypeKey,
} from "./offerTypes";

interface Props {
  offer: OfferDraft | null;
  mode: "new" | "edit";
  onClose: () => void;
  onSave: (draft: OfferDraft) => void;
  onDuplicate: (draft: OfferDraft) => void;
  onDelete: (id: string) => void;
}

const STATUSES: OfferDraft["status"][] = ["idea", "draft", "live", "archived"];

const blankDraft = (): OfferDraft => ({
  id: null,
  type: "lead",
  title: "",
  format: "Ebook · PDF",
  description: "",
  price: 0,
  priceType: "Free",
  status: "draft",
  usedIn: { campaigns: 0, posts: 0, hooks: 0 },
});

export const OfferEditorPanel = ({
  offer,
  mode,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
}: Props) => {
  const [draft, setDraft] = useState<OfferDraft>(offer ?? blankDraft());
  const isNew = mode === "new" || !offer;
  const t = OFFER_TYPES[draft.type];
  const ex = EXPLAINERS[draft.type];

  useEffect(() => {
    setDraft(offer ?? blankDraft());
  }, [offer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[hsl(var(--ink-900)/0.32)] animate-in fade-in-0 duration-200"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-[81] flex w-[560px] max-w-[94vw] flex-col bg-[hsl(var(--paper-100))] shadow-[-24px_0_60px_rgba(31,27,23,0.18)] animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label={isNew ? "New offer" : "Edit offer"}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border-hairline))] px-7 pb-[18px] pt-[22px]">
          <div className="flex-1 min-w-0">
            <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--fg-muted))]">
              {isNew ? "New offer" : "Editing offer"}
            </div>
            <div
              className="mb-[10px] inline-flex items-center gap-[10px] rounded-full px-3 py-[4px] text-[12px] font-semibold"
              style={{ background: t.bg, color: t.color }}
            >
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: t.color }}
              />
              {t.label}
            </div>
            <h2 className="m-0 font-display text-[28px] leading-[1.1] tracking-[-0.01em] text-[hsl(var(--ink-900))]">
              {draft.title || "Untitled offer"}
            </h2>
            {!isNew && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <UsageChip icon={<Rocket className="h-3 w-3" />}>
                  {draft.usedIn.campaigns} campaigns
                </UsageChip>
                <UsageChip icon={<ImageIcon className="h-3 w-3" />}>
                  {draft.usedIn.posts} posts
                </UsageChip>
                <UsageChip icon={<Sparkles className="h-3 w-3" />}>
                  {draft.usedIn.hooks} hooks
                </UsageChip>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[hsl(var(--ink-800))] transition-colors hover:bg-[hsl(var(--ink-900)/0.05)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 pb-6 pt-5">
          {/* What is */}
          <div className="mb-5 rounded-xl border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-4 py-[14px]">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-[hsl(var(--ink-900))]">
              <Info className="h-3.5 w-3.5" />
              What is a {t.label.toLowerCase()}?
            </div>
            <div className="text-[13px] leading-[1.55] text-[hsl(var(--fg-muted))]">
              {ex.what}
              <div className="mt-2.5 font-medium text-[hsl(var(--ink-800))]">
                How it's used
              </div>
              <div className="mt-1">{ex.how}</div>
            </div>
          </div>

          {/* Offer type */}
          <FieldGroup label="Offer type" required>
            <Select
              value={draft.type}
              onChange={(v) => setDraft({ ...draft, type: v as OfferTypeKey })}
            >
              {(Object.entries(OFFER_TYPES) as [OfferTypeKey, typeof OFFER_TYPES[OfferTypeKey]][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v.label} — {v.stage}
                  </option>
                ),
              )}
            </Select>
          </FieldGroup>

          {/* Format */}
          <FieldGroup label="Offer format">
            <Select
              value={draft.format}
              onChange={(v) => setDraft({ ...draft, format: v })}
            >
              {OFFER_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </FieldGroup>

          {/* Title */}
          <FieldGroup label="Offer title">
            <TextInput
              value={draft.title}
              onChange={(v) => setDraft({ ...draft, title: v })}
              placeholder="e.g. The 'No-Sweat' Budget Builder"
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup label="Description">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What is this offer, who is it for, and what problem does it solve?"
              className="box-border block min-h-[96px] w-full resize-y rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white px-3.5 py-3 font-body text-[14px] leading-[1.5] text-[hsl(var(--ink-900))] outline-none focus:border-[hsl(var(--ink-900))]"
            />
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border-hairline))] bg-white px-3 py-1.5 font-body text-[12px] text-[hsl(var(--ink-900))] hover:bg-[hsl(var(--paper-200))]"
              >
                <Sparkles className="h-3 w-3" />
                Generate examples
              </button>
            </div>
          </FieldGroup>

          {/* Price + price type */}
          <div className="mb-[18px] grid grid-cols-2 gap-3">
            <FieldGroup label="Price" inline>
              <TextInput
                type="number"
                value={String(draft.price)}
                onChange={(v) => setDraft({ ...draft, price: Number(v) || 0 })}
                placeholder="e.g. 297"
              />
            </FieldGroup>
            <FieldGroup label="Price type" inline>
              <Select
                value={draft.priceType}
                onChange={(v) => setDraft({ ...draft, priceType: v as OfferDraft["priceType"] })}
              >
                <option>Free</option>
                <option>One-time</option>
                <option>/month</option>
                <option>/year</option>
                <option>Pay what you want</option>
              </Select>
            </FieldGroup>
          </div>

          {/* Status */}
          <FieldGroup label="Status">
            <div className="flex gap-2">
              {STATUSES.map((s) => {
                const active = draft.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft({ ...draft, status: s })}
                    className={`flex-1 rounded-lg border px-3 py-[9px] font-body text-[13px] capitalize transition-colors ${
                      active
                        ? "border-[hsl(var(--ink-900))] bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))]"
                        : "border-[hsl(var(--border-hairline))] bg-white text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--paper-200))]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-3 border-t border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-7 pb-5 pt-4">
          {!isNew && (
            <button
              type="button"
              onClick={() => draft.id && onDelete(draft.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 font-body text-[13px] text-[hsl(var(--terracotta-500))] hover:bg-[hsl(var(--terracotta-500)/0.08)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
          {!isNew && (
            <button
              type="button"
              onClick={() => onDuplicate(draft)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 font-body text-[13px] text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--ink-900)/0.06)]"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg px-3 font-body text-[13px] text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--ink-900)/0.06)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="inline-flex h-9 items-center rounded-lg bg-[hsl(var(--ink-900))] px-5 font-body text-[13px] font-medium text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
          >
            {isNew ? "Create offer" : "Save changes"}
          </button>
        </footer>
      </aside>
    </>
  );
};

// ---- Local primitives, scoped to this panel ---------------------------

const FieldGroup = ({
  label,
  required,
  inline,
  children,
}: {
  label: string;
  required?: boolean;
  inline?: boolean;
  children: React.ReactNode;
}) => (
  <div className={inline ? "" : "mb-[18px]"}>
    <label className="mb-2 block font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[hsl(var(--ink-800))]">
      {label}
      {required && <span className="ml-1 text-[hsl(var(--terracotta-500))]">*</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="box-border block h-11 w-full rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white px-3.5 font-body text-[14px] text-[hsl(var(--ink-900))] outline-none focus:border-[hsl(var(--ink-900))]"
  />
);

const Select = ({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="box-border block h-11 w-full appearance-none rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-18px)_18px,calc(100%-13px)_18px] bg-no-repeat px-3.5 font-body text-[14px] text-[hsl(var(--ink-900))] outline-none focus:border-[hsl(var(--ink-900))]"
    style={{
      backgroundImage:
        "linear-gradient(45deg, transparent 50%, hsl(var(--ink-800)) 50%), linear-gradient(135deg, hsl(var(--ink-800)) 50%, transparent 50%)",
    }}
  >
    {children}
  </select>
);

const UsageChip = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-2.5 py-1 font-body text-[12px] text-[hsl(var(--fg-muted))]">
    {icon}
    {children}
  </span>
);

export default OfferEditorPanel;

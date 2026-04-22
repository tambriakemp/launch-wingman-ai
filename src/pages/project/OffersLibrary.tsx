import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Rocket,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  ShoppingBag,
  GripVertical,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  OFFER_TYPES,
  type OfferDraft,
  type OfferTypeKey,
  normalizeOfferType,
  normalizePriceType,
  normalizeStatus,
} from "@/components/offers/offerTypes";
import { OfferEditorPanel } from "@/components/offers/OfferEditorPanel";

type View = "grid" | "list";

interface DbOffer {
  id: string;
  project_id: string;
  user_id: string;
  slot_type: string | null;
  slot_position: number | null;
  title: string | null;
  description: string | null;
  offer_type: string | null;
  offer_category: string | null;
  niche: string | null;
  price: number | null;
  price_type: string | null;
  is_required: boolean | null;
  funnel_id: string | null;
  updated_at: string | null;
}

// Map a raw DB row → an OfferDraft used by the UI.
const toDraft = (row: DbOffer): OfferDraft => ({
  id: row.id,
  type: normalizeOfferType(row.slot_type),
  title: row.title || "",
  format: (row.offer_type && row.offer_type !== "other" ? humanizeFormat(row.offer_type) : "Ebook · PDF"),
  description: row.description || "",
  price: row.price ? Number(row.price) : 0,
  priceType: normalizePriceType(row.price_type),
  status: normalizeStatus(undefined),
  usedIn: { campaigns: 0, posts: 0, hooks: 0 },
  updated: row.updated_at ? "recently" : undefined,
});

const humanizeFormat = (value: string) => {
  // Best-effort label so existing free-form offer_type values still render.
  return value
    .split(/[-_]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

const formatPrice = (price: number, priceType: OfferDraft["priceType"]) => {
  if (price === 0 || priceType === "Free") return "Free";
  const suffix =
    priceType === "/month" ? "/mo" : priceType === "/year" ? "/yr" : "";
  return `$${price}${suffix}`;
};

const STATUS_DOT: Record<OfferDraft["status"], string> = {
  live: "#4F6B52",
  draft: "#C48B2E",
  idea: "#9a8e82",
  archived: "#bbb",
};

const OffersLibrary = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | OfferTypeKey>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");
  const [editing, setEditing] = useState<{ offer: OfferDraft | null; mode: "new" | "edit" } | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["offers", projectId],
    queryFn: async () => {
      if (!projectId) return [] as DbOffer[];
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .order("slot_position", { ascending: true });
      if (error) throw error;
      return (data || []) as DbOffer[];
    },
    enabled: !!projectId,
  });

  const offers = useMemo(() => rows.map(toDraft), [rows]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: offers.length };
    (Object.keys(OFFER_TYPES) as OfferTypeKey[]).forEach((k) => {
      c[k] = offers.filter((o) => o.type === k).length;
    });
    return c;
  }, [offers]);

  const visible = offers.filter((o) => {
    if (filter !== "all" && o.type !== filter) return false;
    if (query && !o.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const liveCount = offers.filter((o) => o.status === "live").length;
  const totalValue = offers
    .filter((o) => o.status === "live")
    .reduce((s, o) => s + (o.price || 0), 0);

  // ---- Mutations ----
  const upsertOffer = useMutation({
    mutationFn: async (draft: OfferDraft) => {
      if (!projectId || !user?.id) throw new Error("Missing project or user");
      const payload = {
        project_id: projectId,
        user_id: user.id,
        slot_type: draft.type,
        title: draft.title || null,
        description: draft.description || null,
        offer_type: draft.format || "other",
        offer_category: draft.type,
        niche: "general",
        price: draft.price || null,
        price_type: draft.priceType,
        is_required: false,
      };
      if (draft.id) {
        const { error } = await supabase.from("offers").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("offers").insert({
          ...payload,
          slot_position: rows.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", projectId] });
      toast.success("Offer saved");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save offer"),
  });

  const deleteOffer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", projectId] });
      toast.success("Offer deleted");
    },
    onError: () => toast.error("Failed to delete offer"),
  });

  const handleSave = (draft: OfferDraft) => {
    upsertOffer.mutate(draft);
    setEditing(null);
  };
  const handleDuplicate = (draft: OfferDraft) => {
    upsertOffer.mutate({ ...draft, id: null, title: `${draft.title} (copy)`, status: "draft" });
    setEditing(null);
  };
  const handleDelete = (id: string) => {
    deleteOffer.mutate(id);
    setEditing(null);
  };

  const openNew = () => setEditing({ offer: null, mode: "new" });
  const openEdit = (offer: OfferDraft) => setEditing({ offer, mode: "edit" });

  return (
    <ProjectLayout>
      <div className="bg-[hsl(var(--bg-canvas))]">
        <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-7 md:px-12">
          {/* ---- Header ---- */}
          <header className="mb-7 flex flex-col items-start justify-between gap-6 border-b border-[hsl(var(--border-hairline))] pb-7 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2.5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[hsl(var(--fg-muted))]">
                <ShoppingBag className="h-3 w-3" />
                Your catalog · Launch assets
              </div>
              <h1 className="m-0 font-display text-[44px] leading-[1] tracking-[-0.02em] text-[hsl(var(--ink-900))] md:text-[56px]">
                Offers<span className="text-[hsl(var(--terracotta-500))]">.</span>
              </h1>
              <p className="mt-3.5 max-w-[560px] font-body text-[15px] leading-[1.6] text-[hsl(var(--fg-muted))]">
                Everything you're{" "}
                <span className="font-display italic text-[hsl(var(--ink-900))]">
                  selling, giving away, or testing
                </span>
                . Offers here flow into your campaigns, hooks, and posts — edit
                once, use everywhere.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2.5 lg:items-end">
              <div className="font-body text-[13px] text-[hsl(var(--fg-muted))]">
                <span className="font-medium text-[hsl(var(--ink-900))]">{offers.length}</span>{" "}
                offers ·{" "}
                <span className="font-medium text-[hsl(var(--ink-900))]">{liveCount}</span>{" "}
                live ·{" "}
                <span className="font-medium text-[hsl(var(--ink-900))]">${totalValue}</span>{" "}
                catalog value
              </div>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[hsl(var(--ink-900))] px-5 py-3 font-body text-[14px] font-medium text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
              >
                <Plus className="h-3.5 w-3.5" /> New offer
              </button>
            </div>
          </header>

          {/* ---- Stack strip ---- */}
          <StackStrip offers={offers} />

          {/* ---- Toolbar ---- */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                All <span className="text-[11px] opacity-70">{counts.all}</span>
              </FilterChip>
              {(Object.entries(OFFER_TYPES) as [OfferTypeKey, typeof OFFER_TYPES[OfferTypeKey]][]).map(
                ([k, v]) => {
                  const active = filter === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[hsl(var(--border-hairline))] bg-white px-3.5 py-[7px] font-body text-[13px] text-[hsl(var(--ink-800))] transition-colors"
                      style={
                        active
                          ? { background: v.color, color: "#fff", borderColor: v.color }
                          : undefined
                      }
                    >
                      {v.label}{" "}
                      <span className="text-[11px] opacity-70">{counts[k]}</span>
                    </button>
                  );
                },
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-[260px] items-center gap-2 rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white px-3.5 py-2">
                <Search className="h-3.5 w-3.5 text-[hsl(var(--fg-muted))]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search offers…"
                  className="flex-1 border-0 bg-transparent font-body text-[13px] text-[hsl(var(--ink-900))] outline-none placeholder:text-[hsl(var(--fg-muted))]"
                />
              </div>
              <div className="flex overflow-hidden rounded-[10px] border border-[hsl(var(--border-hairline))] bg-white">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  className={`px-3 py-2 ${
                    view === "grid"
                      ? "bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))]"
                      : "text-[hsl(var(--fg-muted))]"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  className={`px-3 py-2 ${
                    view === "list"
                      ? "bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))]"
                      : "text-[hsl(var(--fg-muted))]"
                  }`}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ---- Body ---- */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--fg-muted))]" />
            </div>
          ) : visible.length === 0 && !query ? (
            <EmptyState onCreate={openNew} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((o) => (
                <OfferCard key={o.id ?? o.title} offer={o} onOpen={openEdit} />
              ))}
              <CreateTile onClick={openNew} />
            </div>
          ) : (
            <ListTable offers={visible} onOpen={openEdit} />
          )}

          {visible.length === 0 && query && (
            <div className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-5 py-10 text-center font-body text-[14px] text-[hsl(var(--fg-muted))]">
              No offers match "{query}".
            </div>
          )}
        </div>
      </div>

      {editing && (
        <OfferEditorPanel
          offer={editing.offer}
          mode={editing.mode}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </ProjectLayout>
  );
};

// ---- Sub-components ---------------------------------------------------

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-[7px] font-body text-[13px] transition-colors ${
      active
        ? "border-[hsl(var(--ink-900))] bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))]"
        : "border-[hsl(var(--border-hairline))] bg-white text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--paper-200))]"
    }`}
  >
    {children}
  </button>
);

const StackStrip = ({ offers }: { offers: OfferDraft[] }) => {
  const stages: { key: string; types: OfferTypeKey[] }[] = [
    { key: "Attract", types: ["lead"] },
    { key: "Convert", types: ["tripwire", "bump"] },
    { key: "Deliver", types: ["core"] },
    { key: "Expand", types: ["upsell"] },
    { key: "Rescue", types: ["downsell"] },
  ];

  return (
    <section className="mb-8 rounded-2xl border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-7 py-6">
      <header className="mb-[18px] flex items-center justify-between">
        <div>
          <div className="font-display text-[18px] italic text-[hsl(var(--ink-900))]">
            Your offer stack, at a glance.
          </div>
          <div className="font-body text-[12px] text-[hsl(var(--fg-muted))]">
            Every offer occupies a place in the funnel. Coverage here ={" "}
            optionality when you build campaigns.
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] font-body text-[13px] text-[hsl(var(--ink-800))] hover:bg-[hsl(var(--ink-900)/0.05)]">
          <Eye className="h-3 w-3" /> View funnel diagram
        </button>
      </header>
      <div className="flex items-stretch overflow-x-auto">
        {stages.map((s, i) => {
          const matches = offers.filter((o) => s.types.includes(o.type));
          const types = Array.from(
            new Set(matches.map((o) => OFFER_TYPES[o.type].label)),
          );
          const isFirst = i === 0;
          const isLast = i === stages.length - 1;
          return (
            <div
              key={s.key}
              className={`flex-1 min-w-[140px] border border-[hsl(var(--border-hairline))] bg-white px-[18px] py-[14px] ${
                !isLast ? "border-r-0" : ""
              } ${isFirst ? "rounded-l-[10px]" : ""} ${isLast ? "rounded-r-[10px]" : ""}`}
            >
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--fg-muted))]">
                {s.key}
              </div>
              <div className="font-display text-[28px] leading-none tracking-[-0.01em] text-[hsl(var(--ink-900))]">
                {matches.length}
                <span className="text-[14px] text-[hsl(var(--fg-muted))]">
                  {" "}
                  offer{matches.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5 font-body text-[12px] text-[hsl(var(--fg-muted))]">
                {types.length ? (
                  types.join(", ")
                ) : (
                  <span className="italic">— empty —</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const OfferCard = ({
  offer,
  onOpen,
}: {
  offer: OfferDraft;
  onOpen: (o: OfferDraft) => void;
}) => {
  const t = OFFER_TYPES[offer.type];
  const usedSum =
    offer.usedIn.campaigns + offer.usedIn.posts + offer.usedIn.hooks;
  return (
    <article
      onClick={() => onOpen(offer)}
      className="group flex cursor-pointer flex-col gap-3.5 overflow-hidden rounded-2xl border border-[hsl(var(--border-hairline))] bg-white px-[22px] py-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,27,23,0.08)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-semibold tracking-[0.02em]"
          style={{ background: t.bg, color: t.color }}
        >
          <span
            className="h-[5px] w-[5px] rounded-full"
            style={{ background: t.color }}
          />
          {t.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--fg-muted))]">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: STATUS_DOT[offer.status] }}
          />
          {offer.status}
        </span>
      </div>
      <h3 className="m-0 line-clamp-2 min-h-12 font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-[hsl(var(--ink-900))]">
        {offer.title || "Untitled offer"}
      </h3>
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[12px] text-[hsl(var(--fg-muted))]">
          {offer.format}
        </span>
        <span className="font-body text-[13px] font-medium text-[hsl(var(--ink-900))]">
          {formatPrice(offer.price, offer.priceType)}
        </span>
      </div>
      <div className="flex gap-3 border-t border-dashed border-[hsl(var(--border-hairline))] pt-3 font-body text-[12px] text-[hsl(var(--fg-muted))]">
        <UsageMini icon={<Rocket className="h-3 w-3" />} value={offer.usedIn.campaigns} />
        <UsageMini icon={<ImageIcon className="h-3 w-3" />} value={offer.usedIn.posts} />
        <UsageMini icon={<Sparkles className="h-3 w-3" />} value={offer.usedIn.hooks} />
        <span
          className={`ml-auto ${
            usedSum === 0 ? "text-[hsl(var(--fg-muted))]" : "text-[hsl(var(--ink-800))]"
          }`}
        >
          {usedSum === 0 ? "Not yet used" : `Used ${usedSum}×`}
        </span>
      </div>
    </article>
  );
};

const UsageMini = ({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: number;
}) => (
  <span className="inline-flex items-center gap-1">
    {icon}
    {value}
  </span>
);

const CreateTile = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-[hsl(var(--border-hairline))] bg-transparent p-6 font-body text-[14px] font-medium text-[hsl(var(--fg-muted))] transition-colors hover:border-[hsl(var(--ink-900))] hover:bg-[hsl(var(--paper-200))] hover:text-[hsl(var(--ink-900))]"
  >
    <Plus className="h-5 w-5" />
    <span>Create new offer</span>
    <span className="text-[12px] font-normal text-[hsl(var(--fg-muted))]">
      Any type · any price
    </span>
  </button>
);

const ListTable = ({
  offers,
  onOpen,
}: {
  offers: OfferDraft[];
  onOpen: (o: OfferDraft) => void;
}) => (
  <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border-hairline))] bg-white">
    <div
      className="grid items-center gap-4 bg-[hsl(var(--paper-200))] px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--fg-muted))]"
      style={{ gridTemplateColumns: "28px 140px 1fr 130px 120px 160px 40px" }}
    >
      <span />
      <span>Type</span>
      <span>Offer</span>
      <span>Price</span>
      <span>Status</span>
      <span>Used in</span>
      <span />
    </div>
    {offers.map((o) => (
      <ListRow key={o.id ?? o.title} offer={o} onOpen={onOpen} />
    ))}
  </div>
);

const ListRow = ({
  offer,
  onOpen,
}: {
  offer: OfferDraft;
  onOpen: (o: OfferDraft) => void;
}) => {
  const t = OFFER_TYPES[offer.type];
  return (
    <div
      onClick={() => onOpen(offer)}
      className="grid cursor-pointer items-center gap-4 border-b border-[hsl(var(--border-hairline))] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[hsl(var(--paper-200))]"
      style={{ gridTemplateColumns: "28px 140px 1fr 130px 120px 160px 40px" }}
    >
      <GripVertical className="h-3.5 w-3.5 cursor-grab text-[hsl(var(--fg-muted))]" />
      <span
        className="inline-flex items-center gap-1.5 justify-self-start rounded-full px-2.5 py-1 font-body text-[11px] font-semibold"
        style={{ background: t.bg, color: t.color }}
      >
        <span
          className="h-[5px] w-[5px] rounded-full"
          style={{ background: t.color }}
        />
        {t.label}
      </span>
      <div className="min-w-0">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[16px] tracking-[-0.005em] text-[hsl(var(--ink-900))]">
          {offer.title || "Untitled offer"}
        </div>
        <div className="mt-0.5 font-body text-[12px] text-[hsl(var(--fg-muted))]">
          {offer.format}
        </div>
      </div>
      <div className="font-body text-[13px] font-medium text-[hsl(var(--ink-900))]">
        {formatPrice(offer.price, offer.priceType)}
      </div>
      <div className="font-body text-[12px] capitalize text-[hsl(var(--fg-muted))]">
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
          style={{ background: STATUS_DOT[offer.status] }}
        />
        {offer.status}
      </div>
      <div className="flex gap-2.5 font-body text-[12px] text-[hsl(var(--fg-muted))]">
        <UsageMini icon={<Rocket className="h-3 w-3" />} value={offer.usedIn.campaigns} />
        <UsageMini icon={<ImageIcon className="h-3 w-3" />} value={offer.usedIn.posts} />
        <UsageMini icon={<Sparkles className="h-3 w-3" />} value={offer.usedIn.hooks} />
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--fg-muted))]" />
    </div>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rounded-2xl border border-dashed border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-5 py-16 text-center">
    <ShoppingBag className="mx-auto h-8 w-8 text-[hsl(var(--fg-muted))]" />
    <h3 className="mx-0 mb-2 mt-3 font-display text-[28px] tracking-[-0.01em] text-[hsl(var(--ink-900))]">
      Your catalog is empty.
    </h3>
    <p className="mx-auto mb-5 max-w-[420px] font-body text-[14px] text-[hsl(var(--fg-muted))]">
      Start with one — a free lead magnet is the easiest on-ramp. You can
      always add more later.
    </p>
    <button
      onClick={onCreate}
      className="inline-flex items-center gap-2 rounded-[10px] bg-[hsl(var(--ink-900))] px-5 py-3 font-body text-[14px] font-medium text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
    >
      <Plus className="h-3.5 w-3.5" /> Create your first offer
    </button>
  </div>
);

export default OffersLibrary;

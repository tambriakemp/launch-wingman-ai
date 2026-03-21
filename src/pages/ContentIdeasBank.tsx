import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import {
  Plus, Lightbulb, Search, MoreHorizontal,
  Pencil, Trash2, ArrowRight, X, Check, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title: string;
  notes: string | null;
  platform: string;
  format: string;
  status: string;
  category: string;
  hook: string | null;
  promoted_to: string | null;
  created_at: string;
}

const PLATFORMS = [
  { id: "any", label: "Any Platform", color: "#71717a" },
  { id: "instagram", label: "Instagram", color: "#e1306c" },
  { id: "tiktok", label: "TikTok", color: "#010101" },
  { id: "youtube", label: "YouTube", color: "#ff0000" },
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2" },
  { id: "email", label: "Email", color: "#f5c842" },
  { id: "twitter", label: "X / Twitter", color: "#1da1f2" },
  { id: "pinterest", label: "Pinterest", color: "#e60023" },
  { id: "podcast", label: "Podcast", color: "#8b5cf6" },
  { id: "blog", label: "Blog / SEO", color: "#0ea572" },
];

const FORMATS = [
  { id: "post", label: "Post" },
  { id: "reel", label: "Reel / Short" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
  { id: "video", label: "Long-form Video" },
  { id: "email", label: "Email" },
  { id: "thread", label: "Thread" },
  { id: "article", label: "Article / Blog" },
  { id: "podcast", label: "Podcast Episode" },
  { id: "live", label: "Live / Webinar" },
];

const CATEGORIES = [
  { id: "educational", label: "Educational", color: "#3b82f6" },
  { id: "promotional", label: "Promotional", color: "#f5c842" },
  { id: "personal", label: "Personal / Story", color: "#0ea572" },
  { id: "entertaining", label: "Entertaining", color: "#f97316" },
  { id: "community", label: "Community", color: "#8b5cf6" },
  { id: "behind_scenes", label: "Behind the Scenes", color: "#ec4899" },
];

const STATUSES = [
  { id: "idea", label: "Idea", color: "bg-muted text-muted-foreground" },
  { id: "drafting", label: "Drafting", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "published", label: "Published", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

const EMPTY_FORM = {
  title: "", notes: "", platform: "any", format: "post",
  status: "idea", category: "educational", hook: "",
};

const IDEA_STARTERS = [
  "3 mistakes I made when...",
  "How I went from ___ to ___ in 30 days",
  "The truth about [topic] no one talks about",
  "What I wish I knew before launching my...",
  "Behind the scenes of my [process/workflow]",
  "Client win: how [name] achieved [result]",
  "Hot take: [controversial opinion in your niche]",
  "Step-by-step: how to [solve common problem]",
];

const ContentIdeasBank = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIdeas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("idea_bank" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setIdeas((data as unknown as Idea[]) || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const openCreate = () => {
    setEditingIdea(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setForm({
      title: idea.title,
      notes: idea.notes || "",
      platform: idea.platform,
      format: idea.format,
      status: idea.status,
      category: idea.category,
      hook: idea.hook || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        platform: form.platform,
        format: form.format,
        status: form.status,
        category: form.category,
        hook: form.hook.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editingIdea) {
        await supabase.from("idea_bank" as any).update(payload).eq("id", editingIdea.id);
        toast.success("Idea updated");
      } else {
        await supabase.from("idea_bank" as any).insert({ ...payload, user_id: user.id });
        toast.success("Idea saved");
      }
      fetchIdeas();
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (idea: Idea, newStatus: string) => {
    await supabase.from("idea_bank" as any).update({ status: newStatus }).eq("id", idea.id);
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: newStatus } : i));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("idea_bank" as any).delete().eq("id", id);
    setIdeas(prev => prev.filter(i => i.id !== id));
    toast.success("Idea deleted");
  };

  const handlePromote = async (idea: Idea) => {
    await supabase.from("idea_bank" as any)
      .update({ status: "scheduled", promoted_to: "social_planner" })
      .eq("id", idea.id);
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: "scheduled", promoted_to: "social_planner" } : i));
    toast.success("Marked as scheduled — head to Social Planner to add the post");
  };

  const filtered = useMemo(() => {
    return ideas.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.notes || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPlatform !== "all" && i.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      return true;
    });
  }, [ideas, search, filterPlatform, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total: ideas.length,
    idea: ideas.filter(i => i.status === "idea").length,
    drafting: ideas.filter(i => i.status === "drafting").length,
    published: ideas.filter(i => i.status === "published").length,
  }), [ideas]);

  const getPlatform = (id: string) => PLATFORMS.find(p => p.id === id) || PLATFORMS[0];
  const getCategory = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
  const getStatus = (id: string) => STATUSES.find(s => s.id === id) || STATUSES[0];

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Content Ideas Bank</h1>
            <p className="text-sm text-muted-foreground mt-1">Capture ideas before they disappear. Organize by platform and format.</p>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> New Idea
          </Button>
        </div>

        {/* Stats strip */}
        {ideas.length > 0 && (
          <div className="flex gap-6 px-1">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Ideas", value: stats.idea, color: "text-muted-foreground" },
              { label: "Drafting", value: stats.drafting, color: "text-amber-600" },
              { label: "Published", value: stats.published, color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={cn("text-xl font-semibold", s.color)}>{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search ideas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Platforms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterStatus !== "all" || filterPlatform !== "all" || filterCategory !== "all" || search) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPlatform("all"); setFilterCategory("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Ideas list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Lightbulb className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No ideas yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start capturing content ideas before they slip away. Organize by platform, format, and status.
              </p>
              <Button onClick={openCreate} size="sm" className="gap-1.5">
                <Sparkles className="w-4 h-4" /> Capture First Idea
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No ideas match your filters.</p>
              <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPlatform("all"); setFilterCategory("all"); }} className="text-xs text-primary hover:underline mt-2">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(idea => {
                const platform = getPlatform(idea.platform);
                const category = getCategory(idea.category);
                const status = getStatus(idea.status);
                const format = FORMATS.find(f => f.id === idea.format);
                return (
                  <div key={idea.id} className="group flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                    {/* Color dot */}
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: platform.color }} />

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{idea.title}</p>
                        {idea.promoted_to && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            → Social Planner
                          </Badge>
                        )}
                      </div>
                      {idea.hook && (
                        <p className="text-xs text-muted-foreground italic truncate">"{idea.hook}"</p>
                      )}
                      {idea.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{idea.notes}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", status.color)}>
                          {status.label}
                        </Badge>
                        <span className="font-medium" style={{ color: platform.color }}>
                          {platform.label}
                        </span>
                        {format && (
                          <span>· {format.label}</span>
                        )}
                        <span>· {idea.category.replace("_", " ")}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idea.status !== "published" && idea.status !== "scheduled" && (
                        <button
                          onClick={() => handlePromote(idea)}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" /> Schedule
                        </button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEdit(idea)} className="gap-2 text-xs">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {STATUSES.map(s => (
                            <DropdownMenuItem
                              key={s.id}
                              onClick={() => handleStatusChange(idea, s.id)}
                              disabled={idea.status === s.id}
                              className="gap-2 text-xs"
                            >
                              {idea.status === s.id && <Check className="w-3.5 h-3.5" />}
                              {idea.status !== s.id && <span className="w-3.5" />}
                              {s.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(idea.id)} className="gap-2 text-xs text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingIdea(null); }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-lg">
                {editingIdea ? "Edit Idea" : "Capture Idea"}
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 space-y-4">

              {/* Idea starters — new only */}
              {!editingIdea && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Starter prompts
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {IDEA_STARTERS.slice(0, 5).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, title: s }))}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full border transition-colors text-left",
                          form.title === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Idea *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What's the content idea?"
                  className="h-10"
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Hook */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Hook / Opening line</Label>
                <Input
                  value={form.hook}
                  onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}
                  placeholder="The first line that grabs attention..."
                  className="h-10"
                  maxLength={300}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Key points, talking points, references..."
                  rows={3}
                  className="resize-none text-sm"
                  maxLength={1000}
                />
              </div>

              {/* Platform + Format */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Platform</Label>
                  <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Format</Label>
                  <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMATS.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

            <DialogFooter className="px-6 py-4 border-t border-border gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !form.title.trim()}>
                {isSubmitting ? "Saving..." : editingIdea ? "Update" : "Save Idea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
};

export default ContentIdeasBank;

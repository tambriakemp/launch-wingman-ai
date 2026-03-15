import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, ArrowUp, ArrowDown,
  Link2, Palette, Share2
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface CardData {
  id: string;
  position: number;
  title: string;
  description: string;
  image_url: string | null;
  badge_text: string | null;
  badge_color: string;
  cta_text: string;
  cta_url: string;
  price_original: string | null;
  price_current: string | null;
  price_note: string | null;
  card_type: string;
  highlight: boolean;
  is_visible: boolean;
}

interface SocialLink {
  id: string;
  position: number;
  platform: string;
  url: string;
  icon_name: string;
  is_visible: boolean;
}

interface BrandingSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

const EMPTY_CARD: Omit<CardData, "id"> = {
  position: 0, title: "", description: "", image_url: "", badge_text: "",
  badge_color: "#1A1A1A", cta_text: "Learn More →", cta_url: "#",
  price_original: "", price_current: "", price_note: "",
  card_type: "link", highlight: false, is_visible: true,
};

const ICON_OPTIONS = [
  "Instagram", "Facebook", "Youtube", "Music2", "Mail", "Link2",
  "ExternalLink", "Twitter", "Linkedin", "Github", "Globe",
];

const PLATFORM_OPTIONS = [
  "Instagram", "TikTok", "YouTube", "Facebook", "Pinterest",
  "Twitter/X", "LinkedIn", "Email", "Website", "Other",
];

// ── Cards Tab ──────────────────────────────────────────────

function CardsTab() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [form, setForm] = useState<Omit<CardData, "id">>(EMPTY_CARD);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCards = useCallback(async () => {
    const { data } = await supabase.from("linkinbio_cards" as any).select("*").order("position", { ascending: true });
    setCards((data as unknown as CardData[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const openNew = () => { setEditingCard(null); setForm({ ...EMPTY_CARD, position: cards.length }); setDialogOpen(true); };
  const openEdit = (card: CardData) => {
    setEditingCard(card);
    setForm({ position: card.position, title: card.title, description: card.description, image_url: card.image_url || "", badge_text: card.badge_text || "", badge_color: card.badge_color, cta_text: card.cta_text, cta_url: card.cta_url, price_original: card.price_original || "", price_current: card.price_current || "", price_note: card.price_note || "", card_type: card.card_type, highlight: card.highlight, is_visible: card.is_visible });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setIsSaving(true);
    const payload = { ...form, image_url: form.image_url || null, badge_text: form.badge_text || null, price_original: form.price_original || null, price_current: form.price_current || null, price_note: form.price_note || null, updated_at: new Date().toISOString() };
    if (editingCard) {
      const { error } = await supabase.from("linkinbio_cards" as any).update(payload).eq("id", editingCard.id);
      if (error) toast.error("Failed to update"); else toast.success("Card updated");
    } else {
      const { error } = await supabase.from("linkinbio_cards" as any).insert(payload);
      if (error) toast.error("Failed to create"); else toast.success("Card created");
    }
    setIsSaving(false); setDialogOpen(false); fetchCards();
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this card?")) return; await supabase.from("linkinbio_cards" as any).delete().eq("id", id); toast.success("Card deleted"); fetchCards(); };
  const handleToggleVisibility = async (card: CardData) => { await supabase.from("linkinbio_cards" as any).update({ is_visible: !card.is_visible }).eq("id", card.id); fetchCards(); };
  const handleMove = async (card: CardData, direction: "up" | "down") => {
    const idx = cards.findIndex(c => c.id === card.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= cards.length) return;
    const other = cards[swapIdx];
    await Promise.all([
      supabase.from("linkinbio_cards" as any).update({ position: other.position }).eq("id", card.id),
      supabase.from("linkinbio_cards" as any).update({ position: card.position }).eq("id", other.id),
    ]);
    fetchCards();
  };
  const updateForm = (updates: Partial<Omit<CardData, "id">>) => setForm(f => ({ ...f, ...updates }));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Manage the cards shown on your /links page.</p>
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Card</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p>No cards yet. Click "Add Card" to get started.</p></div>
      ) : (
        <div className="space-y-2">
          {cards.map((card, idx) => (
            <div key={card.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => handleMove(card, "up")} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleMove(card, "down")} disabled={idx === cards.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{card.title}</span>
                  {card.badge_text && <span className="text-[10px] font-bold uppercase text-white px-1.5 py-0.5 rounded-full shrink-0" style={{ background: card.badge_color }}>{card.badge_text}</span>}
                  {!card.is_visible && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Hidden</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{card.card_type} · {card.cta_url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggleVisibility(card)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">{card.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                <button onClick={() => openEdit(card)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(card.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCard ? "Edit Card" : "New Card"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Title *</Label><Input value={form.title} onChange={e => updateForm({ title: e.target.value })} maxLength={200} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Description</Label><Textarea value={form.description} onChange={e => updateForm({ description: e.target.value })} rows={3} className="resize-none" maxLength={500} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Image URL</Label><Input value={form.image_url || ""} onChange={e => updateForm({ image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Badge Text</Label><Input value={form.badge_text || ""} onChange={e => updateForm({ badge_text: e.target.value })} placeholder="FREE" maxLength={20} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Badge Color</Label><div className="flex items-center gap-2"><input type="color" value={form.badge_color} onChange={e => updateForm({ badge_color: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer" /><Input value={form.badge_color} onChange={e => updateForm({ badge_color: e.target.value })} className="flex-1" /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">CTA Text</Label><Input value={form.cta_text} onChange={e => updateForm({ cta_text: e.target.value })} maxLength={60} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">CTA URL</Label><Input value={form.cta_url} onChange={e => updateForm({ cta_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Original Price</Label><Input value={form.price_original || ""} onChange={e => updateForm({ price_original: e.target.value })} placeholder="$57" maxLength={20} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Sale Price</Label><Input value={form.price_current || ""} onChange={e => updateForm({ price_current: e.target.value })} placeholder="$37" maxLength={20} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Card Type</Label>
                <Select value={form.card_type} onValueChange={v => updateForm({ card_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="link">Link</SelectItem><SelectItem value="email_capture">Email Capture</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">Price Note</Label><Input value={form.price_note || ""} onChange={e => updateForm({ price_note: e.target.value })} placeholder="Starting at $7/mo" maxLength={100} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.highlight} onCheckedChange={v => updateForm({ highlight: v })} /><Label className="text-sm">Highlight (gold border)</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_visible} onCheckedChange={v => updateForm({ is_visible: v })} /><Label className="text-sm">Visible</Label></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.title.trim()}>{isSaving ? "Saving..." : editingCard ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Social Links Tab ───────────────────────────────────────

function SocialLinksTab() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState({ platform: "Instagram", url: "#", icon_name: "Instagram", is_visible: true, position: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("linkinbio_social_links" as any).select("*").order("position", { ascending: true });
    setLinks((data as unknown as SocialLink[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => { setEditing(null); setForm({ platform: "Instagram", url: "#", icon_name: "Instagram", is_visible: true, position: links.length }); setDialogOpen(true); };
  const openEdit = (link: SocialLink) => { setEditing(link); setForm({ platform: link.platform, url: link.url, icon_name: link.icon_name, is_visible: link.is_visible, position: link.position }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.url.trim()) { toast.error("URL is required"); return; }
    setIsSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editing) {
      const { error } = await supabase.from("linkinbio_social_links" as any).update(payload).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else toast.success("Link updated");
    } else {
      const { error } = await supabase.from("linkinbio_social_links" as any).insert(payload);
      if (error) toast.error("Failed to create"); else toast.success("Link created");
    }
    setIsSaving(false); setDialogOpen(false); fetch();
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this social link?")) return; await supabase.from("linkinbio_social_links" as any).delete().eq("id", id); toast.success("Link deleted"); fetch(); };
  const handleMove = async (link: SocialLink, direction: "up" | "down") => {
    const idx = links.findIndex(l => l.id === link.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    const other = links[swapIdx];
    await Promise.all([
      supabase.from("linkinbio_social_links" as any).update({ position: other.position }).eq("id", link.id),
      supabase.from("linkinbio_social_links" as any).update({ position: link.position }).eq("id", other.id),
    ]);
    fetch();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Manage social media icons shown in the header.</p>
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Link</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p>No social links yet.</p></div>
      ) : (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div key={link.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => handleMove(link, "up")} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleMove(link, "down")} disabled={idx === links.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-foreground">{link.platform}</span>
                {!link.is_visible && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-2">Hidden</span>}
                <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(link)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Social Link" : "New Social Link"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Platform</Label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORM_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">URL *</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Icon</Label>
              <Select value={form.icon_name} onValueChange={v => setForm(f => ({ ...f, icon_name: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_visible} onCheckedChange={v => setForm(f => ({ ...f, is_visible: v }))} />
              <Label className="text-sm">Visible</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Branding Tab ───────────────────────────────────────────

const BRANDING_FIELDS = [
  { key: "brand_name", label: "Brand Name", type: "text" },
  { key: "bio_text", label: "Bio Text", type: "text" },
  { key: "hero_image_url", label: "Hero Image URL", type: "text" },
  { key: "footer_text", label: "Footer Text", type: "text" },
  { key: "page_bg_color", label: "Page Background", type: "color" },
  { key: "card_bg_color", label: "Card Background", type: "color" },
  { key: "card_border_color", label: "Card Border", type: "color" },
  { key: "button_bg_color", label: "Button Background", type: "color" },
  { key: "button_text_color", label: "Button Text", type: "color" },
  { key: "accent_color", label: "Accent / Highlight", type: "color" },
  { key: "heading_text_color", label: "Heading Text", type: "color" },
  { key: "body_text_color", label: "Body Text", type: "color" },
];

function BrandingTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("linkinbio_settings" as any).select("*");
    const map: Record<string, string> = {};
    ((data as unknown as BrandingSetting[]) || []).forEach(s => { map[s.setting_key] = s.setting_value; });
    setSettings(map);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const promises = Object.entries(settings).map(([key, value]) =>
      supabase.from("linkinbio_settings" as any).update({ setting_value: value, updated_at: new Date().toISOString() }).eq("setting_key", key)
    );
    await Promise.all(promises);
    toast.success("Branding saved");
    setIsSaving(false);
  };

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Control colors, text, and images on your /links page.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BRANDING_FIELDS.map(field => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
            {field.type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings[field.key] || "#000000"}
                  onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="w-10 h-10 rounded border border-border cursor-pointer shrink-0"
                />
                <Input
                  value={settings[field.key] || ""}
                  onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  className="flex-1"
                />
              </div>
            ) : (
              <Input
                value={settings[field.key] || ""}
                onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      {/* Live preview swatch */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">Preview</Label>
        <div className="rounded-lg p-6 flex flex-col items-center gap-3" style={{ background: settings.page_bg_color || "#0A0A0A" }}>
          <span style={{ color: settings.heading_text_color || "#FFF", fontWeight: 700, fontSize: 18 }}>{settings.brand_name || "Brand"}</span>
          <span style={{ color: settings.body_text_color || "#999", fontSize: 13 }}>{settings.bio_text?.slice(0, 40) || "Bio text..."}</span>
          <div className="rounded-lg p-3 w-full max-w-[220px]" style={{ background: settings.card_bg_color || "#1C1C1E", border: `1px solid ${settings.card_border_color || "#2A2A2C"}` }}>
            <span style={{ color: settings.heading_text_color || "#FFF", fontSize: 13, fontWeight: 600 }}>Sample Card</span>
            <div className="mt-2 rounded text-center py-1.5" style={{ background: settings.button_bg_color || "#FFF", color: settings.button_text_color || "#000", fontSize: 12, fontWeight: 600 }}>Button</div>
          </div>
          <div className="w-12 h-0.5 rounded" style={{ background: settings.accent_color || "#C9A96E" }} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving..." : "Save Branding"}
      </Button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const AdminLinkInBio = () => {
  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-foreground">Link-in-Bio Editor</h1>
            <a href="/links" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </Button>
            </a>
          </div>

          <Tabs defaultValue="cards" className="space-y-6">
            <TabsList>
              <TabsTrigger value="cards" className="gap-1.5"><Link2 className="w-3.5 h-3.5" /> Cards</TabsTrigger>
              <TabsTrigger value="social" className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Social Links</TabsTrigger>
              <TabsTrigger value="branding" className="gap-1.5"><Palette className="w-3.5 h-3.5" /> Branding</TabsTrigger>
            </TabsList>

            <TabsContent value="cards"><CardsTab /></TabsContent>
            <TabsContent value="social"><SocialLinksTab /></TabsContent>
            <TabsContent value="branding"><BrandingTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default AdminLinkInBio;

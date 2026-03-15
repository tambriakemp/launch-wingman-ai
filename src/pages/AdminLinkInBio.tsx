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
  Link2, Palette, Share2, Sparkles, Loader2, Image as ImageIcon, User, Type, Upload
} from "lucide-react";


// ── Image Upload Helper ────────────────────────────────────

async function uploadImageToStorage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `linkinbio/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
  return data.publicUrl;
}

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
  "TikTok", "Pinterest", "HubSpot",
];

const PLATFORM_OPTIONS = [
  "Instagram", "TikTok", "YouTube", "Facebook", "Pinterest",
  "Twitter/X", "LinkedIn", "Email", "Website", "Other",
];

// ── Image Upload Button ────────────────────────────────────

function ImageUploadButton({ onUploaded, folder = "cards" }: { onUploaded: (url: string) => void; folder?: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file, folder);
      onUploaded(url);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent cursor-pointer transition-colors">
      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      {isUploading ? "Uploading..." : "Upload Image"}
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
    </label>
  );
}

// ── AI Image Generator ─────────────────────────────────────

function AiImageGenerator({ onGenerated }: { onGenerated: (url: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt-cover", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageBase64) {
        onGenerated(data.imageBase64);
        toast.success("Image generated!");
        setPrompt("");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5" />
        Generate with AI
      </div>
      <Textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe the image you want… e.g. 'A warm lifestyle flat-lay with a laptop, coffee, and notebook on a cream background'"
        rows={2}
        className="resize-none text-sm"
        disabled={isGenerating}
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={generate}
        disabled={isGenerating || !prompt.trim()}
        className="gap-1.5 w-full"
      >
        {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate Image</>}
      </Button>
    </div>
  );
}

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

            {/* Image section with AI generation */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Card Image
              </Label>
              <div className="flex items-center gap-2">
                <Input value={form.image_url || ""} onChange={e => updateForm({ image_url: e.target.value })} placeholder="https://... or paste URL" className="flex-1" />
                <ImageUploadButton onUploaded={(url) => updateForm({ image_url: url })} folder="cards" />
              </div>
              {form.image_url && (
                <div className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "16/9" }}>
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateForm({ image_url: "" })}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <AiImageGenerator onGenerated={(url) => updateForm({ image_url: url })} />
            </div>

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

// ── Branding Tab (separated into sections) ─────────────────

const HEADER_FIELDS = [
  { key: "brand_name", label: "Brand Name", type: "text" },
  { key: "bio_text", label: "Bio Text", type: "textarea" },
  { key: "hero_image_url", label: "Hero Image", type: "image" },
  { key: "profile_image_url", label: "Profile Image", type: "image" },
  { key: "header_name_color", label: "Name Color", type: "color" },
  { key: "header_bio_color", label: "Bio Text Color", type: "color" },
  { key: "header_icon_color", label: "Social Icon Color", type: "color" },
  { key: "header_icon_bg_color", label: "Social Icon Background", type: "color" },
  { key: "social_icon_size", label: "Social Icon Size (px)", type: "text" },
];

const COLOR_FIELDS = [
  { key: "page_bg_color", label: "Page Background", type: "color" },
  { key: "card_bg_color", label: "Card Background", type: "color" },
  { key: "card_border_color", label: "Card Border", type: "color" },
  { key: "card_gradient_color", label: "Card Image Gradient", type: "color" },
  { key: "button_bg_color", label: "Button Background", type: "color" },
  { key: "button_text_color", label: "Button Text", type: "color" },
  { key: "accent_color", label: "Accent / Highlight", type: "color" },
  { key: "heading_text_color", label: "Card Heading Text", type: "color" },
  { key: "body_text_color", label: "Card Body Text", type: "color" },
];

const FOOTER_FIELDS = [
  { key: "footer_text", label: "Footer Text", type: "text" },
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
    // Upsert all settings (handles new keys like profile_image_url)
    const promises = Object.entries(settings).map(([key, value]) =>
      supabase.from("linkinbio_settings" as any).upsert(
        { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
        { onConflict: "setting_key" }
      )
    );
    await Promise.all(promises);
    toast.success("Branding saved");
    setIsSaving(false);
  };

  const updateSetting = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  const renderField = (field: { key: string; label: string; type: string }) => {
    if (field.type === "color") {
      return (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings[field.key] || "#000000"}
              onChange={e => updateSetting(field.key, e.target.value)}
              className="w-10 h-10 rounded border border-border cursor-pointer shrink-0"
            />
            <Input
              value={settings[field.key] || ""}
              onChange={e => updateSetting(field.key, e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      );
    }
    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-1.5 col-span-full">
          <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
          <Textarea
            value={settings[field.key] || ""}
            onChange={e => updateSetting(field.key, e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
      );
    }
    if (field.type === "image") {
      const folder = field.key.includes("profile") ? "profile" : "hero";
      return (
        <div key={field.key} className="space-y-2 col-span-full">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> {field.label}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={settings[field.key] || ""}
              onChange={e => updateSetting(field.key, e.target.value)}
              placeholder="https://... or upload"
              className="flex-1"
            />
            <ImageUploadButton onUploaded={(url) => updateSetting(field.key, url)} folder={folder} />
          </div>
          {settings[field.key] && (
            <div className="relative rounded-lg overflow-hidden border border-border max-w-[240px]" style={{ aspectRatio: field.key === "profile_image_url" ? "1/1" : "3/4" }}>
              <img src={settings[field.key]} alt={field.label} className="w-full h-full object-cover" />
              <button
                onClick={() => updateSetting(field.key, "")}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <AiImageGenerator onGenerated={(url) => updateSetting(field.key, url)} />
        </div>
      );
    }
    return (
      <div key={field.key} className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
        <Input
          value={settings[field.key] || ""}
          onChange={e => updateSetting(field.key, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Header & Profile</h3>
        </div>
        <p className="text-xs text-muted-foreground">Control the hero image, profile photo, name, and bio text displayed at the top of your page.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HEADER_FIELDS.map(renderField)}
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Colors & Styling</h3>
        </div>
        <p className="text-xs text-muted-foreground">Set the color palette for your page, cards, buttons, and text.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(renderField)}
        </div>
      </div>

      {/* Footer Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Type className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Footer</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FOOTER_FIELDS.map(renderField)}
        </div>
      </div>

      {/* Live preview swatch */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">Live Preview</Label>
        <div className="rounded-lg p-6 flex flex-col items-center gap-3" style={{ background: settings.page_bg_color || "#0A0A0A" }}>
          {settings.profile_image_url && (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: settings.accent_color || "#C9A96E" }}>
              <img src={settings.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <span style={{ color: settings.heading_text_color || "#FFF", fontWeight: 700, fontSize: 18 }}>{settings.brand_name || "Brand"}</span>
          <span style={{ color: settings.body_text_color || "#999", fontSize: 13, textAlign: "center" }}>{settings.bio_text?.slice(0, 60) || "Bio text..."}</span>
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

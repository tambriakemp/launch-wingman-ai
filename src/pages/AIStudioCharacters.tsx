import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Pencil, User, X } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "ai-studio";
const REF_LABELS = ["Face (Front)", "Profile (Side)", "Full Body"];

interface Character {
  id: string;
  name: string;
  niche: string;
  aesthetic: string;
  personality_traits: string;
  target_audience: string;
  brand_colors: string;
  photo_urls: string[];
  created_at: string;
}

const emptyForm = {
  name: "",
  niche: "",
  aesthetic: "",
  personality_traits: "",
  target_audience: "",
  brand_colors: "",
};

const AIStudioCharacters = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState(0);

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCharacters(data.map((c: any) => ({ ...c, photo_urls: c.photo_urls || [] })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCharacters(); }, []);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error("Image must be under 25MB."); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(activeSlot);
    const path = `characters/${user.id}/char-${Date.now()}-${activeSlot}.png`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error("Failed to upload photo."); setUploading(null); return; }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const newUrls = [...photoUrls];
    newUrls[activeSlot] = `${urlData.publicUrl}?t=${Date.now()}`;
    setPhotoUrls(newUrls);
    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    const newUrls = [...photoUrls];
    newUrls[index] = null;
    setPhotoUrls(newUrls);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Character name is required."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const validPhotos = photoUrls.filter(Boolean);
    const payload = { ...form, photo_urls: validPhotos, user_id: user.id };

    if (editingId) {
      const { error } = await supabase.from("characters").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update character."); setSaving(false); return; }
      toast.success("Character updated!");
    } else {
      const { error } = await supabase.from("characters").insert(payload);
      if (error) { toast.error("Failed to create character."); setSaving(false); return; }
      toast.success("Character created!");
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPhotoUrls([null, null, null]);
    fetchCharacters();
  };

  const handleEdit = (char: Character) => {
    setEditingId(char.id);
    setForm({
      name: char.name,
      niche: char.niche,
      aesthetic: char.aesthetic,
      personality_traits: char.personality_traits,
      target_audience: char.target_audience,
      brand_colors: char.brand_colors,
    });
    const urls: (string | null)[] = [null, null, null];
    char.photo_urls.forEach((u, i) => { if (i < 3) urls[i] = u; });
    setPhotoUrls(urls);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) { toast.error("Failed to delete."); return; }
    toast.success("Character deleted.");
    fetchCharacters();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPhotoUrls([null, null, null]);
  };

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto px-2.5 md:px-6 py-8">
        <button onClick={() => navigate("/app/ai-studio")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to AI Avatar Studio
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Character Builder</h1>
            <p className="text-sm text-muted-foreground">Create character profiles to personalize AI-generated content.</p>
          </div>
          {!showForm && (
            <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setPhotoUrls([null, null, null]); }}>
              <Plus className="w-4 h-4 mr-1" /> New Character
            </Button>
          )}
        </div>

        {showForm && (
          <div className="border border-border rounded-xl bg-card p-6 mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Character" : "New Character"}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Reference Photos</label>
              <div className="grid grid-cols-3 gap-3">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    {url ? (
                      <div className="relative">
                        <img src={url} alt={REF_LABELS[i]} className="w-full aspect-square rounded-lg object-cover border-2 border-border" />
                        <button onClick={() => handleRemovePhoto(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[8px] text-center py-0.5 text-muted-foreground rounded-b-lg">{REF_LABELS[i]}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveSlot(i); fileInputRef.current?.click(); }}
                        disabled={uploading !== null}
                        className="w-full aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                      >
                        {uploading === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /><span className="text-[8px]">{REF_LABELS[i]}</span></>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ava the Fitness Coach" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Niche</label>
                <Input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="e.g. Fitness, Beauty, Tech" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Aesthetic / Vibe</label>
                <Input value={form.aesthetic} onChange={(e) => setForm({ ...form, aesthetic: e.target.value })} placeholder="e.g. Minimalist, Bold, Cozy" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Target Audience</label>
                <Input value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} placeholder="e.g. Women 25-35 into wellness" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Personality / Brand Voice</label>
              <Textarea value={form.personality_traits} onChange={(e) => setForm({ ...form, personality_traits: e.target.value })} placeholder="e.g. Confident, empowering, warm, approachable" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Brand Colors</label>
              <Input value={form.brand_colors} onChange={(e) => setForm({ ...form, brand_colors: e.target.value })} placeholder="e.g. Blush pink, cream, gold accents" />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update Character" : "Save Character"}
              </Button>
            </div>
          </div>
        )}

        {/* Character List */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading characters...
          </div>
        ) : characters.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No characters yet. Create one to personalize your AI content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <div key={char.id} className="border border-border rounded-xl bg-card p-4 group hover:border-primary/40 transition-colors">
                <div className="flex gap-3 mb-3">
                  {char.photo_urls[0] ? (
                    <img src={char.photo_urls[0]} alt={char.name} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-card-foreground truncate">{char.name}</h3>
                    {char.niche && <p className="text-xs text-muted-foreground truncate">{char.niche}</p>}
                    {char.aesthetic && <p className="text-[10px] text-muted-foreground/70 truncate">{char.aesthetic}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                  {char.photo_urls.length} photo{char.photo_urls.length !== 1 ? "s" : ""}
                  {char.target_audience && <> · {char.target_audience}</>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(char)} className="text-xs h-7 flex-1">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(char.id)} className="text-xs h-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProjectLayout>
  );
};

export default AIStudioCharacters;

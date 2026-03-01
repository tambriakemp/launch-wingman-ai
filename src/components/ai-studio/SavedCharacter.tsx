import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, CheckCircle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SavedCharacterProps {
  onSelect: (base64: string) => void;
  onSelectMultiple?: (base64s: string[]) => void;
  isActive?: boolean;
}

const BUCKET = 'ai-studio';
const MAX_REFS = 3;
const REF_LABELS = ['Face (Front)', 'Profile (Side)', 'Full Body'];
const getPath = (userId: string, index: number) => `characters/${userId}/saved-reference-${index}.png`;

const SavedCharacter: React.FC<SavedCharacterProps> = ({ onSelect, onSelectMultiple, isActive }) => {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([null, null, null]);
  const [internalActive, setInternalActive] = useState(isActive ?? false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const urls: (string | null)[] = [null, null, null];
      for (let i = 0; i < MAX_REFS; i++) {
        const path = getPath(user.id, i);
        const { data } = await supabase.storage.from(BUCKET).list(`characters/${user.id}`, { limit: 10, search: `saved-reference-${i}` });
        if (data && data.length > 0) {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
          urls[i] = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }
      // Also check legacy single reference
      if (!urls[0]) {
        const { data } = await supabase.storage.from(BUCKET).list(`characters/${user.id}`, { limit: 1, search: 'saved-reference.png' });
        if (data && data.length > 0) {
          const legacyPath = `characters/${user.id}/saved-reference.png`;
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(legacyPath);
          urls[0] = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }
      setThumbnails(urls);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB.'); return; }

    setUploading(activeSlot);
    const path = getPath(userId, activeSlot);

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error('Failed to save character photo.'); setUploading(null); return; }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setThumbnails(prev => {
      const next = [...prev];
      next[activeSlot] = `${urlData.publicUrl}?t=${Date.now()}`;
      return next;
    });
    toast.success(`${REF_LABELS[activeSlot]} photo saved!`);
    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (index: number) => {
    if (!userId) return;
    const { error } = await supabase.storage.from(BUCKET).remove([getPath(userId, index)]);
    if (error) { toast.error('Failed to delete.'); return; }
    setThumbnails(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    toast.success('Photo removed.');
  };

  const handleUse = async () => {
    const validUrls = thumbnails.filter(Boolean) as string[];
    if (validUrls.length === 0) return;
    setSelecting(true);
    try {
      const base64s: string[] = [];
      for (const url of validUrls) {
        const res = await fetch(url);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        base64s.push(b64);
      }
      // Always call onSelect with first image for backward compatibility
      onSelect(base64s[0]);
      // If multiple refs and handler exists, pass all
      if (onSelectMultiple && base64s.length > 1) {
        onSelectMultiple(base64s);
      }
      setSelecting(false);
      setInternalActive(true);
      toast.success('Character photo(s) applied!');
    } catch {
      toast.error('Failed to load image.');
      setSelecting(false);
    }
  };

  const hasAnyPhoto = thumbnails.some(Boolean);
  const filledCount = thumbnails.filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-3">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading saved character...
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase text-muted-foreground">
          Saved Character {filledCount > 0 && <span className="text-primary">({filledCount}/{MAX_REFS})</span>}
        </label>
        {internalActive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
            <CheckCircle className="h-3 w-3" /> In Use
          </span>
        )}
      </div>

      {hasAnyPhoto ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {thumbnails.map((url, i) => (
              <div key={i} className="relative group">
                {url ? (
                  <div className="relative">
                    <img
                      src={url}
                      alt={REF_LABELS[i]}
                      className={`w-full aspect-square rounded-lg object-cover border-2 ${internalActive ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                    />
                    <button
                      onClick={() => handleDelete(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[8px] text-center py-0.5 text-muted-foreground rounded-b-lg">
                      {REF_LABELS[i]}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveSlot(i); fileInputRef.current?.click(); }}
                    disabled={uploading !== null}
                    className="w-full aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    {uploading === i ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="text-[8px]">{REF_LABELS[i]}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleUse} disabled={selecting} className="text-xs h-7 px-3 flex-1">
              {selecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
              Use {filledCount > 1 ? `All ${filledCount} Photos` : 'This Photo'}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Upload up to 3 angles (face, profile, full body) for better consistency across scenes.</p>
        </div>
      ) : (
        <button
          onClick={() => { setActiveSlot(0); fileInputRef.current?.click(); }}
          disabled={uploading !== null}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          {uploading !== null ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Upload className="h-4 w-4" /> Save character photos for reuse (up to 3 angles)</>
          )}
        </button>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>OR upload a new one below</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
};

export default SavedCharacter;

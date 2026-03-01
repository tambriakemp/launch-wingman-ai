import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User, Trash2, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SavedCharacterProps {
  onSelect: (base64: string) => void;
}

const BUCKET = 'ai-studio';
const getPath = (userId: string) => `characters/${userId}/saved-reference.png`;

const SavedCharacter: React.FC<SavedCharacterProps> = ({ onSelect }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const path = getPath(user.id);
      const { data } = await supabase.storage.from(BUCKET).list(`characters/${user.id}`, { limit: 1, search: 'saved-reference' });

      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setThumbnailUrl(`${urlData.publicUrl}?t=${Date.now()}`);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB.'); return; }

    setUploading(true);
    const path = getPath(userId);

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error('Failed to save character photo.'); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setThumbnailUrl(`${urlData.publicUrl}?t=${Date.now()}`);
    toast.success('Character photo saved!');
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!userId) return;
    const { error } = await supabase.storage.from(BUCKET).remove([getPath(userId)]);
    if (error) { toast.error('Failed to delete.'); return; }
    setThumbnailUrl(null);
    toast.success('Saved character removed.');
  };

  const handleUse = async () => {
    if (!thumbnailUrl) return;
    setSelecting(true);
    try {
      const res = await fetch(thumbnailUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
        setSelecting(false);
        toast.success('Character photo applied!');
      };
      reader.readAsDataURL(blob);
    } catch {
      toast.error('Failed to load image.');
      setSelecting(false);
    }
  };

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
      <label className="block text-xs font-bold uppercase text-muted-foreground">Saved Character</label>

      {thumbnailUrl ? (
        <div className="flex items-center gap-4 bg-muted/50 border border-border rounded-xl p-3">
          <img
            src={thumbnailUrl}
            alt="Saved character"
            className="w-16 h-16 rounded-lg object-cover border border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Your saved reference photo</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="default" onClick={handleUse} disabled={selecting} className="text-xs h-7 px-3">
                {selecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                Use This
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-xs h-7 px-3 text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Upload className="h-4 w-4" /> Save a character photo for reuse</>
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

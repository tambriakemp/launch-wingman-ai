import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, CheckCircle, Loader2, Plus, Image } from 'lucide-react';
import { toast } from 'sonner';

interface SavedEnvironmentsProps {
  onSelect: (base64: string) => void;
}

const BUCKET = 'ai-studio';

interface EnvironmentEntry {
  id: string;
  label: string;
  file_path: string;
  thumbnailUrl: string;
}

const SavedEnvironments: React.FC<SavedEnvironmentsProps> = ({ onSelect }) => {
  const [entries, setEntries] = useState<EnvironmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('ai_studio_environments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setEntries(data.map(row => {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(row.file_path);
          return { id: row.id, label: row.label, file_path: row.file_path, thumbnailUrl: urlData.publicUrl };
        }));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB.'); return; }
    setNewFile(file);
  };

  const handleSave = async () => {
    if (!userId || !newFile || !newLabel.trim()) {
      toast.error('Please provide both a label and an image.');
      return;
    }
    setUploading(true);
    const fileId = crypto.randomUUID();
    const filePath = `environments/${userId}/${fileId}.png`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filePath, newFile, { contentType: newFile.type });
    if (uploadErr) { toast.error('Failed to upload image.'); setUploading(false); return; }

    const { data: row, error: insertErr } = await supabase
      .from('ai_studio_environments')
      .insert({ user_id: userId, label: newLabel.trim(), file_path: filePath })
      .select()
      .single();

    if (insertErr || !row) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      toast.error('Failed to save environment.');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    setEntries(prev => [...prev, { id: row.id, label: row.label, file_path: row.file_path, thumbnailUrl: urlData.publicUrl }]);
    setNewLabel('');
    setNewFile(null);
    setAdding(false);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Environment saved!');
  };

  const handleDelete = async (entry: EnvironmentEntry) => {
    await supabase.storage.from(BUCKET).remove([entry.file_path]);
    await supabase.from('ai_studio_environments').delete().eq('id', entry.id);
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    toast.success(`"${entry.label}" removed.`);
  };

  const handleUse = async (entry: EnvironmentEntry) => {
    setSelecting(entry.id);
    try {
      const res = await fetch(entry.thumbnailUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
        setSelecting(null);
        toast.success(`"${entry.label}" applied!`);
      };
      reader.readAsDataURL(blob);
    } catch {
      toast.error('Failed to load image.');
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-3">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading saved environments...
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase text-muted-foreground">Saved Environments</label>

      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
          {entries.map(entry => (
            <div key={entry.id} className="bg-muted/50 border border-border rounded-lg p-2 space-y-1.5">
              <img src={entry.thumbnailUrl} alt={entry.label} className="w-full h-16 rounded object-cover border border-border" />
              <p className="text-[11px] font-medium text-foreground truncate">{entry.label}</p>
              <div className="flex gap-1">
                <Button size="sm" variant="default" onClick={() => handleUse(entry)} disabled={selecting === entry.id} className="text-[10px] h-6 px-2 flex-1">
                  {selecting === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-0.5" /> Use</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(entry)} className="text-[10px] h-6 px-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/30">
          <input
            type="text"
            placeholder="Label (e.g. Kitchen, Office)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          >
            {newFile ? (
              <><Image className="h-3 w-3" /> {newFile.name}</>
            ) : (
              <><Upload className="h-3 w-3" /> Choose image</>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={uploading || !newLabel.trim() || !newFile} className="text-xs h-7 flex-1">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewFile(null); setNewLabel(''); }} className="text-xs h-7">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Environment
        </button>
      )}

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>OR upload a new one below</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
};

export default SavedEnvironments;

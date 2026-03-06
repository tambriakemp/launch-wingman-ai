import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppConfig } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LOOK_KEYS = [
  'vlogCategory', 'vlogTopic', 'creationMode',
  'useOwnScript', 'userScript', 'ugcPrompt',
  'avatarDescription', 'productDescription', 'useProductAsHair',
  'exactMatch', 'matchFace', 'matchSkin',
  'aspectRatio', 'cameraMovement',
  'outfitType', 'outfitDetails', 'outfitAdditionalInfo',
  'finalLookType', 'finalLook', 'finalLookAdditionalInfo',
  'hairstyle', 'customHairstyle',
  'makeup', 'customMakeup',
  'skinComplexion', 'customSkinComplexion', 'skinUndertone',
  'nailStyle', 'customNailStyle',
  'ultraRealistic',
] as const;

type LookSettings = Pick<AppConfig, typeof LOOK_KEYS[number]>;

interface SavedLook {
  id: string;
  name: string;
  settings: LookSettings;
}

interface SavedLooksProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const SavedLooks: React.FC<SavedLooksProps> = ({ config, setConfig }) => {
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchLooks();
  }, []);

  const fetchLooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('ai_studio_saved_looks')
      .select('id, name, settings')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLooks(data.map(d => ({ id: d.id, name: d.name, settings: d.settings as unknown as LookSettings })));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const settings: Record<string, unknown> = {};
    for (const key of LOOK_KEYS) {
      settings[key] = config[key];
    }

    const { error } = await supabase.from('ai_studio_saved_looks').insert([{
      user_id: user.id,
      name: name.trim(),
      settings: settings as unknown as import('@/integrations/supabase/types').Json,
    }]);

    if (error) {
      toast.error('Failed to save look');
    } else {
      toast.success(`"${name.trim()}" saved!`);
      setName('');
      setShowForm(false);
      fetchLooks();
    }
    setSaving(false);
  };

  const handleLoad = (look: SavedLook) => {
    setConfig(prev => ({ ...prev, ...look.settings }));
    toast.success(`"${look.name}" loaded`);
  };

  const handleDelete = async (look: SavedLook) => {
    const { error } = await supabase.from('ai_studio_saved_looks').delete().eq('id', look.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setLooks(prev => prev.filter(l => l.id !== look.id));
      toast.success(`"${look.name}" deleted`);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Saved Looks</label>

      {looks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {looks.map(look => (
            <div key={look.id} className="flex items-center gap-1 bg-muted rounded-lg px-3 py-1.5 text-xs group">
              <button onClick={() => handleLoad(look)} className="font-medium text-foreground hover:text-primary transition-colors">
                {look.name}
              </button>
              <button onClick={() => handleDelete(look)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Glam Night Out"
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <Button size="sm" variant="default" onClick={handleSave} disabled={saving || !name.trim()} className="h-8 text-xs px-3">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setName(''); }} className="h-8 text-xs px-2">
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-8 text-xs gap-1.5">
          <Save className="h-3 w-3" /> Save This Look
        </Button>
      )}
    </div>
  );
};

export default SavedLooks;

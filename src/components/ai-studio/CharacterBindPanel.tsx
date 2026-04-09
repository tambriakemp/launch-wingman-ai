import React, { useState, useEffect } from 'react';
import { CharacterBindConfig } from './types';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link2, User, Image as ImageIcon } from 'lucide-react';

interface CharacterBindPanelProps {
  bind: CharacterBindConfig;
  onChange: (bind: CharacterBindConfig) => void;
  sessionReferenceUrl?: string | null;
}

export const CharacterBindPanel: React.FC<CharacterBindPanelProps> = ({
  bind, onChange, sessionReferenceUrl,
}) => {
  const [characters, setCharacters] = useState<any[]>([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('characters')
        .select('id, name, photo_urls')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (data) setCharacters(data);
    };
    if (bind.enabled) fetchCharacters();
  }, [bind.enabled]);

  const getCharacterPhotoUrl = (char: any): string | null => {
    const photos = char.photo_urls as any;
    if (!photos) return null;
    if (typeof photos === 'object' && photos.front) return photos.front;
    if (Array.isArray(photos) && photos.length > 0) return photos[0];
    return null;
  };

  const handleSourceChange = (source: 'session' | 'character') => {
    if (source === 'session') {
      onChange({ ...bind, source, referenceUrl: sessionReferenceUrl || undefined, characterId: undefined });
    } else {
      onChange({ ...bind, source, referenceUrl: undefined });
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    const char = characters.find(c => c.id === characterId);
    const url = char ? getCharacterPhotoUrl(char) : undefined;
    onChange({ ...bind, characterId, referenceUrl: url || undefined });
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase text-foreground">Bind Character</span>
        </div>
        <Switch
          checked={bind.enabled}
          onCheckedChange={(checked) => onChange({
            ...bind,
            enabled: checked,
            referenceUrl: checked && bind.source === 'session' ? sessionReferenceUrl || undefined : bind.referenceUrl,
          })}
        />
      </div>

      {bind.enabled && (
        <>
          <p className="text-[10px] text-muted-foreground">
            Locks face/body consistency across the video using a reference image.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => handleSourceChange('session')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                bind.source === 'session'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Session Ref
            </button>
            <button
              onClick={() => handleSourceChange('character')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                bind.source === 'character'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Saved Character
            </button>
          </div>

          {bind.source === 'character' && (
            <Select value={bind.characterId || ''} onValueChange={handleCharacterSelect}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="text-xs">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {bind.referenceUrl && (
            <div className="flex items-center gap-2">
              <img src={bind.referenceUrl} alt="Bound character" className="w-10 h-10 rounded-md object-cover border border-primary/30" />
              <span className="text-[10px] text-primary font-medium">Character bound ✓</span>
            </div>
          )}

          {bind.source === 'session' && !sessionReferenceUrl && (
            <p className="text-[10px] text-amber-500">Upload a reference image first to bind.</p>
          )}
        </>
      )}
    </div>
  );
};

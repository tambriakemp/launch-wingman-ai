import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Character {
  id: string;
  name: string;
  niche: string;
  aesthetic: string;
  personality_traits: string;
  target_audience: string;
  brand_colors: string;
  photo_urls: string[];
}

interface SavedCharacterProps {
  onSelect: (urlOrBase64: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
  onCharacterSelect?: (character: Character) => void;
  isActive?: boolean;
}

const SavedCharacter: React.FC<SavedCharacterProps> = ({ onSelect, onSelectMultiple, onCharacterSelect, isActive }) => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCharacters(data.map((c: any) => ({ ...c, photo_urls: c.photo_urls || [] })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleUse = (char: Character) => {
    if (char.photo_urls.length === 0) {
      toast.error('This character has no photos.');
      return;
    }
    setSelectedId(char.id);
    onSelect(char.photo_urls[0]);
    if (onSelectMultiple && char.photo_urls.length > 1) {
      onSelectMultiple(char.photo_urls);
    }
    if (onCharacterSelect) {
      onCharacterSelect(char);
    }
    toast.success(`${char.name} applied!`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-3">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading characters...
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase text-muted-foreground">
          Saved Characters {characters.length > 0 && <span className="text-primary">({characters.length})</span>}
        </label>
        <button
          onClick={() => navigate('/app/ai-studio/characters')}
          className="text-[10px] text-primary hover:underline"
        >
          Manage
        </button>
      </div>

      {characters.length > 0 ? (
        <div className="space-y-2">
          {characters.map((char) => {
            const isSelected = selectedId === char.id || (isActive && selectedId === char.id);
            return (
              <button
                key={char.id}
                onClick={() => handleUse(char)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
                }`}
              >
                {char.photo_urls[0] ? (
                  <img src={char.photo_urls[0]} alt={char.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-card-foreground truncate">{char.name}</p>
                  {char.niche && <p className="text-[10px] text-muted-foreground truncate">{char.niche}</p>}
                </div>
                {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={() => navigate('/app/ai-studio/characters')}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <User className="h-4 w-4" /> Create your first character
        </button>
      )}

    </div>
  );
};

export default SavedCharacter;

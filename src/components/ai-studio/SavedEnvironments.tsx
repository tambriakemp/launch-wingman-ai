import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Trash2, Upload, Loader2, Plus, Image, ChevronDown, ChevronRight, Images, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SavedEnvironmentsProps {
  onSelect: (base64: string) => void;
  onSelectMultiple?: (base64Images: string[]) => void;
  activeGroupId?: string | null;
}

const BUCKET = 'ai-studio';
const MAX_IMAGES_PER_GROUP = 8;

interface EnvironmentEntry {
  id: string;
  label: string;
  file_path: string;
  thumbnailUrl: string;
  group_id: string | null;
}

interface EnvironmentGroup {
  id: string;
  name: string;
  images: EnvironmentEntry[];
}

const SavedEnvironments: React.FC<SavedEnvironmentsProps> = ({ onSelect, onSelectMultiple, activeGroupId }) => {
  const [groups, setGroups] = useState<EnvironmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Group creation state
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupFiles, setNewGroupFiles] = useState<File[]>([]);
  const [savingGroup, setSavingGroup] = useState(false);
  const groupFileInputRef = useRef<HTMLInputElement>(null);

  // Add image to existing group
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  // Selecting / loading
  const [selectingGroupId, setSelectingGroupId] = useState<string | null>(null);
  const [internalActiveGroupId, setInternalActiveGroupId] = useState<string | null>(activeGroupId ?? null);
  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: groupRows } = await supabase
      .from('ai_studio_environment_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const { data: envRows } = await supabase
      .from('ai_studio_environments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const entries: EnvironmentEntry[] = (envRows || []).map(row => {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(row.file_path);
      return {
        id: row.id,
        label: row.label,
        file_path: row.file_path,
        thumbnailUrl: urlData.publicUrl,
        group_id: (row as any).group_id || null,
      };
    });

    const builtGroups: EnvironmentGroup[] = (groupRows || []).map(g => ({
      id: g.id,
      name: g.name,
      images: entries.filter(e => e.group_id === g.id),
    }));

    setGroups(builtGroups);
    setLoading(false);
  };

  const handleGroupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not an image.`); return false; }
      if (f.size > 25 * 1024 * 1024) { toast.error(`${f.name} is too large (max 25MB).`); return false; }
      return true;
    });
    const total = newGroupFiles.length + valid.length;
    if (total > MAX_IMAGES_PER_GROUP) {
      toast.error(`Maximum ${MAX_IMAGES_PER_GROUP} images per group.`);
      setNewGroupFiles(prev => [...prev, ...valid].slice(0, MAX_IMAGES_PER_GROUP));
    } else {
      setNewGroupFiles(prev => [...prev, ...valid]);
    }
    if (e.target) e.target.value = '';
  };

  const handleSaveGroup = async () => {
    if (!userId || !newGroupName.trim() || newGroupFiles.length === 0) {
      toast.error('Please provide a name and at least one image.');
      return;
    }
    setSavingGroup(true);

    const { data: groupRow, error: groupErr } = await supabase
      .from('ai_studio_environment_groups')
      .insert({ user_id: userId, name: newGroupName.trim() })
      .select()
      .single();

    if (groupErr || !groupRow) {
      toast.error('Failed to create environment group.');
      setSavingGroup(false);
      return;
    }

    const uploadedEntries: EnvironmentEntry[] = [];
    for (const file of newGroupFiles) {
      const fileId = crypto.randomUUID();
      const filePath = `environments/${userId}/${groupRow.id}/${fileId}.png`;

      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { contentType: file.type });
      if (uploadErr) { console.error('Upload failed:', uploadErr); continue; }

      const { data: row, error: insertErr } = await supabase
        .from('ai_studio_environments')
        .insert({ user_id: userId, label: file.name, file_path: filePath, group_id: groupRow.id } as any)
        .select()
        .single();

      if (!insertErr && row) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        uploadedEntries.push({
          id: row.id,
          label: row.label,
          file_path: row.file_path,
          thumbnailUrl: urlData.publicUrl,
          group_id: groupRow.id,
        });
      }
    }

    setGroups(prev => [...prev, { id: groupRow.id, name: groupRow.name, images: uploadedEntries }]);
    setNewGroupName('');
    setNewGroupFiles([]);
    setCreatingGroup(false);
    setSavingGroup(false);
    toast.success(`"${groupRow.name}" group created with ${uploadedEntries.length} images!`);
  };

  const handleDeleteGroup = async (group: EnvironmentGroup) => {
    const paths = group.images.map(e => e.file_path);
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from('ai_studio_environment_groups').delete().eq('id', group.id);
    setGroups(prev => prev.filter(g => g.id !== group.id));
    toast.success(`"${group.name}" removed.`);
  };

  const handleUseGroup = async (group: EnvironmentGroup) => {
    if (!onSelectMultiple) {
      if (group.images.length > 0) {
        setSelectingGroupId(group.id);
        try {
          const res = await fetch(group.images[0].thumbnailUrl);
          const blob = await res.blob();
          const b64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          onSelect(b64);
          setInternalActiveGroupId(group.id);
          toast.success(`"${group.name}" applied!`);
        } catch {
          toast.error('Failed to load image.');
        } finally {
          setSelectingGroupId(null);
        }
      }
      return;
    }

    setSelectingGroupId(group.id);
    try {
      const base64Array: string[] = [];
      for (const img of group.images) {
        const res = await fetch(img.thumbnailUrl);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        base64Array.push(b64);
      }
      onSelectMultiple(base64Array);
      if (base64Array.length > 0) onSelect(base64Array[0]);
      setInternalActiveGroupId(group.id);
      toast.success(`"${group.name}" applied (${base64Array.length} reference images)!`);
    } catch {
      toast.error('Failed to load images.');
    } finally {
      setSelectingGroupId(null);
    }
  };

  const handleAddImageToGroup = async (groupId: string, file: File) => {
    if (!userId) return;
    const group = groups.find(g => g.id === groupId);
    if (group && group.images.length >= MAX_IMAGES_PER_GROUP) {
      toast.error(`Maximum ${MAX_IMAGES_PER_GROUP} images per group.`);
      return;
    }

    setAddingToGroupId(groupId);
    const fileId = crypto.randomUUID();
    const filePath = `environments/${userId}/${groupId}/${fileId}.png`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { contentType: file.type });
    if (uploadErr) { toast.error('Upload failed.'); setAddingToGroupId(null); return; }

    const { data: row, error: insertErr } = await supabase
      .from('ai_studio_environments')
      .insert({ user_id: userId, label: file.name, file_path: filePath, group_id: groupId } as any)
      .select()
      .single();

    if (!insertErr && row) {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      const newEntry: EnvironmentEntry = {
        id: row.id, label: row.label, file_path: row.file_path,
        thumbnailUrl: urlData.publicUrl, group_id: groupId,
      };
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, images: [...g.images, newEntry] } : g));
      toast.success('Image added!');
    }
    setAddingToGroupId(null);
  };

  const handleDeleteImageFromGroup = async (groupId: string, entry: EnvironmentEntry) => {
    await supabase.storage.from(BUCKET).remove([entry.file_path]);
    await supabase.from('ai_studio_environments').delete().eq('id', entry.id);
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, images: g.images.filter(e => e.id !== entry.id) } : g));
  };

  const toggleExpanded = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
      {/* Environment Groups */}
      {groups.map(group => (
        <Collapsible key={group.id} open={expandedGroups.has(group.id)} onOpenChange={() => toggleExpanded(group.id)}>
          <div className={`bg-muted/50 border-2 rounded-lg overflow-hidden ${internalActiveGroupId === group.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-2">
                  {expandedGroups.has(group.id) ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <Images className="h-3.5 w-3.5 text-primary" />
                   <span className="text-xs font-medium text-foreground">{group.name}</span>
                   <span className="text-[10px] text-muted-foreground">({group.images.length} photos)</span>
                   {internalActiveGroupId === group.id && (
                     <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase text-primary bg-primary/10 border border-primary/30 rounded-full px-1.5 py-0.5">
                       <CheckCircle className="h-2.5 w-2.5" /> In Use
                     </span>
                   )}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="default" onClick={() => handleUseGroup(group)} disabled={selectingGroupId === group.id || group.images.length === 0} className="text-[10px] h-6 px-2">
                    {selectingGroupId === group.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-0.5" /> Use All</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteGroup(group)} className="text-[10px] h-6 px-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 pt-1">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {group.images.map(img => (
                    <div key={img.id} className="relative flex-shrink-0 group/img">
                      <img src={img.thumbnailUrl} alt={img.label} className="w-16 h-16 rounded object-cover border border-border" />
                      <button
                        onClick={() => handleDeleteImageFromGroup(group.id, img)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                  {group.images.length < MAX_IMAGES_PER_GROUP && (
                    <button
                      onClick={() => {
                        setAddingToGroupId(group.id);
                        addImageInputRef.current?.click();
                      }}
                      className="w-16 h-16 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-border rounded text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                    >
                      {addingToGroupId === group.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      {/* Hidden file input for adding image to group */}
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && addingToGroupId) {
            if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
            if (file.size > 25 * 1024 * 1024) { toast.error('Image must be under 25MB.'); return; }
            handleAddImageToGroup(addingToGroupId, file);
          }
          if (e.target) e.target.value = '';
        }}
      />

      {/* Create Group Form */}
      {creatingGroup ? (
        <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/30">
          <input
            type="text"
            placeholder="Group name (e.g. Kitchen, Office)"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            onClick={() => groupFileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          >
            {newGroupFiles.length > 0 ? (
              <><Image className="h-3 w-3" /> {newGroupFiles.length} image{newGroupFiles.length !== 1 ? 's' : ''} selected</>
            ) : (
              <><Upload className="h-3 w-3" /> Choose images (1-{MAX_IMAGES_PER_GROUP})</>
            )}
          </button>
          <input ref={groupFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGroupFileSelect} />
          {newGroupFiles.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {newGroupFiles.map((f, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-12 h-12 rounded object-cover border border-border" />
                  <button
                    onClick={() => setNewGroupFiles(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <Trash2 className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveGroup} disabled={savingGroup || !newGroupName.trim() || newGroupFiles.length === 0} className="text-xs h-7 flex-1">
              {savingGroup ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Create Group
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreatingGroup(false); setNewGroupFiles([]); setNewGroupName(''); }} className="text-xs h-7">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreatingGroup(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Environment Group
        </button>
      )}
    </div>
  );
};

export default SavedEnvironments;

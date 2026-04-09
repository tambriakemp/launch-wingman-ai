import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Pencil, Images, X, Image } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "ai-studio";
const MAX_IMAGES_PER_GROUP = 8;

interface EnvironmentEntry {
  id: string;
  label: string;
  file_path: string;
  thumbnailUrl: string;
  group_id: string;
}

interface EnvironmentGroup {
  id: string;
  name: string;
  images: EnvironmentEntry[];
  created_at: string;
}

const AIStudioEnvironments = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<EnvironmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adding images to existing group
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: groupRows } = await supabase
      .from("ai_studio_environment_groups")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: envRows } = await supabase
      .from("ai_studio_environments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const entries: EnvironmentEntry[] = (envRows || []).map((row: any) => {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(row.file_path);
      return {
        id: row.id,
        label: row.label,
        file_path: row.file_path,
        thumbnailUrl: urlData.publicUrl,
        group_id: row.group_id || "",
      };
    });

    setGroups(
      (groupRows || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        images: entries.filter((e) => e.group_id === g.id),
        created_at: g.created_at,
      }))
    );
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} is not an image.`); return false; }
      if (f.size > 25 * 1024 * 1024) { toast.error(`${f.name} is too large (max 25MB).`); return false; }
      return true;
    });
    const total = pendingFiles.length + valid.length;
    if (total > MAX_IMAGES_PER_GROUP) {
      toast.error(`Maximum ${MAX_IMAGES_PER_GROUP} images per environment.`);
      setPendingFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES_PER_GROUP));
    } else {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
    if (e.target) e.target.value = "";
  };

  const handleSave = async () => {
    if (!userId || !groupName.trim()) {
      toast.error("Please provide a name.");
      return;
    }

    if (!editingId && pendingFiles.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }

    setSaving(true);

    if (editingId) {
      // Update name only
      const { error } = await supabase
        .from("ai_studio_environment_groups")
        .update({ name: groupName.trim() })
        .eq("id", editingId);
      if (error) { toast.error("Failed to update."); setSaving(false); return; }

      // Upload any new pending files
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadImageToGroup(editingId, file);
        }
      }

      toast.success("Environment updated!");
    } else {
      // Create new group
      const { data: groupRow, error: groupErr } = await supabase
        .from("ai_studio_environment_groups")
        .insert({ user_id: userId, name: groupName.trim() })
        .select()
        .single();
      if (groupErr || !groupRow) { toast.error("Failed to create environment."); setSaving(false); return; }

      for (const file of pendingFiles) {
        await uploadImageToGroup(groupRow.id, file);
      }

      toast.success(`"${groupRow.name}" created with ${pendingFiles.length} images!`);
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setGroupName("");
    setPendingFiles([]);
    fetchGroups();
  };

  const uploadImageToGroup = async (groupId: string, file: File) => {
    if (!userId) return;
    const fileId = crypto.randomUUID();
    const filePath = `environments/${userId}/${groupId}/${fileId}.png`;
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { contentType: file.type });
    if (uploadErr) { console.error("Upload failed:", uploadErr); return; }
    await supabase
      .from("ai_studio_environments")
      .insert({ user_id: userId, label: file.name, file_path: filePath, group_id: groupId } as any);
  };

  const handleAddImageToExistingGroup = async (groupId: string, file: File) => {
    if (!userId) return;
    const group = groups.find((g) => g.id === groupId);
    if (group && group.images.length >= MAX_IMAGES_PER_GROUP) {
      toast.error(`Maximum ${MAX_IMAGES_PER_GROUP} images per environment.`);
      return;
    }
    setAddingToGroupId(groupId);
    await uploadImageToGroup(groupId, file);
    setAddingToGroupId(null);
    toast.success("Image added!");
    fetchGroups();
  };

  const handleDeleteImage = async (entry: EnvironmentEntry) => {
    await supabase.storage.from(BUCKET).remove([entry.file_path]);
    await supabase.from("ai_studio_environments").delete().eq("id", entry.id);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === entry.group_id
          ? { ...g, images: g.images.filter((e) => e.id !== entry.id) }
          : g
      )
    );
  };

  const handleDeleteGroup = async (group: EnvironmentGroup) => {
    const paths = group.images.map((e) => e.file_path);
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("ai_studio_environment_groups").delete().eq("id", group.id);
    setGroups((prev) => prev.filter((g) => g.id !== group.id));
    toast.success(`"${group.name}" removed.`);
  };

  const handleEdit = (group: EnvironmentGroup) => {
    setEditingId(group.id);
    setGroupName(group.name);
    setPendingFiles([]);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setGroupName("");
    setPendingFiles([]);
  };

  const editingGroup = editingId ? groups.find((g) => g.id === editingId) : null;

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto px-2.5 md:px-6 py-8">
        <button
          onClick={() => navigate("/app/ai-studio")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to AI Avatar Studio
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Environment Builder</h1>
            <p className="text-sm text-muted-foreground">
              Build reusable environments — living room, bedroom, kitchen — with multiple reference angles.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setGroupName("");
                setPendingFiles([]);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> New Environment
            </Button>
          )}
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="border border-border rounded-xl bg-card p-6 mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Environment" : "New Environment"}
              </h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Environment Name *
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Modern Living Room, Cozy Bedroom, Home Office"
              />
            </div>

            {/* Existing images when editing */}
            {editingGroup && editingGroup.images.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Current Photos ({editingGroup.images.length}/{MAX_IMAGES_PER_GROUP})
                </label>
                <div className="flex gap-3 flex-wrap">
                  {editingGroup.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.thumbnailUrl}
                        alt={img.label}
                        className="w-20 h-20 rounded-lg object-cover border-2 border-border"
                      />
                      <button
                        onClick={() => handleDeleteImage(img)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new photos */}
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                {editingId ? "Add More Photos" : "Reference Photos"}
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-4 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
              >
                {pendingFiles.length > 0 ? (
                  <>
                    <Image className="h-4 w-4" /> {pendingFiles.length} image
                    {pendingFiles.length !== 1 ? "s" : ""} selected
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Choose images — different angles of the same
                    space (1-{MAX_IMAGES_PER_GROUP})
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {pendingFiles.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-16 h-16 rounded-lg object-cover border border-border"
                      />
                      <button
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? "Update Environment" : "Save Environment"}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden input for adding images to existing groups */}
        <input
          ref={addImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && addingToGroupId) {
              if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
              if (file.size > 25 * 1024 * 1024) { toast.error("Image must be under 25MB."); return; }
              handleAddImageToExistingGroup(addingToGroupId, file);
            }
            if (e.target) e.target.value = "";
          }}
        />

        {/* Environment List */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading environments...
          </div>
        ) : groups.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No environments yet. Create one to use as a visual setting in your storyboards.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="border border-border rounded-xl bg-card p-4 group/card hover:border-primary/40 transition-colors"
              >
                {/* Thumbnail grid */}
                <div className="grid grid-cols-2 gap-1 mb-3 rounded-lg overflow-hidden">
                  {group.images.slice(0, 4).map((img, i) => (
                    <img
                      key={img.id}
                      src={img.thumbnailUrl}
                      alt={img.label}
                      className={`w-full aspect-square object-cover ${
                        group.images.length === 1 ? "col-span-2 row-span-2" : ""
                      }`}
                    />
                  ))}
                  {group.images.length === 0 && (
                    <div className="col-span-2 aspect-video bg-muted flex items-center justify-center">
                      <Images className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="font-semibold text-sm text-card-foreground truncate">{group.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {group.images.length} photo{group.images.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                    className="text-xs h-7 flex-1"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAddingToGroupId(group.id);
                      addImageInputRef.current?.click();
                    }}
                    disabled={group.images.length >= MAX_IMAGES_PER_GROUP || addingToGroupId === group.id}
                    className="text-xs h-7"
                  >
                    {addingToGroupId === group.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGroup(group)}
                    className="text-xs h-7 text-destructive hover:text-destructive"
                  >
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

export default AIStudioEnvironments;

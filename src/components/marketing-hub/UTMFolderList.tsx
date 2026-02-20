import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FolderOpen, Plus, Trash2, X } from "lucide-react";

interface Folder {
  id: string;
  name: string;
}

interface UTMFolderListProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

export const UTMFolderList = ({ folders, selectedFolderId, onSelect, onCreate, onDelete }: UTMFolderListProps) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreating(!creating)}>
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {creating && (
        <div className="flex gap-1 mb-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Folder name"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <Button size="sm" className="h-8 px-2" onClick={handleCreate}>Add</Button>
        </div>
      )}

      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-left transition-colors",
          selectedFolderId === null
            ? "bg-accent/20 text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <FolderOpen className="w-4 h-4" />
        All Links
      </button>

      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center">
          <button
            onClick={() => onSelect(folder.id)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm flex-1 text-left transition-colors",
              selectedFolderId === folder.id
                ? "bg-accent/20 text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            {folder.name}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={() => onDelete(folder.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

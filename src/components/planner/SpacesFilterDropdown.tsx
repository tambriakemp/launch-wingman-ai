import { useState, useMemo, useRef, useEffect } from "react";
import { Hash, Check, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SpaceOption {
  id: string;
  name: string;
  color?: string | null;
}

interface SpacesFilterDropdownProps {
  spaces: SpaceOption[];
  selectedSpaceId: string | null;
  onSelectSpace: (id: string | null) => void;
  onCreateSpace?: (name: string, color?: string) => Promise<{ id: string } | any>;
  align?: "start" | "end" | "center";
  triggerClassName?: string;
}

export function SpacesFilterDropdown({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onCreateSpace,
  align = "end",
  triggerClassName,
}: SpacesFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || null;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? spaces.filter((s) => s.name.toLowerCase().includes(q)) : spaces),
    [spaces, q]
  );

  const exactMatch = q
    ? spaces.some((s) => s.name.toLowerCase() === q)
    : true;

  useEffect(() => {
    if (open) {
      setQuery("");
      // focus after the menu mounts
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || !onCreateSpace || creating) return;
    setCreating(true);
    try {
      const result = await onCreateSpace(name);
      if (result?.id) {
        onSelectSpace(result.id);
      }
      setQuery("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5 h-8", triggerClassName)}>
          <Hash className="w-3.5 h-3.5" style={{ color: selectedSpace?.color || undefined }} />
          {selectedSpace ? selectedSpace.name : "All spaces"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60 p-0">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim() && !exactMatch && onCreateSpace) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Search or create space..."
              className="w-full h-8 pl-7 pr-2 text-sm bg-muted/50 border border-transparent rounded-md focus:outline-none focus:border-primary/40 focus:bg-background"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {!q && (
            <button
              type="button"
              onClick={() => {
                onSelectSpace(null);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left"
            >
              <span className="flex-1">All spaces</span>
              {selectedSpaceId === null && <Check className="w-3.5 h-3.5" />}
            </button>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelectSpace(s.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left"
            >
              <Hash className="w-3.5 h-3.5" style={{ color: s.color || undefined }} />
              <span className="flex-1 truncate">{s.name}</span>
              {selectedSpaceId === s.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
          {q && filtered.length === 0 && !onCreateSpace && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No spaces found
            </div>
          )}
        </div>

        {q && !exactMatch && onCreateSpace && (
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left rounded-sm disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span className="flex-1 truncate">
                Create <span className="font-medium">"{query.trim()}"</span>
              </span>
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

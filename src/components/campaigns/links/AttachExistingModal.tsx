import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export default function AttachExistingModal({ open, onOpenChange, campaignId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: links, isLoading } = useQuery({
    queryKey: ["unassigned-utm-links", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("utm_links")
        .select("*")
        .eq("user_id", user.id)
        .is("campaign_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && open,
  });

  const filtered = (links ?? []).filter((l) =>
    !search || l.label.toLowerCase().includes(search.toLowerCase()) || l.utm_source.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAttach = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("utm_links")
        .update({ campaign_id: campaignId })
        .in("id", selected);
      if (error) throw error;
      toast.success(`${selected.length} link(s) attached`);
      queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-utm-links"] });
      setSelected([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to attach links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach Existing Links</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search unassigned links..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No unassigned links found.</p>
          ) : (
            filtered.map((l) => (
              <label key={l.id} className="flex items-center gap-3 border rounded-md p-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
                <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggle(l.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.utm_source} / {l.utm_medium}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{(l as any).channel ?? "other"}</Badge>
              </label>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAttach} disabled={selected.length === 0 || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Attach Selected ({selected.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

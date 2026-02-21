import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, ExternalLink, MoreHorizontal, Pause, Archive, Search, Plus, Link2, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AddUTMLinkModal from "../links/AddUTMLinkModal";
import AttachExistingModal from "../links/AttachExistingModal";
import AutoGeneratePanel from "../links/AutoGeneratePanel";
import { CHANNELS } from "../links/utmHelpers";

interface Props {
  campaignId: string;
  campaignName: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
};

export default function LinksTab({ campaignId, campaignName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showAutoGen, setShowAutoGen] = useState(false);

  const { data: links, isLoading } = useQuery({
    queryKey: ["campaign-utm-links", campaignId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("utm_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const filtered = (links ?? []).filter((l) => {
    if (search && !l.label.toLowerCase().includes(search.toLowerCase())) return false;
    if (channelFilter !== "all" && (l as any).channel !== channelFilter) return false;
    if (statusFilter !== "all" && (l as any).status !== statusFilter) return false;
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("utm_links").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Link ${status}`);
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  const duplicateLink = async (link: any) => {
    if (!user?.id) return;
    const shortCode = Math.random().toString(36).slice(2, 10);
    const newContent = link.utm_content ? `${link.utm_content}-copy` : "copy";
    const { error } = await supabase.from("utm_links").insert({
      user_id: user.id,
      campaign_id: campaignId,
      label: `${link.label} (Copy)`,
      base_url: link.base_url,
      full_url: link.full_url,
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: newContent,
      utm_term: link.utm_term,
      short_code: shortCode,
      channel: (link as any).channel ?? "other",
      status: "active",
    });
    if (error) { toast.error("Failed to duplicate"); return; }
    toast.success("Link duplicated");
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add UTM Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAttachModal(true)}>
            <Link2 className="w-3.5 h-3.5 mr-1.5" /> Attach Existing
          </Button>
          <Button
            variant={showAutoGen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAutoGen(!showAutoGen)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto-Generate
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search links..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex gap-1">
            {["all", "active", "paused", "archived"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[11px] px-2 py-1 rounded-md capitalize transition-colors ${statusFilter === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Generate Panel */}
      {showAutoGen && <AutoGeneratePanel campaignId={campaignId} campaignName={campaignName} />}

      {/* Links Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-12 text-center">
          <p className="text-sm text-muted-foreground">No UTM links yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create or attach tracking links to measure this campaign's performance.</p>
          <Button size="sm" className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Link
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Channel</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">UTM Preview</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Clicks</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-sm">{l.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{l.base_url}</p>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {CHANNELS.find((c) => c.value === l.channel)?.icon ?? "🔗"} {l.channel}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground font-mono">{l.utm_source}/{l.utm_medium}/{l.utm_campaign}</span>
                  </td>
                  <td className="p-3 text-right">{(l.click_count ?? 0).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] capitalize ${statusColors[l.status] ?? ""}`} variant="secondary">{l.status}</Badge>
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(l.full_url); toast.success("URL copied"); }}>
                          <Copy className="w-3.5 h-3.5 mr-2" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(l.full_url, "_blank")}>
                          <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateLink(l)}>
                          Duplicate
                        </DropdownMenuItem>
                        {l.status === "active" && (
                          <DropdownMenuItem onClick={() => updateStatus(l.id, "paused")}>
                            <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                          </DropdownMenuItem>
                        )}
                        {l.status === "paused" && (
                          <DropdownMenuItem onClick={() => updateStatus(l.id, "active")}>
                            Resume
                          </DropdownMenuItem>
                        )}
                        {l.status !== "archived" && (
                          <DropdownMenuItem onClick={() => updateStatus(l.id, "archived")}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddUTMLinkModal open={showAddModal} onOpenChange={setShowAddModal} campaignId={campaignId} campaignName={campaignName} />
      <AttachExistingModal open={showAttachModal} onOpenChange={setShowAttachModal} campaignId={campaignId} />
    </div>
  );
}

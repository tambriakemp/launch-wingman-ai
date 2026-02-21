import { useState } from "react";
import { Campaign } from "@/types/campaign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusColors, goalLabels } from "./campaignDemoData";
import { ArrowLeft, Pencil, Copy, Archive, AlertTriangle, Link2, Check, X, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiveGateModal from "./links/LiveGateModal";

interface Props {
  campaign: Campaign;
  onSwitchTab?: (tab: string) => void;
}

export default function CampaignDetailHeader({ campaign, onSwitchTab }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showGate, setShowGate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(campaign.name);

  const isDemoCampaign = campaign.id.startsWith("camp-");

  const { data: linkCount } = useQuery({
    queryKey: ["campaign-utm-links-count", campaign.id],
    queryFn: async () => {
      if (!user?.id || isDemoCampaign) return isDemoCampaign ? 4 : 0;
      const { count, error } = await supabase
        .from("utm_links")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id || isDemoCampaign,
  });

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "live" && (linkCount ?? 0) === 0) {
      setShowGate(true);
      return;
    }
    if (isDemoCampaign) { toast.info("Demo campaigns can't be updated"); return; }
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaign.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(newStatus === "live" ? "Campaign is Live. Tracking is active." : `Status → ${newStatus}`);
    queryClient.invalidateQueries({ queryKey: ["campaign-detail", campaign.id] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const handleSaveName = async () => {
    if (isDemoCampaign || !nameValue.trim()) { setEditingName(false); return; }
    const { error } = await supabase.from("campaigns").update({ name: nameValue.trim() }).eq("id", campaign.id);
    if (error) { toast.error("Failed to rename"); return; }
    toast.success("Campaign renamed");
    setEditingName(false);
    queryClient.invalidateQueries({ queryKey: ["campaign-detail", campaign.id] });
  };

  const noLinks = (linkCount ?? 0) === 0;

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/marketing-hub/campaigns")} className="gap-1.5 text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </Button>

      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="h-9 text-lg font-bold w-64" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveName()} />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveName}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(campaign.name); }}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold cursor-pointer group flex items-center gap-2" onClick={() => !isDemoCampaign && setEditingName(true)}>
                {campaign.name}
                {!isDemoCampaign && <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </h1>
            )}

            {/* Status */}
            {isDemoCampaign ? (
              <Badge className={cn("capitalize", statusColors[campaign.status])} variant="secondary">{campaign.status}</Badge>
            ) : (
              <Select value={campaign.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="evergreen">Evergreen</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>


          {/* Tags */}
          {campaign.tags.length > 0 && (
            <div className="flex gap-1.5">
              {campaign.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </div>

      {/* Actions — buttons on desktop, dropdown on mobile */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
            <Archive className="w-3.5 h-3.5" /> Archive
          </Button>
        </div>
        <div className="md:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Copy className="w-3.5 h-3.5 mr-2" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive"><Archive className="w-3.5 h-3.5 mr-2" /> Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Ended banner */}
      {campaign.status === "ended" && (
        <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-amber-700 dark:text-amber-400">This campaign has ended. Convert to Evergreen?</p>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange("evergreen")}>
            Convert to Evergreen
          </Button>
        </div>
      )}

      {/* No-links warning */}
      {noLinks && campaign.status !== "ended" && (
        <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">Tracking is not configured. Attach at least one UTM link before going Live.</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 shrink-0" onClick={() => onSwitchTab?.("links")}>
            <Link2 className="w-3.5 h-3.5" /> Add UTM Link
          </Button>
        </div>
      )}

      <LiveGateModal
        open={showGate}
        onOpenChange={setShowGate}
        onCreateLink={() => { setShowGate(false); onSwitchTab?.("links"); }}
        onAttachLink={() => { setShowGate(false); onSwitchTab?.("links"); }}
      />
    </div>
  );
}

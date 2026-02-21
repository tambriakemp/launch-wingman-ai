import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CHANNELS, CHANNEL_UTM_DEFAULTS, slugify, buildFinalUrl, generateShortCode, isValidUrl } from "./utmHelpers";

interface Props {
  campaignId: string;
  campaignName: string;
}

interface PreviewLink {
  label: string;
  channel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  finalUrl: string;
}

const PLACEMENTS: Record<string, string[]> = {
  instagram: ["bio", "reel1", "story"],
  facebook: ["post", "ad", "group"],
  tiktok: ["bio", "video1", "comment"],
  youtube: ["description", "card", "community"],
  email: ["email1", "email2", "email3"],
  skool: ["post", "about", "comment"],
  other: ["link1", "link2", "link3"],
};

export default function AutoGeneratePanel({ campaignId, campaignName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [baseUrl, setBaseUrl] = useState("");
  const [campaignSlug, setCampaignSlug] = useState(slugify(campaignName));
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [variantCount, setVariantCount] = useState<1 | 3>(1);
  const [preview, setPreview] = useState<PreviewLink[] | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
    setPreview(null);
  };

  const generatePreview = () => {
    if (!baseUrl.trim() || !isValidUrl(baseUrl)) {
      toast.error("Enter a valid base URL");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }

    const links: PreviewLink[] = [];
    for (const ch of selectedChannels) {
      const defaults = CHANNEL_UTM_DEFAULTS[ch];
      const placements = PLACEMENTS[ch] || ["link1"];
      const count = Math.min(variantCount, placements.length);
      for (let i = 0; i < count; i++) {
        const placement = placements[i];
        const chLabel = CHANNELS.find((c) => c.value === ch)?.label ?? ch;
        links.push({
          label: `${chLabel} — ${placement}`,
          channel: ch,
          utmSource: defaults.source,
          utmMedium: defaults.medium,
          utmCampaign: campaignSlug,
          utmContent: placement,
          finalUrl: buildFinalUrl(baseUrl, {
            source: defaults.source,
            medium: defaults.medium,
            campaign: campaignSlug,
            content: placement,
          }),
        });
      }
    }
    setPreview(links);
  };

  const handleGenerate = async () => {
    if (!preview?.length || !user?.id) return;
    setSaving(true);
    try {
      const rows = preview.map((l) => ({
        user_id: user.id,
        campaign_id: campaignId,
        label: l.label,
        base_url: baseUrl,
        full_url: l.finalUrl,
        utm_source: l.utmSource,
        utm_medium: l.utmMedium,
        utm_campaign: l.utmCampaign,
        utm_content: l.utmContent,
        short_code: generateShortCode(),
        channel: l.channel,
        status: "active",
      }));
      const { error } = await supabase.from("utm_links").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} UTM links created`);
      queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
      setPreview(null);
      setSelectedChannels([]);
      setBaseUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Auto-Generate UTM Links</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Base Destination URL</Label>
          <Input value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setPreview(null); }} placeholder="https://..." className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Campaign Slug</Label>
          <Input value={campaignSlug} onChange={(e) => { setCampaignSlug(e.target.value); setPreview(null); }} className="mt-1 h-9 text-sm" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Channels</Label>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              onClick={() => toggleChannel(ch.value)}
              className={`border rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedChannels.includes(ch.value)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <span>{ch.icon}</span> {ch.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">Links per channel:</Label>
        <div className="flex gap-1">
          <Button variant={variantCount === 1 ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => { setVariantCount(1); setPreview(null); }}>1</Button>
          <Button variant={variantCount === 3 ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => { setVariantCount(3); setPreview(null); }}>3</Button>
        </div>
      </div>

      {preview && (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Channel</th>
                <th className="text-left p-2 font-medium text-muted-foreground">UTM Preview</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((l, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-2 font-medium">{l.label}</td>
                  <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.channel}</Badge></td>
                  <td className="p-2 text-muted-foreground font-mono">{l.utmSource}/{l.utmMedium}/{l.utmContent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!preview ? (
          <Button size="sm" onClick={generatePreview} disabled={selectedChannels.length === 0}>
            Preview Links
          </Button>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Generate & Attach ({preview.length})
          </Button>
        )}
      </div>
    </div>
  );
}

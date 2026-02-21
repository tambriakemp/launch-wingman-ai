import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CHANNELS, CHANNEL_UTM_DEFAULTS, slugify, buildFinalUrl, generateShortCode, isValidUrl } from "./utmHelpers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
}

export default function AddUTMLinkModal({ open, onOpenChange, campaignId, campaignName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [destUrl, setDestUrl] = useState("");
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState(slugify(campaignName));
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");

  useEffect(() => {
    setUtmCampaign(slugify(campaignName));
  }, [campaignName]);

  useEffect(() => {
    const defaults = CHANNEL_UTM_DEFAULTS[channel];
    if (defaults) {
      setUtmSource(defaults.source);
      setUtmMedium(defaults.medium);
    }
  }, [channel]);

  const finalUrl = buildFinalUrl(destUrl, {
    source: utmSource,
    medium: utmMedium,
    campaign: utmCampaign,
    content: utmContent || undefined,
    term: utmTerm || undefined,
  });

  const reset = () => {
    setName("");
    setChannel("instagram");
    setDestUrl("");
    setUtmSource("instagram");
    setUtmMedium("social");
    setUtmCampaign(slugify(campaignName));
    setUtmContent("");
    setUtmTerm("");
    setShowPreview(false);
    setSaving(false);
  };

  const handleGenerate = () => {
    if (!name.trim()) { toast.error("Enter a link name"); return; }
    if (!destUrl.trim() || !isValidUrl(destUrl)) { toast.error("Enter a valid destination URL"); return; }
    if (!utmSource.trim()) { toast.error("UTM Source is required"); return; }
    setShowPreview(true);
  };

  const handleSave = async (createAnother: boolean) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const shortCode = generateShortCode();
      const { error } = await supabase.from("utm_links").insert({
        user_id: user.id,
        campaign_id: campaignId,
        label: name,
        base_url: destUrl,
        full_url: finalUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
        short_code: shortCode,
        channel,
        status: "active",
      });
      if (error) throw error;
      toast.success("UTM link created");
      queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
      if (createAnother) {
        reset();
      } else {
        reset();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add UTM Link</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Link Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IG Reel 1, Email #2" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Destination URL</Label>
                <Input value={destUrl} onChange={(e) => setDestUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">UTM Source</Label>
                <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">UTM Medium</Label>
                <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">UTM Campaign</Label>
                <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">UTM Content (optional)</Label>
                <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. v1, reel1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">UTM Term (optional)</Label>
                <Input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleGenerate}>Generate Link</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Final URL</p>
              <p className="text-sm font-mono break-all">{finalUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(finalUrl); toast.success("Copied!"); }}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy URL
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(finalUrl, "_blank")}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
              </Button>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>← Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save & Create Another
                </Button>
                <Button onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Save & Attach
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

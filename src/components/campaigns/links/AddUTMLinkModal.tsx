import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UTMForm, type UTMFormData } from "@/components/marketing-hub/UTMForm";
import { generateShortCode } from "./utmHelpers";

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

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["utm-folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("utm_folders").select("*").eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Fetch saved base URLs
  const { data: savedBaseUrls = [] } = useQuery({
    queryKey: ["utm-base-urls", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("utm_base_urls").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const handleSave = async (formData: UTMFormData, fullUrl: string) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const shortCode = generateShortCode();
      const { error } = await supabase.from("utm_links").insert({
        user_id: user.id,
        campaign_id: campaignId,
        label: formData.label,
        base_url: formData.baseUrl,
        full_url: fullUrl,
        utm_source: formData.utmSource,
        utm_medium: formData.utmMedium,
        utm_campaign: formData.utmCampaign,
        utm_content: formData.utmContent || null,
        utm_term: formData.utmTerm || null,
        short_code: shortCode,
        folder_id: formData.folderId || null,
        channel: "other",
        status: "active",
      });
      if (error) throw error;
      toast.success("UTM link created");
      queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create link");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBaseUrl = async (url: string, label?: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from("utm_base_urls").insert({ user_id: user.id, url, label: label || null });
    if (error) { toast.error("Failed to save base URL"); return; }
    queryClient.invalidateQueries({ queryKey: ["utm-base-urls"] });
    toast.success("Base URL saved");
  };

  const handleDeleteBaseUrl = async (id: string) => {
    const { error } = await supabase.from("utm_base_urls").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    queryClient.invalidateQueries({ queryKey: ["utm-base-urls"] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add UTM Link</DialogTitle>
        </DialogHeader>
        <UTMForm
          folders={folders}
          savedBaseUrls={savedBaseUrls}
          onSave={handleSave}
          onSaveBaseUrl={handleSaveBaseUrl}
          onDeleteBaseUrl={handleDeleteBaseUrl}
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  );
}

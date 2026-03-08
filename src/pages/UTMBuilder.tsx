import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UTMForm, type UTMFormData } from "@/components/marketing-hub/UTMForm";
import { UTMLinkTable } from "@/components/marketing-hub/UTMLinkTable";
import { UTMFolderList } from "@/components/marketing-hub/UTMFolderList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const PUBLISHED_URL = "https://launchely.com";

const generateShortCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const UTMBuilder = () => {
  const { user } = useAuth();
  const { hasAccess, isLoading: featureLoading } = useFeatureAccess();

  if (!featureLoading && !hasAccess('social_calendar')) {
    return (
      <ProjectLayout>
        <div className="max-w-2xl mx-auto py-16">
          <UpgradePrompt feature="social_calendar" variant="card" customMessage="UTM Campaign Builder is a Pro feature. Upgrade to create and track UTM-tagged links." />
        </div>
      </ProjectLayout>
    );
  }
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["utm-folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("utm_folders").select("*").eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch links
  const { data: links = [] } = useQuery({
    queryKey: ["utm-links", user?.id, selectedFolderId],
    queryFn: async () => {
      let query = supabase.from("utm_links").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (selectedFolderId) query = query.eq("folder_id", selectedFolderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch saved base URLs
  const { data: savedBaseUrls = [] } = useQuery({
    queryKey: ["utm-base-urls", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("utm_base_urls").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Save link
  const saveLinkMutation = useMutation({
    mutationFn: async ({ formData, fullUrl }: { formData: UTMFormData; fullUrl: string }) => {
      const shortCode = generateShortCode();
      const { error } = await supabase.from("utm_links").insert({
        user_id: user!.id, folder_id: formData.folderId || null, base_url: formData.baseUrl,
        utm_source: formData.utmSource, utm_medium: formData.utmMedium, utm_campaign: formData.utmCampaign,
        utm_term: formData.utmTerm || null, utm_content: formData.utmContent || null,
        full_url: fullUrl, short_code: shortCode, label: formData.label,
      });
      if (error) {
        if (error.code === "23505") {
          const { error: retryError } = await supabase.from("utm_links").insert({
            user_id: user!.id, folder_id: formData.folderId || null, base_url: formData.baseUrl,
            utm_source: formData.utmSource, utm_medium: formData.utmMedium, utm_campaign: formData.utmCampaign,
            utm_term: formData.utmTerm || null, utm_content: formData.utmContent || null,
            full_url: fullUrl, short_code: generateShortCode(), label: formData.label,
          });
          if (retryError) throw retryError;
        } else throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
      queryClient.invalidateQueries({ queryKey: ["utm-stats"] });
      toast({ title: "Link saved!", description: "Your UTM link has been created." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save link.", variant: "destructive" }),
  });

  // Move link to folder
  const moveLinkMutation = useMutation({
    mutationFn: async ({ linkId, folderId }: { linkId: string; folderId: string | null }) => {
      const { error } = await supabase.from("utm_links").update({ folder_id: folderId }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
      toast({ title: "Moved", description: "Link moved to folder." });
    },
  });

  // Delete link
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("utm_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
      queryClient.invalidateQueries({ queryKey: ["utm-stats"] });
      toast({ title: "Deleted", description: "Link removed." });
    },
  });

  // Create folder
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("utm_folders").insert({ user_id: user!.id, name });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["utm-folders"] }),
  });

  // Delete folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("utm_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (selectedFolderId) setSelectedFolderId(null);
      queryClient.invalidateQueries({ queryKey: ["utm-folders"] });
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
    },
  });

  // Save base URL
  const saveBaseUrlMutation = useMutation({
    mutationFn: async ({ url, label }: { url: string; label?: string }) => {
      const { error } = await supabase.from("utm_base_urls").insert({ user_id: user!.id, url, label: label || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-base-urls"] });
      toast({ title: "Base URL saved!" });
    },
  });

  // Delete base URL
  const deleteBaseUrlMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("utm_base_urls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["utm-base-urls"] }),
  });

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/marketing-hub"
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">UTM Campaign Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">Create UTM-tagged links, organize them into folders, and track clicks.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Link</CardTitle>
          </CardHeader>
          <CardContent>
            <UTMForm
              folders={folders}
              savedBaseUrls={savedBaseUrls}
              onSave={(formData, fullUrl) => saveLinkMutation.mutate({ formData, fullUrl })}
              onSaveBaseUrl={(url, label) => saveBaseUrlMutation.mutate({ url, label })}
              onDeleteBaseUrl={(id) => deleteBaseUrlMutation.mutate(id)}
              saving={saveLinkMutation.isPending}
            />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-[200px_1fr] gap-4">
          <Card className="p-3">
            <UTMFolderList
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelect={setSelectedFolderId}
              onCreate={(name) => createFolderMutation.mutate(name)}
              onDelete={(id) => deleteFolderMutation.mutate(id)}
            />
          </Card>

          <Card>
            <CardHeader className="pb-3">
            <CardTitle className="text-base">
                {selectedFolderId ? `${folders.find((f) => f.id === selectedFolderId)?.name || "Folder"} (${links.length})` : `All Saved Links (${links.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UTMLinkTable
                links={links}
                folders={folders}
                onDelete={(id) => deleteLinkMutation.mutate(id)}
                onMoveToFolder={(linkId, folderId) => moveLinkMutation.mutate({ linkId, folderId })}
                publishedUrl={PUBLISHED_URL}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default UTMBuilder;

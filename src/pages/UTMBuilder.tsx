import { useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UTMForm, type UTMFormData } from "@/components/marketing-hub/UTMForm";
import { UTMLinkTable } from "@/components/marketing-hub/UTMLinkTable";
import { UTMFolderList } from "@/components/marketing-hub/UTMFolderList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const PUBLISHED_URL = "https://launch-wingman-ai.lovable.app";

const generateShortCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const UTMBuilder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["utm-folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_folders")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch links
  const { data: links = [] } = useQuery({
    queryKey: ["utm-links", user?.id, selectedFolderId],
    queryFn: async () => {
      let query = supabase
        .from("utm_links")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (selectedFolderId) {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Save link mutation
  const saveLinkMutation = useMutation({
    mutationFn: async ({ formData, fullUrl }: { formData: UTMFormData; fullUrl: string }) => {
      const shortCode = generateShortCode();
      const { error } = await supabase.from("utm_links").insert({
        user_id: user!.id,
        folder_id: formData.folderId || null,
        base_url: formData.baseUrl,
        utm_source: formData.utmSource,
        utm_medium: formData.utmMedium,
        utm_campaign: formData.utmCampaign,
        utm_term: formData.utmTerm || null,
        utm_content: formData.utmContent || null,
        full_url: fullUrl,
        short_code: shortCode,
        label: formData.label,
      });
      if (error) {
        // Retry once with a new code if unique constraint violated
        if (error.code === "23505") {
          const retryCode = generateShortCode();
          const { error: retryError } = await supabase.from("utm_links").insert({
            user_id: user!.id,
            folder_id: formData.folderId || null,
            base_url: formData.baseUrl,
            utm_source: formData.utmSource,
            utm_medium: formData.utmMedium,
            utm_campaign: formData.utmCampaign,
            utm_term: formData.utmTerm || null,
            utm_content: formData.utmContent || null,
            full_url: fullUrl,
            short_code: retryCode,
            label: formData.label,
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
      queryClient.invalidateQueries({ queryKey: ["utm-stats"] });
      toast({ title: "Link saved!", description: "Your UTM link has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save link.", variant: "destructive" });
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

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UTM Campaign Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create UTM-tagged links, organize them into folders, and track clicks.
          </p>
        </div>

        {/* Builder form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Link</CardTitle>
          </CardHeader>
          <CardContent>
            <UTMForm
              folders={folders}
              onSave={(formData, fullUrl) => saveLinkMutation.mutate({ formData, fullUrl })}
              saving={saveLinkMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Links section with folder sidebar */}
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
                {selectedFolderId
                  ? folders.find((f) => f.id === selectedFolderId)?.name || "Folder"
                  : "All Saved Links"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UTMLinkTable
                links={links}
                onDelete={(id) => deleteLinkMutation.mutate(id)}
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

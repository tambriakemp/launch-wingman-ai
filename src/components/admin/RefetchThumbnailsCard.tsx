import { useState } from "react";
import { RefreshCw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export const RefetchThumbnailsCard = () => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ total: number; updated: number; failed: number } | null>(null);

  const handleRefetchAll = async () => {
    setIsRefetching(true);
    setProgress(0);
    setStats(null);

    try {
      // Get all resources with preview_url (Canva links)
      const { data: resources, error: fetchError } = await supabase
        .from('content_vault_resources')
        .select('id, preview_url, resource_url, cover_image_url')
        .or('preview_url.neq.null,resource_url.ilike.%canva.com%');

      if (fetchError) throw fetchError;

      if (!resources || resources.length === 0) {
        toast.info("No Canva resources found to refetch");
        setIsRefetching(false);
        return;
      }

      // Filter to only resources with Canva links
      const canvaResources = resources.filter(r => 
        r.preview_url?.includes('canva.com') || 
        r.resource_url?.includes('canva.com')
      );

      if (canvaResources.length === 0) {
        toast.info("No Canva resources found to refetch");
        setIsRefetching(false);
        return;
      }

      let updated = 0;
      let failed = 0;

      for (let i = 0; i < canvaResources.length; i++) {
        const resource = canvaResources[i];
        const urlToFetch = resource.preview_url || resource.resource_url;

        try {
          // Call the extract-canva-thumbnail edge function
          const { data, error } = await supabase.functions.invoke('extract-canva-thumbnail', {
            body: { url: urlToFetch }
          });

          if (error) throw error;

          if (data?.thumbnailUrl) {
            // Update the resource with the new thumbnail
            const { error: updateError } = await supabase
              .from('content_vault_resources')
              .update({ cover_image_url: data.thumbnailUrl })
              .eq('id', resource.id);

            if (updateError) throw updateError;
            updated++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Failed to fetch thumbnail for resource ${resource.id}:`, err);
          failed++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / canvaResources.length) * 100));

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setStats({ total: canvaResources.length, updated, failed });
      
      if (updated > 0) {
        toast.success(`Updated ${updated} thumbnail${updated !== 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.warning(`Failed to update ${failed} thumbnail${failed !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error("Refetch failed:", error);
      toast.error("Failed to refetch thumbnails");
    } finally {
      setIsRefetching(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Refetch Thumbnails</CardTitle>
            <CardDescription>
              Update all Canva thumbnails with latest designs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will re-fetch thumbnails from Canva for all resources that have a Canva preview URL. 
          Use this when designs have been updated and you want the latest preview images.
        </p>

        {isRefetching && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
          </div>
        )}

        {stats && !isRefetching && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p>Processed: <strong>{stats.total}</strong> resources</p>
            <p className="text-green-600 dark:text-green-400">Updated: <strong>{stats.updated}</strong></p>
            {stats.failed > 0 && (
              <p className="text-amber-600 dark:text-amber-400">Failed: <strong>{stats.failed}</strong></p>
            )}
          </div>
        )}

        <Button 
          onClick={handleRefetchAll} 
          disabled={isRefetching}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Refetching...' : 'Refetch All Thumbnails'}
        </Button>
      </CardContent>
    </Card>
  );
};

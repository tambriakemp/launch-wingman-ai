import { useState } from "react";
import { RefreshCw, Image as ImageIcon, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FailedResource {
  id: string;
  title: string;
  url: string;
  reason: string;
}

export const RefetchThumbnailsCard = () => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ total: number; updated: number; failed: number } | null>(null);
  const [failedResources, setFailedResources] = useState<FailedResource[]>([]);
  const [showFailed, setShowFailed] = useState(false);

  const handleRefetchAll = async () => {
    setIsRefetching(true);
    setProgress(0);
    setStats(null);
    setFailedResources([]);

    try {
      // Get all resources with preview_url (Canva links)
      const { data: resources, error: fetchError } = await supabase
        .from('content_vault_resources')
        .select('id, title, preview_url, resource_url, cover_image_url')
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
      const failures: FailedResource[] = [];

      for (let i = 0; i < canvaResources.length; i++) {
        const resource = canvaResources[i];
        const urlToFetch = resource.preview_url || resource.resource_url;

        try {
          // Call the extract-canva-thumbnail edge function
          const { data, error } = await supabase.functions.invoke('extract-canva-thumbnail', {
            body: { url: urlToFetch }
          });

          if (error) {
            throw new Error(error.message || 'Edge function error');
          }

          if (data?.thumbnailUrl) {
            // Update the resource with the new thumbnail
            const { error: updateError } = await supabase
              .from('content_vault_resources')
              .update({ cover_image_url: data.thumbnailUrl })
              .eq('id', resource.id);

            if (updateError) {
              throw new Error(`Database update failed: ${updateError.message}`);
            }
            updated++;
          } else {
            const reason = data?.error || 'No thumbnail found in page';
            failures.push({
              id: resource.id,
              title: resource.title,
              url: urlToFetch || 'No URL',
              reason,
            });
            failed++;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Failed to fetch thumbnail for resource ${resource.id}:`, err);
          failures.push({
            id: resource.id,
            title: resource.title,
            url: urlToFetch || 'No URL',
            reason: errorMessage,
          });
          failed++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / canvaResources.length) * 100));

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setStats({ total: canvaResources.length, updated, failed });
      setFailedResources(failures);
      
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
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <p>Processed: <strong>{stats.total}</strong> resources</p>
            <p className="text-green-600 dark:text-green-400">Updated: <strong>{stats.updated}</strong></p>
            {stats.failed > 0 && (
              <p className="text-amber-600 dark:text-amber-400">Failed: <strong>{stats.failed}</strong></p>
            )}
          </div>
        )}

        {failedResources.length > 0 && !isRefetching && (
          <Collapsible open={showFailed} onOpenChange={setShowFailed}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-amber-600 dark:text-amber-400 hover:text-amber-700">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  View {failedResources.length} failed resource{failedResources.length !== 1 ? 's' : ''}
                </span>
                {showFailed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-48 mt-2 rounded-md border">
                <div className="p-2 space-y-2">
                  {failedResources.map((resource) => (
                    <div key={resource.id} className="p-2 bg-muted/30 rounded text-xs space-y-1">
                      <p className="font-medium truncate">{resource.title}</p>
                      <p className="text-muted-foreground truncate">{resource.url}</p>
                      <p className="text-destructive">{resource.reason}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
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
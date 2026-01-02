import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, CheckCircle, AlertCircle, FileImage, FileVideo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  added: number;
  skipped: number;
  errors: string[];
  files: { path: string; action: string }[];
}

export const R2SyncCard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke('sync-r2-vault', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as SyncResult;
      setLastResult(result);

      if (result.added > 0) {
        toast.success(`Synced ${result.added} new files from R2`);
      } else if (result.skipped > 0) {
        toast.info(`All ${result.skipped} files already exist in vault`);
      } else {
        toast.info("No media files found in R2 bucket");
      }

      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errors occurred during sync`);
      }
    } catch (error: any) {
      console.error("R2 sync error:", error);
      toast.error(error.message || "Failed to sync from R2");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Cloud className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Cloudflare R2 Sync</CardTitle>
            <CardDescription>
              Import photos and videos from your R2 bucket
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Images (.jpg, .png, .gif, .webp) → Photos category
          </p>
          <p className="flex items-center gap-2">
            <FileVideo className="w-4 h-4" />
            Videos (.mp4, .mov, .webm) → Videos category
          </p>
          <p className="text-xs mt-2">
            Files are organized by folder structure. Folder names become subcategories.
          </p>
        </div>

        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync from R2
            </>
          )}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Sync Results</h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{lastResult.added} added</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{lastResult.skipped} skipped (duplicates)</span>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{lastResult.errors.length} errors</span>
                </div>
                <ul className="text-xs text-muted-foreground max-h-24 overflow-y-auto space-y-1">
                  {lastResult.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx} className="truncate">• {error}</li>
                  ))}
                  {lastResult.errors.length > 5 && (
                    <li className="text-muted-foreground">
                      ...and {lastResult.errors.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {lastResult.files.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View file details ({lastResult.files.length} files)
                </summary>
                <ul className="mt-2 max-h-32 overflow-y-auto space-y-1 text-muted-foreground">
                  {lastResult.files.map((file, idx) => (
                    <li key={idx} className="truncate">
                      <span className={file.action === 'added' ? 'text-green-500' : ''}>
                        [{file.action}]
                      </span>{' '}
                      {file.path}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

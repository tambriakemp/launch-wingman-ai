import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, CheckCircle, AlertCircle, FileImage, FileVideo, Image, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { extractVideoThumbnail, generateThumbnailFilename } from "@/lib/videoThumbnail";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SyncResult {
  added: number;
  skipped: number;
  removed: number;
  errors: string[];
  files: { path: string; action: string }[];
}

interface ThumbnailProgress {
  current: number;
  total: number;
  generated: number;
  failed: number;
}

type FramePosition = 'beginning' | 'middle' | 'custom';
type MediaType = 'all' | 'photos' | 'videos';

export const R2SyncCard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState<ThumbnailProgress | null>(null);
  const [framePosition, setFramePosition] = useState<FramePosition>('beginning');
  const [customTimestamp, setCustomTimestamp] = useState<number>(1);
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [cleanupOrphans, setCleanupOrphans] = useState(false);

  const getSeekTime = (videoDuration?: number): number => {
    switch (framePosition) {
      case 'beginning':
        return 0.5; // Half second in
      case 'middle':
        return videoDuration ? videoDuration / 2 : 10; // Middle of video, fallback to 10s
      case 'custom':
        return customTimestamp;
      default:
        return 1;
    }
  };

  const generateVideoThumbnails = async () => {
    setIsGeneratingThumbnails(true);
    setThumbnailProgress({ current: 0, total: 0, generated: 0, failed: 0 });

    try {
      // Find video resources without cover images
      const { data: videos, error } = await supabase
        .from('content_vault_resources')
        .select('id, resource_url, title')
        .like('resource_url', '%.mp4')
        .is('cover_image_url', null);

      if (error) throw error;

      if (!videos || videos.length === 0) {
        toast.info("No videos need thumbnails");
        setIsGeneratingThumbnails(false);
        setThumbnailProgress(null);
        return;
      }

      setThumbnailProgress({ current: 0, total: videos.length, generated: 0, failed: 0 });

      let generated = 0;
      let failed = 0;

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        setThumbnailProgress(prev => prev ? { ...prev, current: i + 1 } : null);

        try {
          // Extract thumbnail from video with selected frame position
          const seekTime = framePosition === 'middle' ? 'middle' : getSeekTime();
          const { blob: thumbnailBlob } = await extractVideoThumbnail(video.resource_url, seekTime);
          
          // Upload to storage
          const filename = generateThumbnailFilename(video.resource_url);
          const { error: uploadError } = await supabase.storage
            .from('content-media')
            .upload(filename, thumbnailBlob, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('content-media')
            .getPublicUrl(filename);

          // Update resource with thumbnail URL
          const { error: updateError } = await supabase
            .from('content_vault_resources')
            .update({ cover_image_url: urlData.publicUrl })
            .eq('id', video.id);

          if (updateError) throw updateError;

          generated++;
          setThumbnailProgress(prev => prev ? { ...prev, generated } : null);
        } catch (err) {
          console.error(`Failed to generate thumbnail for ${video.title}:`, err);
          failed++;
          setThumbnailProgress(prev => prev ? { ...prev, failed } : null);
        }
      }

      if (generated > 0) {
        toast.success(`Generated ${generated} video thumbnail${generated > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.warning(`Failed to generate ${failed} thumbnail${failed > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast.error(error.message || "Failed to generate thumbnails");
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setLastResult(null);
    setThumbnailProgress(null);

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
        body: {
          mediaType,
          cleanupOrphans,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as SyncResult;
      setLastResult(result);

      // Build toast message
      const messages: string[] = [];
      if (result.added > 0) messages.push(`${result.added} added`);
      if (result.removed > 0) messages.push(`${result.removed} removed`);
      
      if (messages.length > 0) {
        toast.success(`Synced: ${messages.join(', ')}`);
      } else if (result.skipped > 0) {
        toast.info(`All ${result.skipped} files already in sync`);
      } else {
        toast.info("No media files found in R2 bucket");
      }

      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errors occurred during sync`);
      }

      // Check if any videos were added and auto-generate thumbnails
      const addedVideos = result.files.filter(f => f.action === 'added' && f.path.endsWith('.mp4'));
      if (addedVideos.length > 0 && mediaType !== 'photos') {
        setIsSyncing(false);
        await generateVideoThumbnails();
      }
    } catch (error: any) {
      console.error("R2 sync error:", error);
      toast.error(error.message || "Failed to sync from R2");
    } finally {
      setIsSyncing(false);
    }
  };

  const isProcessing = isSyncing || isGeneratingThumbnails;

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

        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Media Type</Label>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as MediaType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    All Media
                  </span>
                </SelectItem>
                <SelectItem value="photos">
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" /> Photos Only
                  </span>
                </SelectItem>
                <SelectItem value="videos">
                  <span className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4" /> Videos Only
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Remove deleted items
              </Label>
              <p className="text-xs text-muted-foreground">
                Remove vault items that no longer exist in R2
              </p>
            </div>
            <Switch
              checked={cleanupOrphans}
              onCheckedChange={setCleanupOrphans}
            />
          </div>
        </div>

        {mediaType !== 'photos' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Thumbnail Frame Position</Label>
            <div className="flex gap-2">
              <Select value={framePosition} onValueChange={(v) => setFramePosition(v as FramePosition)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginning">Beginning</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {framePosition === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={customTimestamp}
                    onChange={(e) => setCustomTimestamp(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">seconds</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={isProcessing}
            className="flex-1"
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
          {mediaType !== 'photos' && (
            <Button 
              onClick={generateVideoThumbnails} 
              disabled={isProcessing}
              variant="outline"
            >
              {isGeneratingThumbnails ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Gen Thumbnails
                </>
              )}
            </Button>
          )}
        </div>

        {isGeneratingThumbnails && thumbnailProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Generating thumbnails...</span>
              <span>{thumbnailProgress.current}/{thumbnailProgress.total}</span>
            </div>
            <Progress value={(thumbnailProgress.current / thumbnailProgress.total) * 100} />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="text-green-500">✓ {thumbnailProgress.generated} generated</span>
              {thumbnailProgress.failed > 0 && (
                <span className="text-red-500">✗ {thumbnailProgress.failed} failed</span>
              )}
            </div>
          </div>
        )}

        {lastResult && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Sync Results</h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{lastResult.added} added</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{lastResult.skipped} skipped</span>
              </div>
              {lastResult.removed > 0 && (
                <div className="flex items-center gap-2 text-orange-500">
                  <Trash2 className="w-4 h-4" />
                  <span>{lastResult.removed} removed</span>
                </div>
              )}
            </div>

            {thumbnailProgress && !isGeneratingThumbnails && (
              <div className="flex items-center gap-2 text-sm">
                <Image className="w-4 h-4 text-blue-500" />
                <span>{thumbnailProgress.generated} thumbnails generated</span>
                {thumbnailProgress.failed > 0 && (
                  <span className="text-red-500">({thumbnailProgress.failed} failed)</span>
                )}
              </div>
            )}

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
                      <span className={
                        file.action === 'added' 
                          ? 'text-green-500' 
                          : file.action.includes('removed') 
                            ? 'text-orange-500' 
                            : ''
                      }>
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

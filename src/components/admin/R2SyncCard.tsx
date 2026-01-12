import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, CheckCircle, AlertCircle, FileImage, FileVideo, Image, Trash2, Sparkles, Pause, Play, Info, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { extractVideoThumbnail, generateThumbnailFilename, testVideoCORS } from "@/lib/videoThumbnail";
import { extractThumbnailViaWorker, supportsWebCodecs, terminateWorker } from "@/lib/videoThumbnailWorker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  currentVideoTitle?: string;
  startTime?: number;
}

interface RenameResult {
  renamed: number;
  skipped: number;
  failed: number;
  previews: { id: string; oldTitle: string; newTitle: string }[];
  errors: string[];
}

interface SavedProgress {
  processedIds: string[];
  timestamp: number;
  framePosition: FramePosition;
  customTimestamp: number;
}

type FramePosition = 'beginning' | 'middle' | 'custom';
type MediaType = 'all' | 'photos' | 'videos';

const STORAGE_KEY = 'r2-thumbnail-progress';

export const R2SyncCard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [renameResult, setRenameResult] = useState<RenameResult | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState<ThumbnailProgress | null>(null);
  const [framePosition, setFramePosition] = useState<FramePosition>('beginning');
  const [customTimestamp, setCustomTimestamp] = useState<number>(1);
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [cleanupOrphans, setCleanupOrphans] = useState(false);
  const [corsError, setCorsError] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(true);
  
  // New state for pause/resume functionality
  const [isPaused, setIsPaused] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [showKeepActiveWarning, setShowKeepActiveWarning] = useState(true);
  const [useWebCodecs, setUseWebCodecs] = useState(supportsWebCodecs());
  
  // Refs for async loop control
  const isPausedRef = useRef(false);
  const shouldStopRef = useRef(false);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedProgress;
        // Only show resume option if less than 24 hours old
        const hoursSinceSaved = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        if (hoursSinceSaved < 24 && parsed.processedIds.length > 0) {
          setSavedProgress(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Visibility change detection - only for Canvas API fallback
  useEffect(() => {
    // WebCodecs runs in a Web Worker and is resistant to tab throttling
    if (useWebCodecs) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isGeneratingThumbnails && !isPaused) {
        isPausedRef.current = true;
        setIsPaused(true);
        toast.warning("Thumbnail generation paused - tab is in background");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isGeneratingThumbnails, isPaused, useWebCodecs]);

  const getSeekTime = (videoDuration?: number): number => {
    switch (framePosition) {
      case 'beginning':
        return 0.5;
      case 'middle':
        return videoDuration ? videoDuration / 2 : 10;
      case 'custom':
        return customTimestamp;
      default:
        return 1;
    }
  };

  const saveProgress = useCallback((processedIds: string[]) => {
    const progress: SavedProgress = {
      processedIds,
      timestamp: Date.now(),
      framePosition,
      customTimestamp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [framePosition, customTimestamp]);

  const clearSavedProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedProgress(null);
    processedIdsRef.current.clear();
  }, []);

  const resumeGeneration = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
    toast.success("Resuming thumbnail generation...");
  }, []);

  const stopGeneration = useCallback(() => {
    shouldStopRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsGeneratingThumbnails(false);
    toast.info("Thumbnail generation stopped");
  }, []);

  const generateVideoThumbnails = async (resumeFromSaved = false) => {
    setIsGeneratingThumbnails(true);
    setIsPaused(false);
    isPausedRef.current = false;
    shouldStopRef.current = false;
    setCorsError(null);

    // Load processed IDs if resuming
    if (resumeFromSaved && savedProgress) {
      processedIdsRef.current = new Set(savedProgress.processedIds);
      setFramePosition(savedProgress.framePosition);
      setCustomTimestamp(savedProgress.customTimestamp);
    } else {
      processedIdsRef.current.clear();
    }

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
        clearSavedProgress();
        return;
      }

      // Filter out already processed videos if resuming
      const videosToProcess = resumeFromSaved 
        ? videos.filter(v => !processedIdsRef.current.has(v.id))
        : videos;

      if (videosToProcess.length === 0) {
        toast.success("All videos already processed!");
        setIsGeneratingThumbnails(false);
        clearSavedProgress();
        return;
      }

      // Pre-flight CORS check on first video
      toast.info("Checking CORS configuration...");
      const corsTest = await testVideoCORS(videosToProcess[0].resource_url);
      
      if (!corsTest.success) {
        setCorsError(corsTest.error || 'CORS not configured');
        toast.error("CORS not configured on R2 bucket");
        setIsGeneratingThumbnails(false);
        setThumbnailProgress(null);
        return;
      }

      const alreadyProcessed = resumeFromSaved ? processedIdsRef.current.size : 0;
      setThumbnailProgress({ 
        current: alreadyProcessed, 
        total: videos.length, 
        generated: alreadyProcessed, 
        failed: 0,
        startTime: Date.now()
      });

      let generated = alreadyProcessed;
      let failed = 0;

      for (let i = 0; i < videosToProcess.length; i++) {
        // Check if we should stop
        if (shouldStopRef.current) {
          break;
        }

        // Wait while paused (only for Canvas API fallback)
        if (!useWebCodecs) {
          while (isPausedRef.current && !shouldStopRef.current) {
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (shouldStopRef.current) {
          break;
        }

        const video = videosToProcess[i];
        setThumbnailProgress(prev => prev ? { 
          ...prev, 
          current: alreadyProcessed + i + 1,
          currentVideoTitle: video.title
        } : null);

        try {
          // Extract thumbnail from video with selected frame position
          const seekTime = framePosition === 'middle' ? 'middle' : getSeekTime();
          
          let thumbnailBlob: Blob;
          
          // Use WebCodecs if available (runs in background), fallback to Canvas API
          if (useWebCodecs) {
            try {
              const result = await extractThumbnailViaWorker(video.resource_url, seekTime);
              thumbnailBlob = result.blob;
            } catch (workerError) {
              // If WebCodecs fails, fall back to Canvas API
              console.warn('WebCodecs failed, falling back to Canvas API:', workerError);
              const { blob } = await extractVideoThumbnail(video.resource_url, seekTime);
              thumbnailBlob = blob;
            }
          } else {
            const { blob } = await extractVideoThumbnail(video.resource_url, seekTime);
            thumbnailBlob = blob;
          }
          
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
          processedIdsRef.current.add(video.id);
          saveProgress(Array.from(processedIdsRef.current));
          setThumbnailProgress(prev => prev ? { ...prev, generated } : null);
        } catch (err) {
          console.error(`Failed to generate thumbnail for ${video.title}:`, err);
          failed++;
          setThumbnailProgress(prev => prev ? { ...prev, failed } : null);
        }

        // Small delay between videos to prevent browser throttling
        if (i < videosToProcess.length - 1 && !shouldStopRef.current) {
          await new Promise(r => setTimeout(r, 150));
        }
      }

      // Clear saved progress on completion
      clearSavedProgress();

      if (generated > alreadyProcessed) {
        toast.success(`Generated ${generated - alreadyProcessed} video thumbnail${generated - alreadyProcessed > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.warning(`Failed to generate ${failed} thumbnail${failed > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast.error(error.message || "Failed to generate thumbnails");
    } finally {
      setIsGeneratingThumbnails(false);
      setIsPaused(false);
      isPausedRef.current = false;
      shouldStopRef.current = false;
      // Clean up WebCodecs worker
      terminateWorker();
    }
  };

  const handleAIRename = async () => {
    setIsRenaming(true);
    setRenameResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      // Accumulate results across all batches
      const cumulativeResult: RenameResult = {
        renamed: 0,
        skipped: 0,
        failed: 0,
        previews: [],
        errors: [],
      };

      let hasMore = true;
      const batchSize = 20;
      let offset = 0;
      let iterations = 0;
      const maxIterations = 500; // Safety guard

      while (hasMore && iterations < maxIterations) {
        iterations++;
        
        const response = await supabase.functions.invoke('rename-vault-videos', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            previewOnly,
            batchSize,
            offset,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const result = response.data as RenameResult & { scanned: number; nextOffset: number };
        
        // Accumulate results
        cumulativeResult.renamed += result.renamed;
        cumulativeResult.skipped += result.skipped;
        cumulativeResult.failed += result.failed;
        cumulativeResult.previews.push(...result.previews);
        cumulativeResult.errors.push(...result.errors);

        // Update UI with progress
        setRenameResult({ ...cumulativeResult });

        // Move to next page
        offset = result.nextOffset;

        // Stop when no more rows to scan
        if (result.scanned === 0 || result.scanned < batchSize) {
          hasMore = false;
        }

        // Small delay between batches to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (iterations >= maxIterations) {
        toast.warning("Safety limit reached - stopped after 500 batches");
      }

      // Final toast
      if (previewOnly) {
        toast.info(`Preview: ${cumulativeResult.previews.length} videos would be renamed`);
      } else {
        if (cumulativeResult.renamed > 0) {
          toast.success(`Renamed ${cumulativeResult.renamed} videos with AI`);
        }
        if (cumulativeResult.failed > 0) {
          toast.warning(`${cumulativeResult.failed} videos failed to rename`);
        }
      }
    } catch (error: any) {
      console.error("AI rename error:", error);
      toast.error(error.message || "Failed to rename videos");
    } finally {
      setIsRenaming(false);
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

  const isProcessing = isSyncing || isGeneratingThumbnails || isRenaming;

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!thumbnailProgress || !thumbnailProgress.startTime || thumbnailProgress.current === 0) {
      return null;
    }
    const elapsed = Date.now() - thumbnailProgress.startTime;
    const avgTimePerVideo = elapsed / thumbnailProgress.generated;
    const remaining = thumbnailProgress.total - thumbnailProgress.current;
    const estimatedMs = remaining * avgTimePerVideo;
    const minutes = Math.floor(estimatedMs / 60000);
    const seconds = Math.floor((estimatedMs % 60000) / 1000);
    return minutes > 0 ? `~${minutes}m ${seconds}s remaining` : `~${seconds}s remaining`;
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

        {/* Resume Previous Session Banner */}
        {savedProgress && !isGeneratingThumbnails && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Resume Previous Session</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">
                You have {savedProgress.processedIds.length} videos already processed from a previous session.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateVideoThumbnails(true)}
                  disabled={isProcessing}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSavedProgress}
                >
                  Start Fresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* WebCodecs indicator / Keep Tab Active Warning */}
        {mediaType !== 'photos' && !isGeneratingThumbnails && (
          useWebCodecs ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <Zap className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-600 dark:text-green-400">Background Processing Enabled</AlertTitle>
              <AlertDescription className="text-sm">
                Using WebCodecs API - thumbnails will generate even if you switch tabs.
              </AlertDescription>
            </Alert>
          ) : showKeepActiveWarning ? (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Info className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Keep Tab Active</AlertTitle>
              <AlertDescription className="text-sm">
                Video thumbnail generation requires this browser tab to stay active. 
                If you switch tabs, processing will pause automatically and resume when you return.
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto ml-2 text-muted-foreground"
                  onClick={() => setShowKeepActiveWarning(false)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          ) : null
        )}

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
              onClick={() => generateVideoThumbnails(false)} 
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

        {corsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CORS Configuration Required</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{corsError}</p>
              <p className="text-xs">
                To fix this, add a CORS policy in your Cloudflare R2 bucket settings:
              </p>
              <pre className="text-xs bg-background/50 p-2 rounded mt-2 overflow-x-auto">
{`[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 86400
}]`}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        {/* Paused Warning Banner - only for Canvas API fallback */}
        {isPaused && isGeneratingThumbnails && !useWebCodecs && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Pause className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">Generation Paused</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">
                Thumbnail generation is paused because the tab was in the background.
                Progress has been saved ({thumbnailProgress?.generated || 0} of {thumbnailProgress?.total || 0} completed).
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={resumeGeneration}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={stopGeneration}
                >
                  Stop
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isGeneratingThumbnails && thumbnailProgress && !isPaused && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="truncate max-w-[200px]">
                {thumbnailProgress.currentVideoTitle 
                  ? `Processing: ${thumbnailProgress.currentVideoTitle}` 
                  : 'Generating thumbnails...'}
              </span>
              <span>{thumbnailProgress.current}/{thumbnailProgress.total}</span>
            </div>
            <Progress value={(thumbnailProgress.current / thumbnailProgress.total) * 100} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span className="text-green-500">✓ {thumbnailProgress.generated} generated</span>
                {thumbnailProgress.failed > 0 && (
                  <span className="text-red-500">✗ {thumbnailProgress.failed} failed</span>
                )}
              </div>
              <span>{getEstimatedTimeRemaining()}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={stopGeneration}
              className="w-full text-muted-foreground"
            >
              Stop Generation
            </Button>
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

        {/* AI Rename Section */}
        {mediaType !== 'photos' && (
          <div className="mt-4 p-4 border border-dashed border-primary/30 rounded-lg space-y-3 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm">AI Video Renaming</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Use AI to generate descriptive titles for videos based on their thumbnails.
            </p>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Preview only</Label>
                <p className="text-xs text-muted-foreground">
                  See suggested names before applying
                </p>
              </div>
              <Switch
                checked={previewOnly}
                onCheckedChange={setPreviewOnly}
              />
            </div>

            <Button
              onClick={handleAIRename}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {isRenaming ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {previewOnly ? 'Generating previews...' : 'Renaming...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {previewOnly ? 'Preview AI Rename' : 'Rename Videos with AI'}
                </>
              )}
            </Button>

            {renameResult && (
              <div className="space-y-2 p-3 bg-background rounded-lg">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-500">
                    ✓ {renameResult.renamed} {previewOnly ? 'would be renamed' : 'renamed'}
                  </span>
                  <span className="text-muted-foreground">
                    ⏭ {renameResult.skipped} skipped
                  </span>
                  {renameResult.failed > 0 && (
                    <span className="text-red-500">
                      ✗ {renameResult.failed} failed
                    </span>
                  )}
                </div>

                {renameResult.previews.length > 0 && (
                  <details open className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {previewOnly ? 'Preview changes' : 'Changed titles'} ({renameResult.previews.length})
                    </summary>
                    <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {renameResult.previews.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-muted-foreground truncate max-w-[120px]">{p.oldTitle}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-medium truncate">{p.newTitle}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {renameResult.errors.length > 0 && (
                  <div className="text-xs text-red-500">
                    {renameResult.errors.slice(0, 3).map((err, idx) => (
                      <p key={idx} className="truncate">• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

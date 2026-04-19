import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, CheckCircle, AlertCircle, FileImage, FileVideo, Image, Trash2, Sparkles, Pause, Play, Info, Zap, Upload, Loader2, CheckCircle2, XCircle, X, RotateCcw, ChevronDown, FileArchive, Smartphone, Monitor, FileText } from "lucide-react";
import { DocumentUploadSection } from "./DocumentUploadSection";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// ========================
// Types & Interfaces
// ========================

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

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  suggestedCategory: string | null;
  confidence: number;
  status: "pending" | "analyzing" | "ready" | "uploading" | "done" | "error";
  overrideCategory?: string;
  finalUrl?: string;
  error?: string;
}

type PresetType = 'mobile' | 'desktop';

interface PendingPreset {
  id: string;
  file: File;
  detectedType: PresetType;
  overrideType?: PresetType;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  resultUrl?: string;
}

interface UploadSavedProgress {
  sessionId: string;
  completedIds: string[];
  failedIds: string[];
  categoryOverrides: Record<string, string>;
  timestamp: number;
}

type FramePosition = 'beginning' | 'middle' | 'custom';
type MediaType = 'all' | 'photos' | 'videos';

// ========================
// Constants
// ========================

const STORAGE_KEY = 'r2-thumbnail-progress';
const UPLOAD_STORAGE_KEY = "bulk-photo-upload-progress";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 10;
const CONCURRENT_BATCHES = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const SUBCATEGORIES = [
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "flat-lays", name: "Flat Lays" },
  { slug: "workspace", name: "Workspace" },
  { slug: "nature", name: "Nature" },
  { slug: "mockups", name: "Mockups" },
  { slug: "dark-aesthetic", name: "Dark Aesthetic" },
];

// Preset upload constants
const PRESET_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for presets
const PRESET_ACCEPTED_EXTENSIONS = ['.zip', '.dng', '.xmp', '.lrtemplate'];

function detectPresetType(filename: string): PresetType {
  const lowerName = filename.toLowerCase();
  const mobileKeywords = ['mobile', 'dng', 'iphone', 'ios', 'phone', 'android'];
  if (mobileKeywords.some(kw => lowerName.includes(kw))) return 'mobile';
  const desktopKeywords = ['desktop', 'xmp', 'lightroom classic', 'lr classic', 'lrtemplate'];
  if (desktopKeywords.some(kw => lowerName.includes(kw))) return 'desktop';
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'dng') return 'mobile';
  if (ext === 'xmp' || ext === 'lrtemplate') return 'desktop';
  return 'desktop';
}

function isValidPresetFile(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return PRESET_ACCEPTED_EXTENSIONS.includes(ext);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================
// Helper Functions
// ========================

async function compressImage(file: File, maxSize: number = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);
        
        while (result.length > maxSize * 1.37 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        
        resolve(result.split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================
// Main Component
// ========================

export function R2ManagementCard() {
  // Section open states
  const [syncOpen, setSyncOpen] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [presetUploadOpen, setPresetUploadOpen] = useState(false);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  // ========================
  // Sync from R2 State
  // ========================
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [cleanupOrphans, setCleanupOrphans] = useState(false);

  // ========================
  // Upload to R2 State
  // ========================
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadPaused, setIsUploadPaused] = useState(false);
  const [overrideAll, setOverrideAll] = useState<string>("");
  const [uploadSavedProgress, setUploadSavedProgress] = useState<UploadSavedProgress | null>(null);
  const isUploadPausedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ========================
  // Video Thumbnails State
  // ========================
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState<ThumbnailProgress | null>(null);
  const [framePosition, setFramePosition] = useState<FramePosition>('beginning');
  const [customTimestamp, setCustomTimestamp] = useState<number>(1);
  const [corsError, setCorsError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [showKeepActiveWarning, setShowKeepActiveWarning] = useState(true);
  const [useWebCodecs] = useState(supportsWebCodecs());
  const isPausedRef = useRef(false);
  const shouldStopRef = useRef(false);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // ========================
  // AI Video Renaming State
  // ========================
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameResult, setRenameResult] = useState<RenameResult | null>(null);
  const [previewOnly, setPreviewOnly] = useState(true);

  // ========================
  // AI Photo Renaming State
  // ========================
  const [isRenamingPhotos, setIsRenamingPhotos] = useState(false);
  const [photoRenameResult, setPhotoRenameResult] = useState<RenameResult | null>(null);
  const [photoPreviewOnly, setPhotoPreviewOnly] = useState(true);
  const [photoRenameOpen, setPhotoRenameOpen] = useState(false);

  // ========================
  // Preset Upload State
  // ========================
  const [presets, setPresets] = useState<PendingPreset[]>([]);
  const [isUploadingPresets, setIsUploadingPresets] = useState(false);
  const [isPresetDragging, setIsPresetDragging] = useState(false);
  const presetInputRef = useRef<HTMLInputElement>(null);
  const shouldStopPresetsRef = useRef(false);

  // ========================
  // Stop Controls State
  // ========================
  const shouldStopUploadRef = useRef(false);
  const [isUploadStopped, setIsUploadStopped] = useState(false);
  const [isPresetStopped, setIsPresetStopped] = useState(false);

  // ========================
  // Bulk ZIP Upload State
  // ========================
  const [zipUploadOpen, setZipUploadOpen] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipDefaultSubcategory, setZipDefaultSubcategory] = useState<string>("");
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipResult, setZipResult] = useState<{
    summary: { uploaded: number; skippedDuplicates: number; failed: number; unsupported: number; total: number };
    files: Array<{ name: string; status: string; error?: string; category?: string; subcategory?: string }>;
  } | null>(null);
  const [isZipDragging, setIsZipDragging] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = isSyncing || isGeneratingThumbnails || isRenaming || isUploading || isRenamingPhotos || isUploadingPresets || isUploadingZip;

  // ========================
  // Effects
  // ========================

  // Load saved thumbnail progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedProgress;
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

  // Load saved upload progress
  useEffect(() => {
    const saved = localStorage.getItem(UPLOAD_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UploadSavedProgress;
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setUploadSavedProgress(parsed);
        } else {
          localStorage.removeItem(UPLOAD_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(UPLOAD_STORAGE_KEY);
      }
    }
  }, []);

  // Visibility change for Canvas API fallback
  useEffect(() => {
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

  useEffect(() => {
    isUploadPausedRef.current = isUploadPaused;
  }, [isUploadPaused]);

  // ========================
  // Sync from R2 Handlers
  // ========================

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
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { mediaType, cleanupOrphans },
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data as SyncResult;
      setLastResult(result);

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

      // Auto-generate thumbnails for new videos
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

  // ========================
  // Upload to R2 Handlers
  // ========================

  const uploadStats = {
    total: photos.length,
    pending: photos.filter(p => p.status === "pending").length,
    uploading: photos.filter(p => p.status === "uploading").length,
    done: photos.filter(p => p.status === "done").length,
    error: photos.filter(p => p.status === "error").length,
  };

  const uploadProgress = uploadStats.total > 0 ? ((uploadStats.done + uploadStats.error) / uploadStats.total) * 100 : 0;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (fileArray.length === 0) return;

    const newPhotos: PendingPhoto[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      suggestedCategory: null,
      confidence: 0,
      status: "pending" as const,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`Added ${fileArray.length} photos to queue`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clearAllPhotos = useCallback(() => {
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    localStorage.removeItem(UPLOAD_STORAGE_KEY);
    setUploadSavedProgress(null);
  }, [photos]);

  const updatePhotoCategory = useCallback((id: string, category: string | undefined) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, overrideCategory: category } : p
    ));
  }, []);

  const applyOverrideAll = useCallback(() => {
    if (!overrideAll) return;
    setPhotos(prev => prev.map(p => ({ ...p, overrideCategory: overrideAll })));
    toast.success(`Applied "${overrideAll}" to all photos`);
  }, [overrideAll]);

  const stopUploading = useCallback(() => {
    shouldStopUploadRef.current = true;
    setIsUploadStopped(true);
    toast.info("Stopping upload after current batch...");
  }, []);

  const startUploading = useCallback(async () => {
    if (photos.length === 0) return;

    setIsUploading(true);
    setIsUploadPaused(false);
    setIsUploadStopped(false);
    isUploadPausedRef.current = false;
    shouldStopUploadRef.current = false;

    const sessionId = `session-${Date.now()}`;
    const completedIds: string[] = [];
    const failedIds: string[] = [];
    const categoryOverrides: Record<string, string> = {};

    photos.forEach(p => {
      if (p.overrideCategory) categoryOverrides[p.id] = p.overrideCategory;
    });

    try {
      const pendingPhotos = photos.filter(p => p.status !== "done" && p.status !== "error");
      const batches: PendingPhoto[][] = [];
      
      for (let i = 0; i < pendingPhotos.length; i += BATCH_SIZE) {
        batches.push(pendingPhotos.slice(i, i + BATCH_SIZE));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += CONCURRENT_BATCHES) {
        // Check for stop
        if (shouldStopUploadRef.current) {
          toast.info("Upload stopped by user");
          break;
        }

        while (isUploadPausedRef.current && !shouldStopUploadRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (shouldStopUploadRef.current) break;

        const currentBatches = batches.slice(batchIndex, batchIndex + CONCURRENT_BATCHES);
        
        await Promise.all(currentBatches.map(async (batch) => {
          setPhotos(prev => prev.map(p => 
            batch.some(b => b.id === p.id) ? { ...p, status: "uploading" as const } : p
          ));

          const batchData = await Promise.all(batch.map(async (photo) => {
            const imageBase64 = await compressImage(photo.file);
            return {
              id: photo.id,
              imageBase64,
              filename: photo.file.name,
              subcategory: photo.overrideCategory || undefined
            };
          }));

          const { data, error } = await supabase.functions.invoke("process-photo-batch", {
            body: { photos: batchData }
          });

          if (error) {
            setPhotos(prev => prev.map(p => 
              batch.some(b => b.id === p.id) 
                ? { ...p, status: "error" as const, error: error.message } 
                : p
            ));
            batch.forEach(p => failedIds.push(p.id));
            return;
          }

          const results = data?.results || [];
          setPhotos(prev => prev.map(p => {
            const result = results.find((r: any) => r.id === p.id);
            if (!result) return p;
            
            if (result.success) {
              completedIds.push(p.id);
              return {
                ...p,
                status: "done" as const,
                finalUrl: result.url,
                suggestedCategory: result.subcategory,
                confidence: result.confidence || 0,
                isDuplicate: !!result.duplicate,
              } as PendingPhoto & { isDuplicate?: boolean };
            } else {
              failedIds.push(p.id);
              return { ...p, status: "error" as const, error: result.error };
            }
          }));
        }));

        const progressData: UploadSavedProgress = {
          sessionId, completedIds, failedIds, categoryOverrides, timestamp: Date.now()
        };
        localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(progressData));
      }

      if (!shouldStopUploadRef.current) {
        const dupCount = photos.filter(p => (p as any).isDuplicate).length;
        if (failedIds.length === 0) {
          if (dupCount > 0) {
            toast.success(`Uploaded ${completedIds.length - dupCount} new • ${dupCount} duplicate(s) skipped`);
          } else {
            toast.success(`Successfully uploaded ${completedIds.length} photos!`);
          }
          localStorage.removeItem(UPLOAD_STORAGE_KEY);
        } else {
          toast.warning(`Uploaded ${completedIds.length} photos, ${failedIds.length} failed${dupCount > 0 ? `, ${dupCount} duplicates` : ''}`);
        }
      }
    } catch (err) {
      console.error("Processing error:", err);
      toast.error("An error occurred during processing");
    } finally {
      setIsUploading(false);
      shouldStopUploadRef.current = false;
      setIsUploadStopped(false);
    }
  }, [photos]);

  const retryFailed = useCallback(() => {
    setPhotos(prev => prev.map(p => 
      p.status === "error" ? { ...p, status: "pending" as const, error: undefined } : p
    ));
  }, []);

  // ========================
  // Video Thumbnail Handlers
  // ========================

  const getSeekTime = (videoDuration?: number): number => {
    switch (framePosition) {
      case 'beginning': return 0.5;
      case 'middle': return videoDuration ? videoDuration / 2 : 10;
      case 'custom': return customTimestamp;
      default: return 1;
    }
  };

  const saveProgress = useCallback((processedIds: string[]) => {
    const progress: SavedProgress = {
      processedIds, timestamp: Date.now(), framePosition, customTimestamp,
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

    if (resumeFromSaved && savedProgress) {
      processedIdsRef.current = new Set(savedProgress.processedIds);
      setFramePosition(savedProgress.framePosition);
      setCustomTimestamp(savedProgress.customTimestamp);
    } else {
      processedIdsRef.current.clear();
    }

    try {
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

      const videosToProcess = resumeFromSaved 
        ? videos.filter(v => !processedIdsRef.current.has(v.id))
        : videos;

      if (videosToProcess.length === 0) {
        toast.success("All videos already processed!");
        setIsGeneratingThumbnails(false);
        clearSavedProgress();
        return;
      }

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
        if (shouldStopRef.current) break;

        if (!useWebCodecs) {
          while (isPausedRef.current && !shouldStopRef.current) {
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (shouldStopRef.current) break;

        const video = videosToProcess[i];
        setThumbnailProgress(prev => prev ? { 
          ...prev, 
          current: alreadyProcessed + i + 1,
          currentVideoTitle: video.title
        } : null);

        try {
          const seekTime = framePosition === 'middle' ? 'middle' : getSeekTime();
          
          let thumbnailBlob: Blob;
          
          if (useWebCodecs) {
            try {
              const result = await extractThumbnailViaWorker(video.resource_url, seekTime);
              thumbnailBlob = result.blob;
            } catch (workerError) {
              console.warn('WebCodecs failed, falling back to Canvas API:', workerError);
              const { blob } = await extractVideoThumbnail(video.resource_url, seekTime);
              thumbnailBlob = blob;
            }
          } else {
            const { blob } = await extractVideoThumbnail(video.resource_url, seekTime);
            thumbnailBlob = blob;
          }
          
          const filename = generateThumbnailFilename(video.resource_url);
          const { error: uploadError } = await supabase.storage
            .from('content-media')
            .upload(filename, thumbnailBlob, { contentType: 'image/jpeg', upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('content-media')
            .getPublicUrl(filename);

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

        if (i < videosToProcess.length - 1 && !shouldStopRef.current) {
          await new Promise(r => setTimeout(r, 150));
        }
      }

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
      terminateWorker();
    }
  };

  // ========================
  // AI Rename Handlers
  // ========================

  const handleAIRename = async () => {
    setIsRenaming(true);
    setRenameResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const cumulativeResult: RenameResult = {
        renamed: 0, skipped: 0, failed: 0, previews: [], errors: [],
      };

      let hasMore = true;
      const batchSize = 20;
      let offset = 0;
      let iterations = 0;
      const maxIterations = 500;

      while (hasMore && iterations < maxIterations) {
        iterations++;
        
        const response = await supabase.functions.invoke('rename-vault-videos', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { previewOnly, batchSize, offset, resourceType: 'video' },
        });

        if (response.error) throw new Error(response.error.message);

        const result = response.data as RenameResult & { scanned: number; nextOffset: number };
        
        cumulativeResult.renamed += result.renamed;
        cumulativeResult.skipped += result.skipped;
        cumulativeResult.failed += result.failed;
        cumulativeResult.previews.push(...result.previews);
        cumulativeResult.errors.push(...result.errors);

        setRenameResult({ ...cumulativeResult });

        offset = result.nextOffset;

        if (result.scanned === 0 || result.scanned < batchSize) hasMore = false;

        if (hasMore) await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (iterations >= maxIterations) {
        toast.warning("Safety limit reached - stopped after 500 batches");
      }

      if (previewOnly) {
        toast.info(`Preview: ${cumulativeResult.previews.length} videos would be renamed`);
      } else {
        if (cumulativeResult.renamed > 0) toast.success(`Renamed ${cumulativeResult.renamed} videos with AI`);
        if (cumulativeResult.failed > 0) toast.warning(`${cumulativeResult.failed} videos failed to rename`);
      }
    } catch (error: any) {
      console.error("AI rename error:", error);
      toast.error(error.message || "Failed to rename videos");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleAIPhotoRename = async () => {
    setIsRenamingPhotos(true);
    setPhotoRenameResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const cumulativeResult: RenameResult = {
        renamed: 0, skipped: 0, failed: 0, previews: [], errors: [],
      };

      let hasMore = true;
      const batchSize = 20;
      let offset = 0;
      let iterations = 0;
      const maxIterations = 500;

      while (hasMore && iterations < maxIterations) {
        iterations++;
        
        const response = await supabase.functions.invoke('rename-vault-videos', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { previewOnly: photoPreviewOnly, batchSize, offset, resourceType: 'image' },
        });

        if (response.error) throw new Error(response.error.message);

        const result = response.data as RenameResult & { scanned: number; nextOffset: number };
        
        cumulativeResult.renamed += result.renamed;
        cumulativeResult.skipped += result.skipped;
        cumulativeResult.failed += result.failed;
        cumulativeResult.previews.push(...result.previews);
        cumulativeResult.errors.push(...result.errors);

        setPhotoRenameResult({ ...cumulativeResult });

        offset = result.nextOffset;

        if (result.scanned === 0 || result.scanned < batchSize) hasMore = false;

        if (hasMore) await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (iterations >= maxIterations) {
        toast.warning("Safety limit reached - stopped after 500 batches");
      }

      if (photoPreviewOnly) {
        toast.info(`Preview: ${cumulativeResult.previews.length} photos would be renamed`);
      } else {
        if (cumulativeResult.renamed > 0) toast.success(`Renamed ${cumulativeResult.renamed} photos with AI`);
        if (cumulativeResult.failed > 0) toast.warning(`${cumulativeResult.failed} photos failed to rename`);
      }
    } catch (error: any) {
      console.error("AI photo rename error:", error);
      toast.error(error.message || "Failed to rename photos");
    } finally {
      setIsRenamingPhotos(false);
    }
  };

  // ========================
  // Preset Upload Handlers
  // ========================

  const presetStats = {
    total: presets.length,
    pending: presets.filter(p => p.status === 'pending').length,
    uploading: presets.filter(p => p.status === 'uploading').length,
    done: presets.filter(p => p.status === 'done').length,
    error: presets.filter(p => p.status === 'error').length,
  };

  const presetUploadProgress = presetStats.total > 0 
    ? ((presetStats.done + presetStats.error) / presetStats.total) * 100 
    : 0;

  const handlePresetFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => {
      if (!isValidPresetFile(file.name)) {
        toast.error(`${file.name} is not a supported preset file type`);
        return false;
      }
      if (file.size > PRESET_MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (fileArray.length === 0) return;

    const newPresets: PendingPreset[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      detectedType: detectPresetType(file.name),
      status: 'pending' as const,
    }));

    setPresets(prev => [...prev, ...newPresets]);
    toast.success(`Added ${fileArray.length} preset(s) to queue`);
  }, []);

  const handlePresetDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsPresetDragging(false);
    handlePresetFiles(e.dataTransfer.files);
  }, [handlePresetFiles]);

  const removePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearAllPresets = useCallback(() => {
    setPresets([]);
  }, []);

  const updatePresetType = useCallback((id: string, type: PresetType) => {
    setPresets(prev => prev.map(p => 
      p.id === id ? { ...p, overrideType: type } : p
    ));
  }, []);

  const stopPresetUpload = useCallback(() => {
    shouldStopPresetsRef.current = true;
    setIsPresetStopped(true);
    toast.info("Stopping preset upload after current file...");
  }, []);

  const startPresetUpload = useCallback(async () => {
    const pendingPresets = presets.filter(p => p.status === 'pending');
    if (pendingPresets.length === 0) return;

    setIsUploadingPresets(true);
    setIsPresetStopped(false);
    shouldStopPresetsRef.current = false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        setIsUploadingPresets(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const preset of pendingPresets) {
        // Check for stop
        if (shouldStopPresetsRef.current) {
          toast.info("Preset upload stopped by user");
          break;
        }

        setPresets(prev => prev.map(p => 
          p.id === preset.id ? { ...p, status: 'uploading' as const } : p
        ));

        try {
          const fileBase64 = await fileToBase64(preset.file);
          const presetType = preset.overrideType || preset.detectedType;

          const { data, error } = await supabase.functions.invoke('upload-preset-to-r2', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: {
              fileBase64,
              filename: preset.file.name,
              presetType,
            },
          });

          if (error) throw error;

          setPresets(prev => prev.map(p => 
            p.id === preset.id 
              ? { ...p, status: 'done' as const, resultUrl: data.url } 
              : p
          ));
          successCount++;
        } catch (err: any) {
          console.error(`Error uploading ${preset.file.name}:`, err);
          setPresets(prev => prev.map(p => 
            p.id === preset.id 
              ? { ...p, status: 'error' as const, error: err.message || 'Upload failed' } 
              : p
          ));
          failCount++;
        }
      }

      if (!shouldStopPresetsRef.current) {
        if (successCount > 0) {
          toast.success(`Uploaded ${successCount} preset(s) successfully!`);
        }
        if (failCount > 0) {
          toast.warning(`${failCount} preset(s) failed to upload`);
        }
      }
    } catch (error: any) {
      console.error("Preset upload error:", error);
      toast.error(error.message || "Failed to upload presets");
    } finally {
      setIsUploadingPresets(false);
      shouldStopPresetsRef.current = false;
      setIsPresetStopped(false);
    }
  }, [presets]);

  // ========================
  // Helper UI Functions
  // ========================

  const getEstimatedTimeRemaining = () => {
    if (!thumbnailProgress || !thumbnailProgress.startTime || thumbnailProgress.current === 0) return null;
    const elapsed = Date.now() - thumbnailProgress.startTime;
    const avgTimePerVideo = elapsed / thumbnailProgress.generated;
    const remaining = thumbnailProgress.total - thumbnailProgress.current;
    const estimatedMs = remaining * avgTimePerVideo;
    const minutes = Math.floor(estimatedMs / 60000);
    const seconds = Math.floor((estimatedMs % 60000) / 1000);
    return minutes > 0 ? `~${minutes}m ${seconds}s remaining` : `~${seconds}s remaining`;
  };

  // ========================
  // Render
  // ========================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Cloud className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Cloudflare R2 Management</CardTitle>
            <CardDescription>
              Sync, upload, and manage photos & videos with your R2 bucket
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* ======================== */}
        {/* SECTION 1: Sync from R2 */}
        {/* ======================== */}
        <Collapsible open={syncOpen} onOpenChange={setSyncOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Sync from R2</span>
                <span className="text-xs text-muted-foreground">R2 → Content Vault</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${syncOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            <div className="text-sm text-muted-foreground space-y-2 pt-2">
              <p className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                Images (.jpg, .png, .gif, .webp) → Photos category
              </p>
              <p className="flex items-center gap-2">
                <FileVideo className="w-4 h-4" />
                Videos (.mp4, .mov, .webm) → Videos category
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
                    <SelectItem value="all">All Media</SelectItem>
                    <SelectItem value="photos">Photos Only</SelectItem>
                    <SelectItem value="videos">Videos Only</SelectItem>
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
                <Switch checked={cleanupOrphans} onCheckedChange={setCleanupOrphans} />
              </div>
            </div>

            <Button onClick={handleSync} disabled={isProcessing} className="w-full">
              {isSyncing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Syncing...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Sync from R2</>
              )}
            </Button>

            {lastResult && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
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
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 2: Upload to R2 */}
        {/* ======================== */}
        <Collapsible open={uploadOpen} onOpenChange={setUploadOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-500" />
                <span className="font-medium">Upload to R2</span>
                <span className="text-xs text-muted-foreground">App → R2 → Content Vault</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${uploadOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            {uploadSavedProgress && photos.length === 0 && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Previous upload session found ({uploadSavedProgress.completedIds.length} completed)</span>
                  <Button variant="outline" size="sm" onClick={() => {
                    localStorage.removeItem(UPLOAD_STORAGE_KEY);
                    setUploadSavedProgress(null);
                  }}>Dismiss</Button>
                </AlertDescription>
              </Alert>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mt-2
                ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">Drop photos here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF • Max 10MB each</p>
            </div>

            {photos.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <Badge variant="outline">Total: {uploadStats.total}</Badge>
                    {uploadStats.uploading > 0 && <Badge className="bg-blue-500">Uploading: {uploadStats.uploading}</Badge>}
                    {uploadStats.done > 0 && <Badge className="bg-green-500">Done: {uploadStats.done}</Badge>}
                    {uploadStats.error > 0 && <Badge variant="destructive">Failed: {uploadStats.error}</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearAllPhotos}>
                    <X className="w-4 h-4 mr-1" />Clear
                  </Button>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {isUploadPaused ? <Pause className="w-4 h-4 text-yellow-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                        {isUploadPaused ? "Paused" : "Processing..."}
                      </span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {!isUploading && (
                  <div className="flex items-center gap-2">
                    <Select value={overrideAll} onValueChange={setOverrideAll}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Override all categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBCATEGORIES.map(cat => (
                          <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={applyOverrideAll} disabled={!overrideAll}>Apply to All</Button>
                  </div>
                )}

                <ScrollArea className="h-[200px] rounded-lg border p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group rounded-lg overflow-hidden border bg-card">
                        <img src={photo.previewUrl} alt={photo.file.name} className="w-full aspect-square object-cover" />
                        <div className={`absolute inset-0 flex items-center justify-center
                          ${photo.status === "uploading" ? "bg-black/50" : ""}
                          ${photo.status === "done" ? "bg-green-500/20" : ""}
                          ${photo.status === "error" ? "bg-red-500/20" : ""}
                        `}>
                          {photo.status === "uploading" && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                          {photo.status === "done" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {photo.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                        {!isUploading && photo.status !== "done" && (
                          <button onClick={() => removePhoto(photo.id)} className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center gap-2">
                  {!isUploading ? (
                    <>
                      <Button onClick={startUploading} disabled={uploadStats.pending === 0} className="flex-1">
                        <Zap className="w-4 h-4 mr-2" />Upload {uploadStats.pending} Photos
                      </Button>
                      {uploadStats.error > 0 && (
                        <Button variant="outline" onClick={retryFailed}>
                          <RotateCcw className="w-4 h-4 mr-2" />Retry ({uploadStats.error})
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" onClick={() => setIsUploadPaused(!isUploadPaused)} className="flex-1">
                        {isUploadPaused ? <><Play className="w-4 h-4 mr-2" />Resume</> : <><Pause className="w-4 h-4 mr-2" />Pause</>}
                      </Button>
                      <Button variant="destructive" onClick={stopUploading} disabled={isUploadStopped}>
                        <X className="w-4 h-4 mr-2" />{isUploadStopped ? "Stopping..." : "Stop"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            <Alert className="bg-primary/5 border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                Photos are analyzed by AI to automatically categorize them. You can override categories before uploading.
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 3: Upload Lightroom Presets */}
        {/* ======================== */}
        <Collapsible open={presetUploadOpen} onOpenChange={setPresetUploadOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Upload Lightroom Presets</span>
                <span className="text-xs text-muted-foreground">ZIP, DNG, XMP files → Presets category</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${presetUploadOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isPresetDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsPresetDragging(true); }}
              onDragLeave={() => setIsPresetDragging(false)}
              onDrop={handlePresetDrop}
              onClick={() => presetInputRef.current?.click()}
            >
              <input
                ref={presetInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".zip,.dng,.xmp,.lrtemplate"
                onChange={(e) => e.target.files && handlePresetFiles(e.target.files)}
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isPresetDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">Drop preset files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports .zip, .dng, .xmp, .lrtemplate (max 50MB each)</p>
            </div>

            {/* Queue */}
            {presets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {presets.length} preset(s) in queue
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllPresets}
                    disabled={isUploadingPresets}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <ScrollArea className="h-48 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {presets.map((preset) => (
                      <div 
                        key={preset.id}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                      >
                        {/* Status Icon */}
                        {preset.status === 'pending' && (
                          <FileArchive className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        {preset.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                        )}
                        {preset.status === 'done' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        {preset.status === 'error' && (
                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        )}

                        {/* Filename */}
                        <span className="text-sm truncate flex-1" title={preset.file.name}>
                          {preset.file.name}
                        </span>

                        {/* Type Badge/Selector */}
                        {preset.status === 'pending' ? (
                          <Select
                            value={preset.overrideType || preset.detectedType}
                            onValueChange={(val) => updatePresetType(preset.id, val as PresetType)}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mobile">
                                <span className="flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" /> Mobile
                                </span>
                              </SelectItem>
                              <SelectItem value="desktop">
                                <span className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3" /> Desktop
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {(preset.overrideType || preset.detectedType) === 'mobile' 
                              ? <Smartphone className="w-3 h-3 mr-1" /> 
                              : <Monitor className="w-3 h-3 mr-1" />
                            }
                            <span className="capitalize">
                              {preset.overrideType || preset.detectedType}
                            </span>
                          </Badge>
                        )}

                        {/* Remove Button */}
                        {preset.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removePreset(preset.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Progress */}
                {isUploadingPresets && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{presetStats.done + presetStats.error}/{presetStats.total}</span>
                    </div>
                    <Progress value={presetUploadProgress} />
                  </div>
                )}

                {/* Stats */}
                {(presetStats.done > 0 || presetStats.error > 0) && !isUploadingPresets && (
                  <div className="flex gap-4 text-sm">
                    {presetStats.done > 0 && (
                      <span className="text-green-500">✓ {presetStats.done} uploaded</span>
                    )}
                    {presetStats.error > 0 && (
                      <span className="text-destructive">✗ {presetStats.error} failed</span>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                <Button 
                  onClick={startPresetUpload} 
                  disabled={isUploadingPresets || presetStats.pending === 0}
                  className="w-full"
                >
                  {isUploadingPresets ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {presetStats.pending} Preset(s)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p><strong>Auto-detection rules:</strong></p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Files with "mobile", "dng", "iphone" → Mobile Presets</li>
                <li>Files with "desktop", "xmp", "lrtemplate" → Desktop Presets</li>
                <li>You can override the detected type before uploading</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 4: Document Upload */}
        {/* ======================== */}
        <DocumentUploadSection />

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 4: Video Thumbnails */}
        {/* ======================== */}
        <Collapsible open={thumbnailsOpen} onOpenChange={setThumbnailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Video Thumbnails</span>
                <span className="text-xs text-muted-foreground">Generate thumbnails for vault videos</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${thumbnailsOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            {savedProgress && !isGeneratingThumbnails && (
              <Alert className="border-blue-500/50 bg-blue-500/10 mt-2">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-500">Resume Previous Session</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm">You have {savedProgress.processedIds.length} videos already processed.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => generateVideoThumbnails(true)} disabled={isProcessing}>
                      <Play className="w-3 h-3 mr-1" />Resume
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearSavedProgress}>Start Fresh</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {useWebCodecs ? (
              <Alert className="border-green-500/50 bg-green-500/10 mt-2">
                <Zap className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-600 dark:text-green-400">Background Processing Enabled</AlertTitle>
                <AlertDescription className="text-sm">
                  Using WebCodecs API - thumbnails will generate even if you switch tabs.
                </AlertDescription>
              </Alert>
            ) : showKeepActiveWarning ? (
              <Alert className="border-amber-500/50 bg-amber-500/10 mt-2">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">Keep Tab Active</AlertTitle>
                <AlertDescription className="text-sm">
                  Video thumbnail generation requires this browser tab to stay active.
                  <Button variant="link" size="sm" className="p-0 h-auto ml-2 text-muted-foreground" onClick={() => setShowKeepActiveWarning(false)}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium">Thumbnail Frame Position</Label>
              <div className="flex gap-2">
                <Select value={framePosition} onValueChange={(v) => setFramePosition(v as FramePosition)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginning">Beginning</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {framePosition === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} step={0.5} value={customTimestamp} onChange={(e) => setCustomTimestamp(Math.max(0, parseFloat(e.target.value) || 0))} className="w-20" />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={() => generateVideoThumbnails(false)} disabled={isProcessing} className="w-full">
              {isGeneratingThumbnails ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Image className="w-4 h-4 mr-2" />Generate Thumbnails</>
              )}
            </Button>

            {corsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>CORS Configuration Required</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{corsError}</p>
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

            {isPaused && isGeneratingThumbnails && !useWebCodecs && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <Pause className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">Generation Paused</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm">Paused. Progress saved ({thumbnailProgress?.generated || 0} of {thumbnailProgress?.total || 0}).</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={resumeGeneration} className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Play className="w-3 h-3 mr-1" />Resume
                    </Button>
                    <Button size="sm" variant="ghost" onClick={stopGeneration}>Stop</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isGeneratingThumbnails && thumbnailProgress && !isPaused && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="truncate max-w-[200px]">
                    {thumbnailProgress.currentVideoTitle ? `Processing: ${thumbnailProgress.currentVideoTitle}` : 'Generating thumbnails...'}
                  </span>
                  <span>{thumbnailProgress.current}/{thumbnailProgress.total}</span>
                </div>
                <Progress value={(thumbnailProgress.current / thumbnailProgress.total) * 100} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="text-green-500">✓ {thumbnailProgress.generated} generated</span>
                    {thumbnailProgress.failed > 0 && <span className="text-red-500">✗ {thumbnailProgress.failed} failed</span>}
                  </div>
                  <span>{getEstimatedTimeRemaining()}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={stopGeneration} className="w-full text-muted-foreground">Stop Generation</Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 4: AI Video Renaming */}
        {/* ======================== */}
        <Collapsible open={renameOpen} onOpenChange={setRenameOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium">AI Video Renaming</span>
                <span className="text-xs text-muted-foreground">Generate descriptive titles with AI</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${renameOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground pt-2">
              Use AI to generate descriptive titles for videos based on their thumbnails.
            </p>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Preview only</Label>
                <p className="text-xs text-muted-foreground">See suggested names before applying</p>
              </div>
              <Switch checked={previewOnly} onCheckedChange={setPreviewOnly} />
            </div>

            <Button onClick={handleAIRename} disabled={isProcessing} variant="outline" className="w-full">
              {isRenaming ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{previewOnly ? 'Generating previews...' : 'Renaming...'}</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />{previewOnly ? 'Preview AI Rename' : 'Rename Videos with AI'}</>
              )}
            </Button>

            {renameResult && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-green-500">✓ {renameResult.renamed} {previewOnly ? 'would be renamed' : 'renamed'}</span>
                  <span className="text-muted-foreground">⏭ {renameResult.skipped} skipped</span>
                  {renameResult.failed > 0 && <span className="text-red-500">✗ {renameResult.failed} failed</span>}
                </div>

                {renameResult.previews.length > 0 && (
                  <details open className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {previewOnly ? 'Preview changes' : 'Changed titles'} ({renameResult.previews.length})
                    </summary>
                    <ScrollArea className="h-32 mt-2">
                      <ul className="space-y-1">
                        {renameResult.previews.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through truncate max-w-[120px]">{p.oldTitle}</span>
                            <span>→</span>
                            <span className="text-green-600 dark:text-green-400 truncate max-w-[120px]">{p.newTitle}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </details>
                )}

                {renameResult.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-destructive">Errors ({renameResult.errors.length})</summary>
                    <ul className="mt-1 space-y-1 text-destructive">
                      {renameResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                      {renameResult.errors.length > 5 && <li>...and {renameResult.errors.length - 5} more</li>}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 5: AI Photo Renaming */}
        {/* ======================== */}
        <Collapsible open={photoRenameOpen} onOpenChange={setPhotoRenameOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-pink-500" />
                <span className="font-medium">AI Photo Renaming</span>
                <span className="text-xs text-muted-foreground">Generate descriptive titles for photos</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${photoRenameOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground pt-2">
              Use AI to generate descriptive titles for photos based on their content.
            </p>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Preview only</Label>
                <p className="text-xs text-muted-foreground">See suggested names before applying</p>
              </div>
              <Switch checked={photoPreviewOnly} onCheckedChange={setPhotoPreviewOnly} />
            </div>

            <Button onClick={handleAIPhotoRename} disabled={isProcessing} variant="outline" className="w-full">
              {isRenamingPhotos ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{photoPreviewOnly ? 'Generating previews...' : 'Renaming...'}</>
              ) : (
                <><FileImage className="w-4 h-4 mr-2" />{photoPreviewOnly ? 'Preview AI Rename' : 'Rename Photos with AI'}</>
              )}
            </Button>

            {photoRenameResult && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-green-500">✓ {photoRenameResult.renamed} {photoPreviewOnly ? 'would be renamed' : 'renamed'}</span>
                  <span className="text-muted-foreground">⏭ {photoRenameResult.skipped} skipped</span>
                  {photoRenameResult.failed > 0 && <span className="text-red-500">✗ {photoRenameResult.failed} failed</span>}
                </div>

                {photoRenameResult.previews.length > 0 && (
                  <details open className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {photoPreviewOnly ? 'Preview changes' : 'Changed titles'} ({photoRenameResult.previews.length})
                    </summary>
                    <ScrollArea className="h-32 mt-2">
                      <ul className="space-y-1">
                        {photoRenameResult.previews.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through truncate max-w-[120px]">{p.oldTitle}</span>
                            <span>→</span>
                            <span className="text-green-600 dark:text-green-400 truncate max-w-[120px]">{p.newTitle}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </details>
                )}

                {photoRenameResult.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-destructive">Errors ({photoRenameResult.errors.length})</summary>
                    <ul className="mt-1 space-y-1 text-destructive">
                      {photoRenameResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                      {photoRenameResult.errors.length > 5 && <li>...and {photoRenameResult.errors.length - 5} more</li>}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

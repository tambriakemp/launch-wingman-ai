import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Image, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  X,
  Zap,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Constants
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

interface SavedProgress {
  sessionId: string;
  completedIds: string[];
  failedIds: string[];
  categoryOverrides: Record<string, string>;
  timestamp: number;
}

const STORAGE_KEY = "bulk-photo-upload-progress";

// Compress image to target size (max 1MB for AI analysis)
async function compressImage(file: File, maxSize: number = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        // Scale down if too large
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
        
        // Start with high quality and reduce if needed
        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);
        
        // Reduce quality until under maxSize
        while (result.length > maxSize * 1.37 && quality > 0.1) { // 1.37 accounts for base64 overhead
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        
        // Remove data URL prefix
        resolve(result.split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BulkPhotoUploadCard() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overrideAll, setOverrideAll] = useState<string>("");
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  
  const isPausedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Check for saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedProgress;
        // Only show if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setSavedProgress(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Calculate stats
  const stats = {
    total: photos.length,
    pending: photos.filter(p => p.status === "pending").length,
    analyzing: photos.filter(p => p.status === "analyzing").length,
    ready: photos.filter(p => p.status === "ready").length,
    uploading: photos.filter(p => p.status === "uploading").length,
    done: photos.filter(p => p.status === "done").length,
    error: photos.filter(p => p.status === "error").length,
  };

  const progress = stats.total > 0 ? ((stats.done + stats.error) / stats.total) * 100 : 0;

  // Update pause ref when state changes
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    localStorage.removeItem(STORAGE_KEY);
    setSavedProgress(null);
  }, [photos]);

  const updatePhotoCategory = useCallback((id: string, category: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, overrideCategory: category } : p
    ));
  }, []);

  const applyOverrideAll = useCallback(() => {
    if (!overrideAll) return;
    setPhotos(prev => prev.map(p => ({ ...p, overrideCategory: overrideAll })));
    toast.success(`Applied "${overrideAll}" to all photos`);
  }, [overrideAll]);

  const startProcessing = useCallback(async () => {
    if (photos.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;

    const sessionId = `session-${Date.now()}`;
    const completedIds: string[] = [];
    const failedIds: string[] = [];
    const categoryOverrides: Record<string, string> = {};

    // Save category overrides
    photos.forEach(p => {
      if (p.overrideCategory) {
        categoryOverrides[p.id] = p.overrideCategory;
      }
    });

    try {
      // Process in batches
      const pendingPhotos = photos.filter(p => p.status !== "done" && p.status !== "error");
      const batches: PendingPhoto[][] = [];
      
      for (let i = 0; i < pendingPhotos.length; i += BATCH_SIZE) {
        batches.push(pendingPhotos.slice(i, i + BATCH_SIZE));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += CONCURRENT_BATCHES) {
        // Check if paused
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const currentBatches = batches.slice(batchIndex, batchIndex + CONCURRENT_BATCHES);
        
        await Promise.all(currentBatches.map(async (batch) => {
          // Update status to uploading
          setPhotos(prev => prev.map(p => 
            batch.some(b => b.id === p.id) ? { ...p, status: "uploading" as const } : p
          ));

          // Prepare batch data
          const batchData = await Promise.all(batch.map(async (photo) => {
            const imageBase64 = await compressImage(photo.file);
            return {
              id: photo.id,
              imageBase64,
              filename: photo.file.name,
              subcategory: photo.overrideCategory || undefined
            };
          }));

          // Call the batch processing function
          const { data, error } = await supabase.functions.invoke("process-photo-batch", {
            body: { photos: batchData }
          });

          if (error) {
            console.error("Batch processing error:", error);
            // Mark all as failed
            setPhotos(prev => prev.map(p => 
              batch.some(b => b.id === p.id) 
                ? { ...p, status: "error" as const, error: error.message } 
                : p
            ));
            batch.forEach(p => failedIds.push(p.id));
            return;
          }

          // Update individual photo statuses
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
                confidence: result.confidence || 0
              };
            } else {
              failedIds.push(p.id);
              return {
                ...p,
                status: "error" as const,
                error: result.error
              };
            }
          }));
        }));

        // Save progress after each batch group
        const progressData: SavedProgress = {
          sessionId,
          completedIds,
          failedIds,
          categoryOverrides,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
      }

      // Complete
      const finalStats = {
        done: completedIds.length,
        failed: failedIds.length,
        total: pendingPhotos.length
      };

      if (finalStats.failed === 0) {
        toast.success(`Successfully uploaded ${finalStats.done} photos!`);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        toast.warning(`Uploaded ${finalStats.done} photos, ${finalStats.failed} failed`);
      }

    } catch (err) {
      console.error("Processing error:", err);
      toast.error("An error occurred during processing");
    } finally {
      setIsProcessing(false);
    }
  }, [photos]);

  const retryFailed = useCallback(() => {
    setPhotos(prev => prev.map(p => 
      p.status === "error" ? { ...p, status: "pending" as const, error: undefined } : p
    ));
  }, []);

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Bulk Photo Upload</CardTitle>
              <CardDescription>
                Syncs from app → R2 bucket → Content Vault • AI-powered categorization
              </CardDescription>
            </div>
          </div>
          {photos.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saved Progress Banner */}
        {savedProgress && photos.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Previous upload session found ({savedProgress.completedIds.length} completed)
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setSavedProgress(null);
                }}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }
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
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium">
            Drop photos here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WebP, GIF • Max 10MB each • Up to 500 photos
          </p>
        </div>

        {/* Stats Bar */}
        {photos.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline">Total: {stats.total}</Badge>
            {stats.pending > 0 && <Badge variant="secondary">Pending: {stats.pending}</Badge>}
            {stats.uploading > 0 && <Badge className="bg-blue-500">Uploading: {stats.uploading}</Badge>}
            {stats.done > 0 && <Badge className="bg-green-500">Done: {stats.done}</Badge>}
            {stats.error > 0 && <Badge variant="destructive">Failed: {stats.error}</Badge>}
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {isPaused ? (
                  <Pause className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isPaused ? "Paused" : "Processing..."}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Override All Control */}
        {photos.length > 0 && !isProcessing && (
          <div className="flex items-center gap-2">
            <Select value={overrideAll} onValueChange={setOverrideAll}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Override all categories" />
              </SelectTrigger>
              <SelectContent>
                {SUBCATEGORIES.map(cat => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={applyOverrideAll}
              disabled={!overrideAll}
            >
              Apply to All
            </Button>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <ScrollArea className="h-[400px] rounded-lg border p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative group rounded-lg overflow-hidden border bg-card"
                >
                  <img
                    src={photo.previewUrl}
                    alt={photo.file.name}
                    className="w-full aspect-square object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    ${photo.status === "uploading" ? "bg-black/50" : ""}
                    ${photo.status === "done" ? "bg-green-500/20" : ""}
                    ${photo.status === "error" ? "bg-red-500/20" : ""}
                  `}>
                    {photo.status === "uploading" && (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    )}
                    {photo.status === "done" && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                    {photo.status === "error" && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  {/* Remove Button */}
                  {!isProcessing && photo.status !== "done" && (
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Category Badge */}
                  {(photo.suggestedCategory || photo.overrideCategory) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                      {photo.overrideCategory || photo.suggestedCategory}
                      {photo.confidence > 0 && !photo.overrideCategory && (
                        <span className="ml-1 opacity-75">({photo.confidence}%)</span>
                      )}
                    </div>
                  )}

                  {/* Category Override */}
                  {!isProcessing && photo.status !== "done" && (
                    <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Select 
                        value={photo.overrideCategory || "auto"} 
                        onValueChange={(v) => updatePhotoCategory(photo.id, v === "auto" ? undefined : v)}
                      >
                        <SelectTrigger className="h-7 text-xs bg-background/90 border-0 rounded-none">
                          <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (AI)</SelectItem>
                          {SUBCATEGORIES.map(cat => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Action Buttons */}
        {photos.length > 0 && (
          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <>
                <Button 
                  onClick={startProcessing}
                  disabled={stats.pending === 0 && stats.ready === 0}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upload {stats.pending + stats.ready} Photos
                </Button>
                {stats.error > 0 && (
                  <Button variant="outline" onClick={retryFailed}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Failed ({stats.error})
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* AI Info */}
        <Alert className="bg-primary/5 border-primary/20">
          <Zap className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            Photos are analyzed by AI to automatically categorize them into: Lifestyle, Flat Lays, 
            Workspace, Nature, Mockups, or Dark Aesthetic. You can override categories before uploading.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

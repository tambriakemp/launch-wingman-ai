import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileArchive, 
  Smartphone, 
  Monitor, 
  X, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Trash2
} from "lucide-react";

// ========================
// Types
// ========================

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

// ========================
// Constants
// ========================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for presets
const ACCEPTED_EXTENSIONS = ['.zip', '.dng', '.xmp', '.lrtemplate'];

// ========================
// Helper Functions
// ========================

function detectPresetType(filename: string): PresetType {
  const lowerName = filename.toLowerCase();
  
  const mobileKeywords = ['mobile', 'dng', 'iphone', 'ios', 'phone', 'android'];
  if (mobileKeywords.some(kw => lowerName.includes(kw))) {
    return 'mobile';
  }
  
  const desktopKeywords = ['desktop', 'xmp', 'lightroom classic', 'lr classic', 'lrtemplate'];
  if (desktopKeywords.some(kw => lowerName.includes(kw))) {
    return 'desktop';
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'dng') return 'mobile';
  if (ext === 'xmp' || ext === 'lrtemplate') return 'desktop';
  
  return 'desktop';
}

function isValidPresetFile(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/zip;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================
// Main Component
// ========================

export function PresetUploadCard() {
  const [presets, setPresets] = useState<PendingPreset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadStats = {
    total: presets.length,
    pending: presets.filter(p => p.status === 'pending').length,
    uploading: presets.filter(p => p.status === 'uploading').length,
    done: presets.filter(p => p.status === 'done').length,
    error: presets.filter(p => p.status === 'error').length,
  };

  const uploadProgress = uploadStats.total > 0 
    ? ((uploadStats.done + uploadStats.error) / uploadStats.total) * 100 
    : 0;

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => {
      if (!isValidPresetFile(file.name)) {
        toast.error(`${file.name} is not a supported preset file type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setPresets([]);
  }, []);

  const updatePresetType = useCallback((id: string, type: PresetType) => {
    setPresets(prev => prev.map(p => 
      p.id === id ? { ...p, overrideType: type } : p
    ));
  }, []);

  const startUpload = useCallback(async () => {
    const pendingPresets = presets.filter(p => p.status === 'pending');
    if (pendingPresets.length === 0) return;

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        setIsUploading(false);
        return;
      }

      for (const preset of pendingPresets) {
        // Update status to uploading
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
        } catch (err: any) {
          console.error(`Error uploading ${preset.file.name}:`, err);
          setPresets(prev => prev.map(p => 
            p.id === preset.id 
              ? { ...p, status: 'error' as const, error: err.message || 'Upload failed' } 
              : p
          ));
        }
      }

      const finalStats = presets.filter(p => p.status === 'done' || p.status === 'error');
      const successCount = presets.filter(p => p.status === 'done').length + pendingPresets.length;
      
      toast.success(`Upload complete! ${successCount} preset(s) uploaded.`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload presets");
    } finally {
      setIsUploading(false);
    }
  }, [presets]);

  const getTypeIcon = (type: PresetType) => {
    return type === 'mobile' 
      ? <Smartphone className="w-4 h-4" /> 
      : <Monitor className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="w-5 h-5 text-orange-500" />
          Upload Lightroom Presets
        </CardTitle>
        <CardDescription>
          Upload ZIP files containing Lightroom presets. Mobile and Desktop types are auto-detected from filename.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".zip,.dng,.xmp,.lrtemplate"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop preset files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports .zip, .dng, .xmp, .lrtemplate (max 50MB each)
          </p>
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
                onClick={clearAll}
                disabled={isUploading}
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
                        {getTypeIcon(preset.overrideType || preset.detectedType)}
                        <span className="ml-1 capitalize">
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
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadStats.done + uploadStats.error}/{uploadStats.total}</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Stats */}
            {(uploadStats.done > 0 || uploadStats.error > 0) && !isUploading && (
              <div className="flex gap-4 text-sm">
                {uploadStats.done > 0 && (
                  <span className="text-green-500">✓ {uploadStats.done} uploaded</span>
                )}
                {uploadStats.error > 0 && (
                  <span className="text-destructive">✗ {uploadStats.error} failed</span>
                )}
              </div>
            )}

            {/* Upload Button */}
            <Button 
              onClick={startUpload} 
              disabled={isUploading || uploadStats.pending === 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {uploadStats.pending} Preset(s)
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
      </CardContent>
    </Card>
  );
}

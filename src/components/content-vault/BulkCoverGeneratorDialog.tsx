import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ImagePlus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Wand2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

type ItemStatus = "pending" | "generating" | "done" | "error";

interface ItemState {
  id: string;
  title: string;
  status: ItemStatus;
  error?: string;
}

interface BulkCoverGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resources: Resource[];
}

export function BulkCoverGeneratorDialog({
  open,
  onOpenChange,
  resources,
}: BulkCoverGeneratorDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<ItemState[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  // Initialize items when dialog opens or resources change
  useEffect(() => {
    if (open && resources.length > 0) {
      setItems(resources.map((r) => ({ id: r.id, title: r.title, status: "pending" as ItemStatus })));
      setCompletedCount(0);
      abortRef.current = false;
    }
  }, [open, resources]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isProcessing) return;
    if (newOpen) {
      setReferenceImageUrl(null);
      setReferencePreview(null);
    }
    onOpenChange(newOpen);
  };

  const handleReferenceUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `reference-photos/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("content-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("content-media")
        .getPublicUrl(path);

      setReferenceImageUrl(urlData.publicUrl);
      setReferencePreview(URL.createObjectURL(file));
    } catch (err: any) {
      toast.error("Failed to upload reference image: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateItem = (id: string, update: Partial<ItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const generateAll = async () => {
    setIsProcessing(true);
    abortRef.current = false;
    let done = 0;

    for (const item of items) {
      if (abortRef.current) break;

      const resource = resources.find((r) => r.id === item.id);
      if (!resource?.description) {
        updateItem(item.id, { status: "error", error: "No description/prompt text" });
        done++;
        setCompletedCount(done);
        continue;
      }

      updateItem(item.id, { status: "generating" });

      try {
        // Call edge function
        const { data, error } = await supabase.functions.invoke("generate-prompt-cover", {
          body: {
            prompt: resource.description,
            referenceImageUrl: referenceImageUrl || undefined,
          },
        });

        if (error) throw new Error(error.message || "Edge function error");

        if (data?.error) {
          // Handle rate limit / credits
          if (data.error.includes("Rate limit")) {
            updateItem(item.id, { status: "error", error: "Rate limited — try again later" });
            toast.error("Rate limit hit. Pausing generation.");
            abortRef.current = true;
            done++;
            setCompletedCount(done);
            break;
          }
          throw new Error(data.error);
        }

        const imageBase64 = data?.imageBase64;
        if (!imageBase64) throw new Error("No image returned");

        // Convert base64 to blob and upload
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        const uploadPath = `vault-covers/${resource.id}-${Date.now()}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("content-media")
          .upload(uploadPath, blob, { contentType: "image/png" });

        if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

        const { data: publicUrlData } = supabase.storage
          .from("content-media")
          .getPublicUrl(uploadPath);

        // Update resource in DB
        const { error: dbErr } = await supabase
          .from("content_vault_resources")
          .update({ cover_image_url: publicUrlData.publicUrl })
          .eq("id", resource.id);

        if (dbErr) throw new Error("DB update failed: " + dbErr.message);

        updateItem(item.id, { status: "done" });
      } catch (err: any) {
        updateItem(item.id, { status: "error", error: err.message });
      }

      done++;
      setCompletedCount(done);

      // Delay between requests to avoid rate limiting
      if (!abortRef.current && done < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["content-vault-resources"] });
    toast.success(`Cover generation complete: ${done} processed`);
  };

  const stopGeneration = () => {
    abortRef.current = true;
  };

  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const statusIcon = (status: ItemStatus) => {
    switch (status) {
      case "generating":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generate Cover Images
          </DialogTitle>
          <DialogDescription>
            Generate AI cover images for {resources.length} selected prompt
            {resources.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reference Image Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Reference Photo (optional)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a photo to preserve identity across all generated covers.
            </p>

            {referencePreview ? (
              <div className="relative inline-block">
                <img
                  src={referencePreview}
                  alt="Reference"
                  className="h-24 w-24 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={() => {
                    setReferenceImageUrl(null);
                    setReferencePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  disabled={isProcessing}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isProcessing}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors w-full justify-center"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? "Uploading..." : "Upload reference photo"}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReferenceUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {completedCount} of {items.length} complete
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Items List */}
          <ScrollArea className="max-h-64 border border-border rounded-lg">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                >
                  {statusIcon(item.status)}
                  <span className="truncate flex-1 text-foreground">{item.title}</span>
                  {item.error && (
                    <span
                      className="text-xs text-destructive truncate max-w-[140px]"
                      title={item.error}
                    >
                      {item.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isProcessing ? (
              <Button variant="destructive" size="sm" onClick={stopGeneration}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={generateAll} disabled={items.length === 0}>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Generate All ({items.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

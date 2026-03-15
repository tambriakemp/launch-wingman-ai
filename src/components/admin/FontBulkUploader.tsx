import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Type, Loader2, CheckCircle2, XCircle, X, Zap, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";

const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"];

const SUBCATEGORIES = [
  { id: "fd43f504-22c9-4260-9530-416af10bc428", slug: "serif", name: "Serif" },
  { id: "f429c991-449b-4de0-86b8-1150a85ccbc1", slug: "sans-serif", name: "Sans Serif" },
  { id: "cb59dded-8233-49ea-b74b-812f793b092f", slug: "script", name: "Script" },
  { id: "cac89560-51d3-4117-9a68-01557ef3a139", slug: "display", name: "Display" },
  { id: "ef52e7b4-4275-476b-b8d9-30e36c507507", slug: "font-pairings", name: "Font Pairings" },
];

interface ZipFontEntry {
  id: string;
  zipFile: File;
  fontName: string;
  previewDataUrl: string | null;
  status: "pending" | "ready" | "uploading" | "done" | "error";
  error?: string;
}

function deriveFontName(fileName: string): string {
  return fileName
    .replace(/\.(zip)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function generateFontPreview(fontName: string, fontData: ArrayBuffer): Promise<string> {
  const font = new FontFace(fontName, fontData);
  await font.load();
  document.fonts.add(font);

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 800, 400);
  grad.addColorStop(0, "#fafafa");
  grad.addColorStop(1, "#f0f0f0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 400);

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 798, 398);

  ctx.fillStyle = "#888";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(fontName, 40, 40);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = `48px "${fontName}"`;
  ctx.fillText("AaBbCcDdEeFf", 40, 110);

  ctx.font = `32px "${fontName}"`;
  ctx.fillText("The quick brown fox jumps", 40, 175);
  ctx.fillText("over the lazy dog", 40, 220);

  ctx.font = `28px "${fontName}"`;
  ctx.fillStyle = "#555";
  ctx.fillText("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 40, 285);

  ctx.font = `24px "${fontName}"`;
  ctx.fillStyle = "#777";
  ctx.fillText("1234567890 !@#$%^&*()_+-=", 40, 330);

  document.fonts.delete(font);
  return canvas.toDataURL("image/png");
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function FontBulkUploader() {
  const [fonts, setFonts] = useState<ZipFontEntry[]>([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stats = {
    total: fonts.length,
    pending: fonts.filter((f) => f.status === "pending" || f.status === "ready").length,
    uploading: fonts.filter((f) => f.status === "uploading").length,
    done: fonts.filter((f) => f.status === "done").length,
    error: fonts.filter((f) => f.status === "error").length,
  };

  const progress = stats.total > 0 ? ((stats.done + stats.error) / stats.total) * 100 : 0;

  const handleZipFiles = useCallback(async (files: FileList | File[]) => {
    const zipFiles = Array.from(files).filter((f) => f.name.endsWith(".zip"));
    if (zipFiles.length === 0) {
      toast.error("Please upload ZIP files containing fonts");
      return;
    }

    const newEntries: ZipFontEntry[] = [];

    for (const zipFile of zipFiles) {
      try {
        const zip = await JSZip.loadAsync(zipFile);
        // Find the first valid font file for preview generation
        let previewDataUrl: string | null = null;
        for (const [path, entry] of Object.entries(zip.files)) {
          if (entry.dir) continue;
          const fileName = path.split("/").pop() || path;
          if (fileName.startsWith(".") || path.includes("__MACOSX")) continue;
          const ext = "." + fileName.split(".").pop()?.toLowerCase();
          if (!FONT_EXTENSIONS.includes(ext)) continue;

          try {
            const arrayBuffer = await entry.async("arraybuffer");
            const tempName = deriveFontName(fileName);
            previewDataUrl = await generateFontPreview(tempName, arrayBuffer);
            break; // Only need the first font for preview
          } catch (err) {
            console.warn(`Could not generate preview from ${fileName}:`, err);
          }
        }

        newEntries.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          zipFile,
          fontName: deriveFontName(zipFile.name),
          previewDataUrl,
          status: previewDataUrl ? "ready" : "pending",
        });
      } catch (err) {
        console.error("ZIP extraction error:", err);
        toast.error(`Failed to read ${zipFile.name}`);
      }
    }

    if (newEntries.length === 0) {
      toast.error("No valid font ZIPs found");
      return;
    }

    setFonts((prev) => [...prev, ...newEntries]);
    toast.success(`Added ${newEntries.length} font ZIP(s)`);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleZipFiles(e.dataTransfer.files);
    },
    [handleZipFiles]
  );

  const removeFont = useCallback((id: string) => {
    setFonts((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFonts([]);
  }, []);

  const startUpload = useCallback(async () => {
    if (!subcategoryId) {
      toast.error("Please select a font subcategory");
      return;
    }

    const toUpload = fonts.filter((f) => f.status !== "done" && f.status !== "error");
    if (toUpload.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const entry of toUpload) {
      setFonts((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" as const } : f)));

      try {
        const ts = Date.now();
        const safeName = entry.fontName.toLowerCase().replace(/\s+/g, "-");

        // Upload the original ZIP file
        const zipPath = `fonts/${ts}-${safeName}.zip`;
        const { error: zipUploadErr } = await supabase.storage
          .from("content-media")
          .upload(zipPath, entry.zipFile, { upsert: true, contentType: "application/zip" });

        if (zipUploadErr) throw zipUploadErr;

        const { data: zipUrlData } = supabase.storage.from("content-media").getPublicUrl(zipPath);

        // Upload preview image
        let coverUrl: string | null = null;
        if (entry.previewDataUrl) {
          const previewPath = `font-previews/${ts}-${safeName}.png`;
          const previewBlob = dataUrlToBlob(entry.previewDataUrl);

          const { error: previewErr } = await supabase.storage
            .from("content-media")
            .upload(previewPath, previewBlob, { upsert: true, contentType: "image/png" });

          if (previewErr) throw previewErr;

          const { data: previewUrlData } = supabase.storage.from("content-media").getPublicUrl(previewPath);
          coverUrl = previewUrlData.publicUrl;
        }

        // Insert DB record — one per ZIP
        const { error: dbErr } = await supabase.from("content_vault_resources").insert({
          title: entry.fontName,
          resource_url: zipUrlData.publicUrl,
          cover_image_url: coverUrl,
          resource_type: "download",
          subcategory_id: subcategoryId,
          description: `${entry.fontName} font pack (.zip)`,
        });

        if (dbErr) throw dbErr;

        setFonts((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "done" as const } : f)));
        successCount++;
      } catch (err: any) {
        console.error(`Failed to upload ${entry.fontName}:`, err);
        setFonts((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "error" as const, error: err.message } : f))
        );
        failCount++;
      }
    }

    setIsProcessing(false);

    if (failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} font pack(s)!`);
    } else {
      toast.warning(`Uploaded ${successCount}, failed ${failCount}`);
    }
  }, [fonts, subcategoryId]);

  const retryFailed = useCallback(() => {
    setFonts((prev) => prev.map((f) => (f.status === "error" ? { ...f, status: "ready" as const, error: undefined } : f)));
  }, []);

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Font Bulk Importer</CardTitle>
              <CardDescription>Upload ZIP files with fonts • Each ZIP becomes one downloadable resource</CardDescription>
            </div>
          </div>
          {fonts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={subcategoryId} onValueChange={setSubcategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select font subcategory" />
          </SelectTrigger>
          <SelectContent>
            {SUBCATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".zip"
            onChange={(e) => e.target.files && handleZipFiles(e.target.files)}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium">Drop ZIP files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Each ZIP = one downloadable font resource</p>
        </div>

        {fonts.length > 0 && (
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <Badge variant="outline">Total: {stats.total}</Badge>
            {stats.pending > 0 && <Badge variant="secondary">Ready: {stats.pending}</Badge>}
            {stats.uploading > 0 && <Badge className="bg-blue-500">Uploading: {stats.uploading}</Badge>}
            {stats.done > 0 && <Badge className="bg-green-500">Done: {stats.done}</Badge>}
            {stats.error > 0 && <Badge variant="destructive">Failed: {stats.error}</Badge>}
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading font packs...
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {fonts.length > 0 && (
          <ScrollArea className="h-[400px] rounded-lg border p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fonts.map((entry) => (
                <div key={entry.id} className="relative group rounded-lg overflow-hidden border bg-card">
                  {entry.previewDataUrl ? (
                    <img src={entry.previewDataUrl} alt={entry.fontName} className="w-full aspect-[2/1] object-cover" />
                  ) : (
                    <div className="w-full aspect-[2/1] bg-muted flex items-center justify-center">
                      <Type className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  <div
                    className={`absolute inset-0 flex items-center justify-center
                    ${entry.status === "uploading" ? "bg-black/50" : ""}
                    ${entry.status === "done" ? "bg-green-500/20" : ""}
                    ${entry.status === "error" ? "bg-red-500/20" : ""}
                  `}
                  >
                    {entry.status === "uploading" && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                    {entry.status === "done" && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                    {entry.status === "error" && <XCircle className="w-6 h-6 text-red-500" />}
                  </div>

                  {!isProcessing && entry.status !== "done" && (
                    <button
                      onClick={() => removeFont(entry.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                    {entry.fontName}
                    <span className="ml-1 opacity-60">(.zip)</span>
                  </div>

                  {entry.error && (
                    <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded max-w-[90%] truncate">
                      {entry.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {fonts.length > 0 && (
          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <>
                <Button onClick={startUpload} disabled={stats.pending === 0 || !subcategoryId} className="flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Upload {stats.pending} Font Pack{stats.pending !== 1 ? "s" : ""}
                </Button>
                {stats.error > 0 && (
                  <Button variant="outline" onClick={retryFailed}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry ({stats.error})
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" disabled className="flex-1">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        )}

        <Alert className="bg-primary/5 border-primary/20">
          <Type className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            Each ZIP file becomes one downloadable resource. A preview image is auto-generated from the first font found inside the ZIP.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

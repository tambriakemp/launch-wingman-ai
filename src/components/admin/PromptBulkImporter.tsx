import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Upload, ClipboardPaste, Loader2, X, Trash2, FileText, Download, Table, ImagePlus, Camera } from "lucide-react";

interface ParsedPrompt {
  title: string;
  text: string;
  coverImageUrl?: string;
  category?: string;
}

export const PromptBulkImporter = () => {
  const [rawText, setRawText] = useState("");
  const [parsedPrompts, setParsedPrompts] = useState<ParsedPrompt[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [globalCategory, setGlobalCategory] = useState("");
  const [bulkCoverImage, setBulkCoverImage] = useState("");
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [promptType, setPromptType] = useState<"image_prompt" | "video_prompt">("image_prompt");

  const ensureSubcategoryId = async () => {
    if (subcategoryId) return subcategoryId;
    const { data } = await supabase
      .from("content_vault_subcategories")
      .select("id, content_vault_categories!inner(slug)")
      .eq("content_vault_categories.slug", "ai-prompts")
      .limit(1)
      .single();
    if (data?.id) {
      setSubcategoryId(data.id);
      return data.id;
    }
    throw new Error("AI Prompts subcategory not found");
  };

  const handleParsePaste = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const splits = rawText
        .split(/---/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      if (splits.length === 0) {
        toast({ title: "No prompts found", description: "Separate prompts with --- on its own line", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("parse-prompts-bulk", {
        body: { prompts: splits, mode: "paste" },
      });

      if (error) throw error;
      setParsedPrompts(data.prompts || []);
      toast({ title: `Parsed ${data.prompts?.length || 0} prompts` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Parse failed", description: err.message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const handleParsePdf = async () => {
    if (!pdfFile) return;
    setIsParsing(true);
    try {
      const fileName = `pdf-imports/${Date.now()}-${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("admin-docs")
        .upload(fileName, pdfFile, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("admin-docs")
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke("parse-prompts-bulk", {
        body: { pdfUrl: urlData.publicUrl, mode: "pdf" },
      });

      if (error) throw error;
      setParsedPrompts(data.prompts || []);
      toast({ title: `Extracted ${data.prompts?.length || 0} prompts from PDF` });

      await supabase.storage.from("admin-docs").remove([fileName]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "PDF parse failed", description: err.message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const parseCsvLines = (text: string): string[] => {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        current += '"';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && text[i + 1] === '\n') i++;
        if (current.trim()) lines.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) lines.push(current);
    return lines;
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(v => v.replace(/^["']|["']$/g, '').trim());
  };

  const handleCsvFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: "Please upload a CSV file", variant: "destructive" });
      return;
    }
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Parse CSV respecting quoted fields that may contain newlines
        const lines = parseCsvLines(text);
        if (lines.length < 2) {
          toast({ title: "CSV must have a header and at least one row", variant: "destructive" });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const promptCol = headers.findIndex(h => h === 'prompt' || h === 'text' || h === 'description');
        const categoryCol = headers.findIndex(h => h === 'category' || h === 'tag' || h === 'tags');
        const titleCol = headers.findIndex(h => h === 'title' || h === 'name');
        const coverCol = headers.findIndex(h => h === 'cover_image_url' || h === 'cover' || h === 'image');

        if (promptCol === -1) {
          toast({ title: "Missing required column", description: "CSV needs a 'prompt' or 'text' column", variant: "destructive" });
          return;
        }

        const rawPrompts: { text: string; category?: string; title?: string; coverImageUrl?: string }[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          const promptText = values[promptCol]?.trim();
          if (!promptText || promptText.length < 5) continue;
          rawPrompts.push({
            text: promptText,
            category: categoryCol >= 0 ? values[categoryCol]?.trim() || undefined : undefined,
            title: titleCol >= 0 ? values[titleCol]?.trim() || undefined : undefined,
            coverImageUrl: coverCol >= 0 ? values[coverCol]?.trim() || undefined : undefined,
          });
        }

        if (rawPrompts.length === 0) {
          toast({ title: "No valid prompts found in CSV", variant: "destructive" });
          return;
        }

        // Generate titles for prompts that don't have one
        const needsTitles = rawPrompts.filter(p => !p.title);
        let titles: string[] = [];
        if (needsTitles.length > 0) {
          const { data, error } = await supabase.functions.invoke("parse-prompts-bulk", {
            body: { prompts: needsTitles.map(p => p.text), mode: "paste" },
          });
          if (!error && data?.prompts) {
            titles = data.prompts.map((p: any) => p.title);
          }
        }

        let titleIdx = 0;
        const parsed: ParsedPrompt[] = rawPrompts.map(p => ({
          title: p.title || titles[titleIdx++] || "Untitled Prompt",
          text: p.text,
          category: p.category,
          coverImageUrl: p.coverImageUrl,
        }));

        setParsedPrompts(parsed);
        toast({ title: `Parsed ${parsed.length} prompts from CSV` });
      } catch (err: any) {
        console.error(err);
        toast({ title: "CSV parse failed", description: err.message, variant: "destructive" });
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      toast({ title: "Failed to read file", variant: "destructive" });
      setIsParsing(false);
    };
    reader.readAsText(file);
  }, []);

  const downloadSampleCsv = () => {
    const sample = `category,prompt,title
"Portraits","A cinematic portrait of a woman standing in golden hour light, soft bokeh background, film grain, 35mm aesthetic","Golden Hour Portrait"
"Landscapes","A moody mountain landscape at dawn with fog rolling through pine valleys, dramatic lighting","Misty Mountain Dawn"
"Abstract","Fluid abstract shapes in deep indigo and coral, metallic accents, 4K digital art","Indigo Coral Abstract"`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-prompts-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updatePrompt = (index: number, field: keyof ParsedPrompt, value: string) => {
    setParsedPrompts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removePrompt = (index: number) => {
    setParsedPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportAll = async () => {
    if (parsedPrompts.length === 0) return;
    setIsImporting(true);
    try {
      const subId = await ensureSubcategoryId();

      // Fetch ALL existing resources (paginate to avoid 1000-row limit)
      let allExisting: { title: string | null; description: string | null }[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data: batch } = await supabase
          .from("content_vault_resources")
          .select("title, description")
          .eq("subcategory_id", subId)
          .in("resource_type", ["image_prompt", "video_prompt"])
          .range(from, from + PAGE - 1);
        if (!batch || batch.length === 0) break;
        allExisting = allExisting.concat(batch);
        if (batch.length < PAGE) break;
        from += PAGE;
      }

      const existingDescs = new Set(
        allExisting.map((r) => (r.description || "").trim().toLowerCase().replace(/\s+/g, ' '))
      );
      const existingTitles = new Set(
        allExisting.map((r) => (r.title || "").trim().toLowerCase())
      );

      const seenDescs = new Set<string>();
      const unique = parsedPrompts.filter((p) => {
        const descKey = p.text.trim().toLowerCase().replace(/\s+/g, ' ');
        const titleKey = p.title.trim().toLowerCase();
        if (existingDescs.has(descKey) || existingTitles.has(titleKey) || seenDescs.has(descKey)) {
          return false;
        }
        seenDescs.add(descKey);
        return true;
      });

      const skipped = parsedPrompts.length - unique.length;

      if (unique.length === 0) {
        toast({ title: "No new prompts to import", description: `All ${skipped} prompts already exist.` });
        setIsImporting(false);
        return;
      }

      const resources = unique.map((p, i) => {
        const tags: string[] = [];
        if (p.category) tags.push(p.category);
        if (globalCategory.trim()) tags.push(globalCategory.trim());
        return {
          title: p.title,
          description: p.text,
          resource_type: promptType,
          resource_url: "#",
          subcategory_id: subId,
          tags: tags.length > 0 ? tags : null,
          cover_image_url: p.coverImageUrl || bulkCoverImage || null,
          position: i,
        };
      });

      // Insert in batches of 500 to avoid Supabase row limits
      const BATCH_SIZE = 500;
      for (let i = 0; i < resources.length; i += BATCH_SIZE) {
        const batch = resources.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("content_vault_resources").insert(batch);
        if (error) throw error;
      }

      const msg = skipped > 0
        ? `Imported ${unique.length} prompts! (${skipped} duplicates skipped)`
        : `Imported ${unique.length} prompts!`;
      toast({ title: msg });
      setParsedPrompts([]);
      setRawText("");
      setPdfFile(null);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-lg">Bulk AI Prompt Importer</CardTitle>
        </div>
        <CardDescription>
          Paste prompts, upload a PDF, or import a CSV to bulk-import AI prompts into the Content Vault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Type Selector */}
        <div>
          <label className="text-sm font-medium mb-1 block">Prompt Type</label>
          <select
            value={promptType}
            onChange={(e) => setPromptType(e.target.value as "image_prompt" | "video_prompt")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="image_prompt">Image Prompt</option>
            <option value="video_prompt">Video Prompt</option>
          </select>
        </div>

        {parsedPrompts.length === 0 ? (
          <Tabs defaultValue="paste">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1 gap-1.5">
                <ClipboardPaste className="w-4 h-4" />
                Paste
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1 gap-1.5">
                <FileText className="w-4 h-4" />
                PDF
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 gap-1.5">
                <Table className="w-4 h-4" />
                CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 mt-3">
              <Textarea
                placeholder="Paste prompts here, separated by ---&#10;&#10;Example:&#10;A cinematic portrait of a woman...&#10;---&#10;A moody street photography scene..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
              />
              <Button onClick={handleParsePaste} disabled={isParsing || !rawText.trim()}>
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Parse & Generate Titles
              </Button>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-3 mt-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a PDF containing AI prompts
                </p>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                />
                {pdfFile && (
                  <p className="text-sm mt-2 text-foreground">{pdfFile.name}</p>
                )}
              </div>
              <Button onClick={handleParsePdf} disabled={isParsing || !pdfFile}>
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Extract Prompts from PDF
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-3 mt-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Table className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a CSV with columns for category and prompt
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvFile(file);
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p><span className="font-medium">Required:</span> prompt (or text)</p>
                  <p><span className="font-medium">Optional:</span> category, title, cover_image_url</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadSampleCsv}>
                  <Download className="w-4 h-4 mr-2" />
                  Sample CSV
                </Button>
              </div>
              {isParsing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing CSV and generating titles...
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Category input */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category (applied to all)</label>
              <Input
                value={globalCategory}
                onChange={(e) => setGlobalCategory(e.target.value)}
                placeholder="e.g., Portraits, Landscapes..."
                className="text-xs h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Per-prompt categories from CSV are preserved. This adds an additional category to all prompts.
              </p>
            </div>

            {/* Bulk cover image */}
            <div>
              <label className="text-sm font-medium mb-1 block">Bulk Cover Image URL (optional)</label>
              <Input
                value={bulkCoverImage}
                onChange={(e) => setBulkCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-xs"
              />
            </div>

            {/* Prompt list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {parsedPrompts.map((prompt, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={prompt.title}
                        onChange={(e) => updatePrompt(i, "title", e.target.value)}
                        className="text-sm font-medium h-8"
                        placeholder="Title"
                      />
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {prompt.text}
                      </p>
                      <div className="flex gap-2">
                        {prompt.category && (
                          <Badge variant="secondary" className="text-xs">{prompt.category}</Badge>
                        )}
                      </div>
                      <Input
                        value={prompt.coverImageUrl || ""}
                        onChange={(e) => updatePrompt(i, "coverImageUrl", e.target.value)}
                        placeholder="Cover image URL (optional, overrides bulk)"
                        className="text-xs h-7"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => removePrompt(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => {
                  setParsedPrompts([]);
                  setRawText("");
                  setPdfFile(null);
                }}
              >
                Start Over
              </Button>
              <div className="flex-1" />
              <Button onClick={handleImportAll} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import {parsedPrompts.length} Prompts
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Upload, ClipboardPaste, Loader2, X, Trash2, FileText } from "lucide-react";

interface ParsedPrompt {
  title: string;
  text: string;
  coverImageUrl?: string;
}

export const PromptBulkImporter = () => {
  const [rawText, setRawText] = useState("");
  const [parsedPrompts, setParsedPrompts] = useState<ParsedPrompt[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [bulkCoverImage, setBulkCoverImage] = useState("");
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [promptType, setPromptType] = useState<"image_prompt" | "video_prompt">("image_prompt");

  // Fetch the AI Prompts > General subcategory ID on first use
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
      // Split locally by --- separator only
      const splits = rawText
        .split(/---/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      if (splits.length === 0) {
        toast({ title: "No prompts found", description: "Separate prompts with --- on its own line", variant: "destructive" });
        return;
      }

      // Send to edge function for title generation
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
      // Upload PDF to storage first to avoid memory limits in edge function
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

      // Clean up the temp file
      await supabase.storage.from("admin-docs").remove([fileName]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "PDF parse failed", description: err.message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const updatePrompt = (index: number, field: keyof ParsedPrompt, value: string) => {
    setParsedPrompts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removePrompt = (index: number) => {
    setParsedPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !globalTags.includes(tag)) {
      setGlobalTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setGlobalTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleImportAll = async () => {
    if (parsedPrompts.length === 0) return;
    setIsImporting(true);
    try {
      const subId = await ensureSubcategoryId();

      // Fetch existing prompts to check for duplicates
      const { data: existing } = await supabase
        .from("content_vault_resources")
        .select("title, description")
        .eq("subcategory_id", subId)
        .in("resource_type", ["image_prompt", "video_prompt"]);

      const existingDescs = new Set(
        (existing || []).map((r) => (r.description || "").trim().toLowerCase())
      );
      const existingTitles = new Set(
        (existing || []).map((r) => (r.title || "").trim().toLowerCase())
      );

      // Filter out duplicates by description or title
      const unique = parsedPrompts.filter((p) => {
        const descKey = p.text.trim().toLowerCase();
        const titleKey = p.title.trim().toLowerCase();
        return !existingDescs.has(descKey) && !existingTitles.has(titleKey);
      });

      const skipped = parsedPrompts.length - unique.length;

      if (unique.length === 0) {
        toast({ title: "No new prompts to import", description: `All ${skipped} prompts already exist.` });
        setIsImporting(false);
        return;
      }

      const resources = unique.map((p, i) => ({
        title: p.title,
        description: p.text,
        resource_type: promptType,
        resource_url: "#",
        subcategory_id: subId,
        tags: globalTags.length > 0 ? globalTags : null,
        cover_image_url: p.coverImageUrl || bulkCoverImage || null,
        position: i,
      }));

      const { error } = await supabase.from("content_vault_resources").insert(resources);
      if (error) throw error;

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
          Paste prompts or upload a PDF to bulk-import AI prompts into the Content Vault
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
                Paste Prompts
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1 gap-1.5">
                <FileText className="w-4 h-4" />
                Upload PDF
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
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Tag input */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tags (applied to all)</label>
              <div className="flex gap-2 items-center flex-wrap">
                {globalTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="w-32 h-8 text-xs"
                />
              </div>
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

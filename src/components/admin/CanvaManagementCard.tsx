import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Eye, Check, AlertCircle, Image as ImageIcon, RefreshCw, ChevronDown, ChevronUp, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// ========================
// Types & Interfaces
// ========================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface ParsedDesign {
  designId: string;
  templateUrl: string | null;
  previewUrl: string | null;
  editUrl: string | null;
  thumbnail: string | null;
  title: string | null;
  isDuplicate: boolean;
  existingResourceId: string | null;
  customTitle?: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  designs: ParsedDesign[];
}

interface FailedResource {
  id: string;
  title: string;
  url: string;
  reason: string;
}

// ========================
// Main Component
// ========================

export function CanvaManagementCard() {
  // Section open states
  const [importOpen, setImportOpen] = useState(true);
  const [refetchOpen, setRefetchOpen] = useState(false);

  // ========================
  // Bulk Import State
  // ========================
  const [linksText, setLinksText] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [parsedDesigns, setParsedDesigns] = useState<ParsedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchThumbnails, setFetchThumbnails] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ========================
  // Refetch Thumbnails State
  // ========================
  const [isRefetching, setIsRefetching] = useState(false);
  const [refetchProgress, setRefetchProgress] = useState(0);
  const [refetchStats, setRefetchStats] = useState<{ total: number; updated: number; failed: number } | null>(null);
  const [failedResources, setFailedResources] = useState<FailedResource[]>([]);
  const [showFailed, setShowFailed] = useState(false);

  // ========================
  // Effects
  // ========================

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory("");
    }
  }, [selectedCategory]);

  // ========================
  // Bulk Import Handlers
  // ========================

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('content_vault_categories')
      .select('id, name, slug')
      .order('position');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    setCategories(data || []);
  };

  const fetchSubcategories = async (categoryId: string) => {
    const { data, error } = await supabase
      .from('content_vault_subcategories')
      .select('id, name, slug, category_id')
      .eq('category_id', categoryId)
      .order('position');

    if (error) {
      console.error('Error fetching subcategories:', error);
      return;
    }
    setSubcategories(data || []);
  };

  const handlePreview = async () => {
    const links = linksText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('canva.com'));

    if (links.length === 0) {
      toast.error("No valid Canva URLs found");
      return;
    }

    setIsFetching(true);
    setParsedDesigns([]);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke('bulk-import-canva', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { links, previewOnly: true, fetchMetadata: fetchThumbnails },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data as ImportResult;
      setParsedDesigns(data.designs.map(d => ({ ...d, customTitle: d.title || '' })));
      
      if (data.errors.length > 0) {
        toast.warning(`Parsed with ${data.errors.length} warnings`);
      } else {
        toast.success(`Found ${data.designs.length} unique designs`);
      }
    } catch (error) {
      console.error('Error previewing links:', error);
      toast.error("Failed to parse Canva links");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async () => {
    if (!selectedSubcategory) {
      toast.error("Please select a target subcategory");
      return;
    }

    const designsToImport = parsedDesigns.filter(d => d.templateUrl && !d.isDuplicate);
    const designsToUpdate = parsedDesigns.filter(d => d.isDuplicate && d.previewUrl);

    if (designsToImport.length === 0 && designsToUpdate.length === 0) {
      toast.error("No designs to import or update");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const links = parsedDesigns.flatMap(d => {
        const urls: string[] = [];
        if (d.templateUrl) urls.push(d.templateUrl);
        if (d.previewUrl) urls.push(d.previewUrl);
        return urls;
      });

      const response = await supabase.functions.invoke('bulk-import-canva', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { links, targetSubcategoryId: selectedSubcategory, previewOnly: false, fetchMetadata: true },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data as ImportResult;
      setResult(data);

      if (data.imported > 0 || data.updated > 0) {
        toast.success(`Imported ${data.imported}, updated ${data.updated} designs`);
      }

      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} errors occurred`);
      }

      if (data.imported > 0 && data.errors.length === 0) {
        setLinksText("");
        setParsedDesigns([]);
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error("Failed to import designs");
    } finally {
      setIsLoading(false);
    }
  };

  const updateDesignTitle = (designId: string, title: string) => {
    setParsedDesigns(prev => 
      prev.map(d => d.designId === designId ? { ...d, customTitle: title } : d)
    );
  };

  const newDesignsCount = parsedDesigns.filter(d => !d.isDuplicate && d.templateUrl).length;
  const duplicatesCount = parsedDesigns.filter(d => d.isDuplicate).length;
  const updatableCount = parsedDesigns.filter(d => d.isDuplicate && d.previewUrl).length;

  // ========================
  // Refetch Thumbnails Handlers
  // ========================

  const handleRefetchAll = async () => {
    setIsRefetching(true);
    setRefetchProgress(0);
    setRefetchStats(null);
    setFailedResources([]);

    try {
      const { data: resources, error: fetchError } = await supabase
        .from('content_vault_resources')
        .select('id, title, preview_url, resource_url, cover_image_url')
        .or('preview_url.neq.null,resource_url.ilike.%canva.com%');

      if (fetchError) throw fetchError;

      if (!resources || resources.length === 0) {
        toast.info("No Canva resources found to refetch");
        setIsRefetching(false);
        return;
      }

      const canvaResources = resources.filter(r => 
        r.preview_url?.includes('canva.com') || 
        r.resource_url?.includes('canva.com')
      );

      if (canvaResources.length === 0) {
        toast.info("No Canva resources found to refetch");
        setIsRefetching(false);
        return;
      }

      let updated = 0;
      let failed = 0;
      const failures: FailedResource[] = [];

      for (let i = 0; i < canvaResources.length; i++) {
        const resource = canvaResources[i];
        const urlToFetch = resource.preview_url || resource.resource_url;

        try {
          const { data, error } = await supabase.functions.invoke('extract-canva-thumbnail', {
            body: { url: urlToFetch }
          });

          if (error) throw new Error(error.message || 'Edge function error');

          if (data?.thumbnailUrl) {
            const { error: updateError } = await supabase
              .from('content_vault_resources')
              .update({ cover_image_url: data.thumbnailUrl })
              .eq('id', resource.id);

            if (updateError) throw new Error(`Database update failed: ${updateError.message}`);
            updated++;
          } else {
            failures.push({
              id: resource.id,
              title: resource.title,
              url: urlToFetch || 'No URL',
              reason: data?.error || 'No thumbnail found in page',
            });
            failed++;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Failed to fetch thumbnail for resource ${resource.id}:`, err);
          failures.push({
            id: resource.id,
            title: resource.title,
            url: urlToFetch || 'No URL',
            reason: errorMessage,
          });
          failed++;
        }

        setRefetchProgress(Math.round(((i + 1) / canvaResources.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setRefetchStats({ total: canvaResources.length, updated, failed });
      setFailedResources(failures);
      
      if (updated > 0) toast.success(`Updated ${updated} thumbnail${updated !== 1 ? 's' : ''}`);
      if (failed > 0) toast.warning(`Failed to update ${failed} thumbnail${failed !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Refetch failed:", error);
      toast.error("Failed to refetch thumbnails");
    } finally {
      setIsRefetching(false);
    }
  };

  const isProcessing = isLoading || isFetching || isRefetching;

  // ========================
  // Render
  // ========================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Canva Management</CardTitle>
            <CardDescription>
              Import and manage Canva designs in the vault
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* ======================== */}
        {/* SECTION 1: Bulk Import */}
        {/* ======================== */}
        <Collapsible open={importOpen} onOpenChange={setImportOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Bulk Import</span>
                <span className="text-xs text-muted-foreground">Import Canva designs via links</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${importOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            <div className="space-y-2 pt-2">
              <Label>Canva URLs (one per line)</Label>
              <Textarea
                placeholder={`Paste Canva links here, one per line:\nhttps://www.canva.com/design/DAGay6x4pQM/.../view?...\nhttps://www.canva.com/design/DAGay6x4pQM/.../watch?...`}
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports template (/view), preview (/watch), and edit (/edit) links.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="fetch-thumbnails" checked={fetchThumbnails} onCheckedChange={setFetchThumbnails} />
                <Label htmlFor="fetch-thumbnails" className="text-sm">Fetch thumbnails & titles</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Subcategory</Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!selectedCategory}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handlePreview} disabled={isFetching || !linksText.trim()} variant="outline" className="w-full">
              {isFetching ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing links...</>
              ) : (
                <><Eye className="w-4 h-4 mr-2" />Preview ({linksText.split('\n').filter(l => l.includes('canva.com')).length} links)</>
              )}
            </Button>

            {parsedDesigns.length > 0 && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    New: {newDesignsCount}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                    Duplicates: {duplicatesCount}
                  </Badge>
                  {updatableCount > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      Can update preview: {updatableCount}
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-[200px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Thumb</TableHead>
                        <TableHead>Design ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[80px]">Links</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedDesigns.map((design) => (
                        <TableRow key={design.designId}>
                          <TableCell>
                            {design.thumbnail ? (
                              <img src={design.thumbnail} alt="" className="w-12 h-9 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-9 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{design.designId}</TableCell>
                          <TableCell>
                            <Input
                              value={design.customTitle || ''}
                              onChange={(e) => updateDesignTitle(design.designId, e.target.value)}
                              placeholder="Enter title"
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {design.templateUrl && <Badge variant="outline" className="text-xs px-1">T</Badge>}
                              {design.previewUrl && <Badge variant="outline" className="text-xs px-1">P</Badge>}
                              {design.editUrl && <Badge variant="outline" className="text-xs px-1">E</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {design.isDuplicate ? (
                              <Badge variant="secondary" className="text-xs">Exists</Badge>
                            ) : design.templateUrl ? (
                              <Badge className="text-xs bg-green-600">New</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">No template</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <Button
                  onClick={handleImport}
                  disabled={isLoading || !selectedSubcategory || (newDesignsCount === 0 && updatableCount === 0)}
                  className="w-full"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Import {newDesignsCount} new{updatableCount > 0 && ` + update ${updatableCount}`}</>
                  )}
                </Button>
              </div>
            )}

            {result && (
              <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  {result.errors.length === 0 ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-medium">Import Complete</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>✓ Imported: {result.imported}</p>
                  <p>↻ Updated: {result.updated}</p>
                  <p>→ Skipped: {result.skipped}</p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-yellow-600 font-medium">Errors:</p>
                      {result.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-xs">{err}</p>
                      ))}
                      {result.errors.length > 5 && (
                        <p className="text-xs">...and {result.errors.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ======================== */}
        {/* SECTION 2: Refetch Thumbnails */}
        {/* ======================== */}
        <Collapsible open={refetchOpen} onOpenChange={setRefetchOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Refetch Thumbnails</span>
                <span className="text-xs text-muted-foreground">Update all Canva thumbnails</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${refetchOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-4 space-y-4">
            <p className="text-sm text-muted-foreground pt-2">
              Re-fetch thumbnails from Canva for all resources that have a Canva preview URL. 
              Use this when designs have been updated and you want the latest preview images.
            </p>

            {isRefetching && (
              <div className="space-y-2">
                <Progress value={refetchProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{refetchProgress}% complete</p>
              </div>
            )}

            {refetchStats && !isRefetching && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <p>Processed: <strong>{refetchStats.total}</strong> resources</p>
                <p className="text-green-600 dark:text-green-400">Updated: <strong>{refetchStats.updated}</strong></p>
                {refetchStats.failed > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">Failed: <strong>{refetchStats.failed}</strong></p>
                )}
              </div>
            )}

            {failedResources.length > 0 && !isRefetching && (
              <Collapsible open={showFailed} onOpenChange={setShowFailed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-amber-600 dark:text-amber-400 hover:text-amber-700">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      View {failedResources.length} failed resource{failedResources.length !== 1 ? 's' : ''}
                    </span>
                    {showFailed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-48 mt-2 rounded-md border">
                    <div className="p-2 space-y-2">
                      {failedResources.map((resource) => (
                        <div key={resource.id} className="p-2 bg-muted/30 rounded text-xs space-y-1">
                          <p className="font-medium truncate">{resource.title}</p>
                          <p className="text-muted-foreground truncate">{resource.url}</p>
                          <p className="text-destructive">{resource.reason}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button onClick={handleRefetchAll} disabled={isProcessing} className="w-full" variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refetching...' : 'Refetch All Canva Thumbnails'}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

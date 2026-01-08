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
import { Loader2, Upload, Eye, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function CanvaBulkImportCard() {
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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          links,
          previewOnly: true,
          fetchMetadata: fetchThumbnails,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

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

      // Build links array with custom titles applied
      const links = parsedDesigns.flatMap(d => {
        const urls: string[] = [];
        if (d.templateUrl) urls.push(d.templateUrl);
        if (d.previewUrl) urls.push(d.previewUrl);
        return urls;
      });

      const response = await supabase.functions.invoke('bulk-import-canva', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          links,
          targetSubcategoryId: selectedSubcategory,
          previewOnly: false,
          fetchMetadata: true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as ImportResult;
      setResult(data);

      if (data.imported > 0 || data.updated > 0) {
        toast.success(`Imported ${data.imported}, updated ${data.updated} designs`);
      }

      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} errors occurred`);
      }

      // Clear form on success
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          Canva Bulk Import
        </CardTitle>
        <CardDescription>
          Paste Canva template or preview links to import designs into the vault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Links Input */}
        <div className="space-y-2">
          <Label>Canva URLs (one per line)</Label>
          <Textarea
            placeholder={`Paste Canva links here, one per line:\nhttps://www.canva.com/design/DAGay6x4pQM/.../view?...\nhttps://www.canva.com/design/DAGay6x4pQM/.../watch?...`}
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Supports template (/view), preview (/watch), and edit (/edit) links. 
            Links with the same design ID will be combined.
          </p>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="fetch-thumbnails"
              checked={fetchThumbnails}
              onCheckedChange={setFetchThumbnails}
            />
            <Label htmlFor="fetch-thumbnails" className="text-sm">
              Fetch thumbnails & titles
            </Label>
          </div>
        </div>

        {/* Target Category/Subcategory */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Subcategory</Label>
            <Select 
              value={selectedSubcategory} 
              onValueChange={setSelectedSubcategory}
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview Button */}
        <Button
          onClick={handlePreview}
          disabled={isFetching || !linksText.trim()}
          variant="outline"
          className="w-full"
        >
          {isFetching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Parsing links...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Preview ({linksText.split('\n').filter(l => l.includes('canva.com')).length} links)
            </>
          )}
        </Button>

        {/* Parsed Designs Table */}
        {parsedDesigns.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                New: {newDesignsCount}
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Duplicates: {duplicatesCount}
              </Badge>
              {updatableCount > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Can update preview: {updatableCount}
                </Badge>
              )}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Thumbnail</TableHead>
                    <TableHead>Design ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[100px]">Links</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedDesigns.map((design) => (
                    <TableRow key={design.designId}>
                      <TableCell>
                        {design.thumbnail ? (
                          <img 
                            src={design.thumbnail} 
                            alt="" 
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {design.designId}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={design.customTitle || ''}
                          onChange={(e) => updateDesignTitle(design.designId, e.target.value)}
                          placeholder="Enter title"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {design.templateUrl && (
                            <Badge variant="outline" className="text-xs">T</Badge>
                          )}
                          {design.previewUrl && (
                            <Badge variant="outline" className="text-xs">P</Badge>
                          )}
                          {design.editUrl && (
                            <Badge variant="outline" className="text-xs">E</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {design.isDuplicate ? (
                          <Badge variant="secondary" className="text-xs">
                            Exists
                          </Badge>
                        ) : design.templateUrl ? (
                          <Badge className="text-xs bg-green-600">
                            New
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            No template
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={isLoading || !selectedSubcategory || (newDesignsCount === 0 && updatableCount === 0)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {newDesignsCount} new designs
                  {updatableCount > 0 && ` + update ${updatableCount} preview links`}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Result Summary */}
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
      </CardContent>
    </Card>
  );
}

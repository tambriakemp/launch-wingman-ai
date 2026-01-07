import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, SkipForward, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CsvResource {
  title: string;
  resource_url: string;
  cover_image_url?: string;
  preview_url?: string;
  category: string;
  subcategory: string;
  description?: string;
  resource_type?: string;
  tags?: string;
}

interface ProcessResult {
  added: number;
  skipped: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
  addedTitles: string[];
  skippedTitles: string[];
}

export const VaultCsvUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<CsvResource[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const parseCsv = (text: string): { data: CsvResource[]; errors: string[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return { data: [], errors: ['CSV must have a header row and at least one data row'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const requiredHeaders = ['title', 'resource_url', 'category', 'subcategory'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return { data: [], errors: [`Missing required headers: ${missingHeaders.join(', ')}`] };
    }

    const data: CsvResource[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      data.push({
        title: row.title || '',
        resource_url: row.resource_url || '',
        cover_image_url: row.cover_image_url || undefined,
        preview_url: row.preview_url || undefined,
        category: row.category || '',
        subcategory: row.subcategory || '',
        description: row.description || undefined,
        resource_type: row.resource_type || 'canva_link',
        tags: row.tags || undefined,
      });
    }

    return { data, errors };
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

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { data, errors } = parseCsv(text);
      setParsedData(data);
      setParseErrors(errors);
      setResult(null);
      
      if (data.length > 0) {
        toast.success(`Parsed ${data.length} resources from CSV`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} parsing warnings`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const processResources = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-vault-resources', {
        body: { resources: parsedData }
      });

      if (error) throw error;

      setResult(data as ProcessResult);
      toast.success(`Processing complete: ${data.added} added, ${data.skipped} skipped`);
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process resources');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCsv = () => {
    const sample = `title,resource_url,cover_image_url,preview_url,category,subcategory,description,resource_type,tags
"Instagram Story Template","https://canva.com/example1","","https://www.canva.com/design/DAGfeRGzQ4Y/watch","Social Media Posts","Stories","Beautiful story template for launches","canva_link","launch,story,modern"
"Lead Magnet Ebook","https://canva.com/example2","https://example.com/cover2.jpg","","Ebooks","Lead Magnets","Conversion-focused ebook template","canva_link","ebook,lead-magnet"`;
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vault-resources-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setParsedData([]);
    setParseErrors([]);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload CSV</span>
            <Button variant="outline" size="sm" onClick={downloadSampleCsv}>
              <Download className="w-4 h-4 mr-2" />
              Sample CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your CSV file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileInput}
            />
            <Button asChild variant="outline" size="sm">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </label>
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Required columns:</p>
            <p>title, resource_url, category, subcategory</p>
            <p className="mt-1 font-medium">Optional columns:</p>
            <p>cover_image_url, preview_url, description, resource_type, tags</p>
            <p className="mt-1 text-muted-foreground/70">
              💡 If preview_url is a Canva link and no cover_image_url is provided, thumbnail will be auto-fetched
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Parsing Warnings ({parseErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {parseErrors.map((error, i) => (
                <li key={i} className="text-yellow-600">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview ({parsedData.length} resources)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearData}>
                  Clear
                </Button>
                <Button size="sm" onClick={processResources} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Process Resources'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((resource, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {resource.title}
                      </TableCell>
                      <TableCell>{resource.category}</TableCell>
                      <TableCell>{resource.subcategory}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.resource_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {resource.tags || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{result.added}</p>
                    <p className="text-sm text-muted-foreground">Added</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <SkipForward className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                    <p className="text-sm text-muted-foreground">Skipped (duplicates)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors Detail */}
          {result.errors.length > 0 && (
            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-600">Failed Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((error, i) => (
                        <TableRow key={i}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.title}</TableCell>
                          <TableCell className="text-red-600">{error.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Button onClick={clearData} variant="outline">
            Upload Another File
          </Button>
        </div>
      )}
    </div>
  );
};

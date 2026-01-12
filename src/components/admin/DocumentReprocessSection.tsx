import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  RefreshCw, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  FileText,
  AlertTriangle,
  Square,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MissingPreviewResource {
  id: string;
  title: string;
  resource_url: string;
  preview_url: string | null;
  subcategory_name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

interface ReprocessStats {
  total: number;
  pending: number;
  processing: number;
  done: number;
  error: number;
}

export function DocumentReprocessSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [resources, setResources] = useState<MissingPreviewResource[]>([]);
  const shouldStopRef = useRef(false);
  const queryClient = useQueryClient();

  // Fetch documents missing PDF previews
  const { data: missingPreviewsData, isLoading, refetch } = useQuery({
    queryKey: ['missing-preview-documents'],
    queryFn: async () => {
      // Get business-documents category
      const { data: category } = await supabase
        .from('content_vault_categories')
        .select('id')
        .eq('slug', 'business-documents')
        .single();

      if (!category) return { resources: [], count: 0 };

      // Get all subcategories
      const { data: subcategories } = await supabase
        .from('content_vault_subcategories')
        .select('id, name')
        .eq('category_id', category.id);

      if (!subcategories || subcategories.length === 0) return { resources: [], count: 0 };

      // Get all resources with their subcategory info
      const { data: allResources, error } = await supabase
        .from('content_vault_resources')
        .select(`
          id,
          title,
          resource_url,
          preview_url,
          subcategory_id
        `)
        .in('subcategory_id', subcategories.map(s => s.id));

      if (error) throw error;

      // Filter to only non-PDF documents missing preview_url
      const missingPreviews = (allResources || []).filter(r => {
        const isPdf = r.resource_url?.toLowerCase().endsWith('.pdf');
        return !isPdf && !r.preview_url;
      });

      // Map subcategory names
      const subcatMap = new Map(subcategories.map(s => [s.id, s.name]));
      
      return {
        resources: missingPreviews.map(r => ({
          ...r,
          subcategory_name: subcatMap.get(r.subcategory_id) || 'Unknown'
        })),
        count: missingPreviews.length
      };
    },
    enabled: isOpen,
  });

  const stats: ReprocessStats = {
    total: resources.length,
    pending: resources.filter(r => r.status === 'pending').length,
    processing: resources.filter(r => r.status === 'processing').length,
    done: resources.filter(r => r.status === 'done').length,
    error: resources.filter(r => r.status === 'error').length,
  };

  const processedCount = stats.done + stats.error;
  const progress = stats.total > 0 ? (processedCount / stats.total) * 100 : 0;

  const loadMissingPreviews = useCallback(async () => {
    await refetch();
    if (missingPreviewsData?.resources) {
      setResources(missingPreviewsData.resources.map(r => ({
        id: r.id,
        title: r.title,
        resource_url: r.resource_url,
        preview_url: r.preview_url,
        subcategory_name: r.subcategory_name,
        status: 'pending' as const,
      })));
    }
  }, [refetch, missingPreviewsData]);

  const stopProcessing = useCallback(() => {
    shouldStopRef.current = true;
    setIsStopped(true);
    toast.info("Stopping after current document...");
  }, []);

  const startReprocess = useCallback(async () => {
    if (resources.length === 0) {
      toast.error("No documents to reprocess");
      return;
    }

    setIsProcessing(true);
    setIsStopped(false);
    shouldStopRef.current = false;

    const pendingResources = resources.filter(r => r.status === 'pending');

    for (const resource of pendingResources) {
      if (shouldStopRef.current) {
        toast.info("Reprocessing stopped by user");
        break;
      }

      setResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, status: 'processing' as const } : r
      ));

      try {
        // Fetch the original document from R2
        const response = await fetch(resource.resource_url);
        if (!response.ok) throw new Error('Failed to fetch original document');
        
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        // Extract filename from URL
        const urlParts = resource.resource_url.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Call convert-document-to-pdf to generate preview
        const { data: convertData, error: convertError } = await supabase.functions.invoke('convert-document-to-pdf', {
          body: {
            fileBase64: base64,
            filename: filename,
          }
        });

        if (convertError) throw convertError;
        if (!convertData?.pdfBase64) throw new Error('No PDF returned from conversion');

        // Upload the PDF preview to R2
        // Extract just the path portion from the full R2 URL
        const urlPath = new URL(resource.resource_url).pathname.slice(1); // Remove leading /
        const previewKey = urlPath
          .replace('business-documents/', 'business-documents/previews/')
          .replace(/\.[^.]+$/, '.pdf');
        
        // Upload preview using vault-preview endpoint or direct R2
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('vault-preview', {
          body: {
            action: 'upload-preview',
            resourceId: resource.id,
            pdfBase64: convertData.pdfBase64,
            previewKey: previewKey,
          }
        });

        if (uploadError) throw uploadError;

        // Update resource in database with preview_url
        const previewUrl = uploadData?.previewUrl;
        if (previewUrl) {
          const { error: updateError } = await supabase
            .from('content_vault_resources')
            .update({ preview_url: previewUrl })
            .eq('id', resource.id);

          if (updateError) throw updateError;
        }

        setResources(prev => prev.map(r => 
          r.id === resource.id ? { ...r, status: 'done' as const } : r
        ));
      } catch (err) {
        console.error(`Reprocess failed for ${resource.title}:`, err);
        setResources(prev => prev.map(r => 
          r.id === resource.id 
            ? { ...r, status: 'error' as const, error: err instanceof Error ? err.message : 'Reprocess failed' } 
            : r
        ));
      }
    }

    setIsProcessing(false);
    shouldStopRef.current = false;
    setIsStopped(false);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['missing-preview-documents'] });
  }, [resources, queryClient]);

  const missingCount = missingPreviewsData?.count || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-600" />
            <span className="font-medium">Reprocess Missing Previews</span>
            {missingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {missingCount} missing
              </Badge>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-3 pb-4 space-y-4">
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-300">Batch PDF Preview Generator</p>
            <p className="text-orange-700 dark:text-orange-400">
              This will re-download each document and generate PDF previews for DOCX/DOC/RTF files that are missing them.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Scanning for missing previews...</span>
          </div>
        )}

        {/* Missing Previews List */}
        {!isLoading && missingPreviewsData && (
          <>
            {missingPreviewsData.count === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                All documents have PDF previews!
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-medium">{missingPreviewsData.count}</span> documents missing PDF previews
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadMissingPreviews}
                    disabled={isProcessing}
                  >
                    Load for Reprocessing
                  </Button>
                </div>

                {/* Resource Queue */}
                {resources.length > 0 && (
                  <ScrollArea className="h-48 border rounded-lg">
                    <div className="p-2 space-y-1">
                      {resources.map(resource => (
                        <div 
                          key={resource.id} 
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm"
                        >
                          {/* Status Icon */}
                          {resource.status === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : resource.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          ) : resource.status === 'processing' ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-orange-500 shrink-0" />
                          )}

                          {/* Title */}
                          <span className="flex-1 truncate" title={resource.title}>
                            {resource.title}
                          </span>

                          {/* Subcategory */}
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {resource.subcategory_name}
                          </Badge>

                          {/* Status Badge */}
                          {resource.status === 'done' && (
                            <Eye className="w-3 h-3 text-green-500" />
                          )}
                          {resource.status === 'error' && (
                            <span className="text-[10px] text-destructive truncate max-w-[100px]" title={resource.error}>
                              {resource.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Progress */}
                {isProcessing && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isStopped ? "Stopping..." : "Reprocessing..."}
                      </span>
                      <span className="text-muted-foreground">{processedCount}/{stats.total}</span>
                    </div>
                    <Progress value={progress} />
                    
                    {/* Live Stats */}
                    <div className="flex flex-wrap gap-2">
                      {stats.done > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {stats.done} converted
                        </Badge>
                      )}
                      {stats.error > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          {stats.error} failed
                        </Badge>
                      )}
                    </div>

                    {/* Stop Button */}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={stopProcessing}
                      disabled={isStopped}
                      className="w-full"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {isStopped ? "Stopping..." : "Stop Reprocessing"}
                    </Button>
                  </div>
                )}

                {/* Completed Stats */}
                {!isProcessing && resources.length > 0 && (stats.done > 0 || stats.error > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {stats.done > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {stats.done} converted
                      </Badge>
                    )}
                    {stats.error > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {stats.error} failed
                      </Badge>
                    )}
                  </div>
                )}

                {/* Start Button */}
                {resources.length > 0 && (
                  <Button 
                    onClick={startReprocess} 
                    disabled={isProcessing || stats.pending === 0}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reprocess {stats.pending} Document(s)
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

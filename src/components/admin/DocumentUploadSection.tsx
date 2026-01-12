import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Upload, 
  X, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  FileType,
  Folder,
  FolderOpen,
  Square,
  Copy,
  SkipForward,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PendingDocument {
  id: string;
  file: File;
  title: string;
  subcategory: string;
  subcategoryName: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'skipped' | 'duplicate';
  error?: string;
  resultUrl?: string;
  folderPath?: string;
}

interface UploadStats {
  total: number;
  pending: number;
  uploading: number;
  done: number;
  error: number;
  skipped: number;
  duplicate: number;
}

interface SubcategoryOption {
  slug: string;
  name: string;
  isNew?: boolean;
}

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

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isValidDocumentFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  const validExtensions = ['pdf', 'doc', 'docx', 'rtf'];
  return validExtensions.includes(ext) || ACCEPTED_TYPES.includes(file.type);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function folderNameToSlug(folderName: string): string {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatSubcategoryName(folderName: string): string {
  return folderName
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Extract all folder parts from path (excluding filename)
function extractFullFolderPath(path: string): string[] {
  const parts = path.split('/');
  if (parts.length > 1) {
    return parts.slice(0, -1); // All parts except filename
  }
  return [];
}

// Create slug from full folder path: ["Sales", "Contracts"] -> "sales-contracts"
function folderPathToSlug(folders: string[]): string {
  return folders
    .map(f => folderNameToSlug(f))
    .filter(s => s.length > 0)
    .join('-');
}

// Create display name with hierarchy: ["Sales", "Contracts"] -> "Sales > Contracts"
function formatFolderPathName(folders: string[]): string {
  return folders
    .map(f => formatSubcategoryName(f))
    .join(' > ');
}

export function DocumentUploadSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [overrideAll, setOverrideAll] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const shouldStopRef = useRef(false);
  const queryClient = useQueryClient();

  // Reprocess missing previews state
  const [reprocessOpen, setReprocessOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessStopped, setReprocessStopped] = useState(false);
  const [reprocessResources, setReprocessResources] = useState<MissingPreviewResource[]>([]);
  const shouldStopReprocessRef = useRef(false);

  useEffect(() => {
    async function loadSubcategories() {
      try {
        const { data: category } = await supabase
          .from('content_vault_categories')
          .select('id')
          .eq('slug', 'business-documents')
          .single();

        if (category) {
          const { data: subs } = await supabase
            .from('content_vault_subcategories')
            .select('slug, name')
            .eq('category_id', category.id)
            .order('name');

          if (subs) {
            setSubcategories(subs.map(s => ({ slug: s.slug, name: s.name })));
          }
        }
      } catch (err) {
        console.error('Error loading subcategories:', err);
      }
    }
    loadSubcategories();
  }, []);

  // Fetch documents missing PDF previews
  const { data: missingPreviewsData, isLoading: missingPreviewsLoading, refetch: refetchMissingPreviews } = useQuery({
    queryKey: ['missing-preview-documents'],
    queryFn: async () => {
      const { data: category } = await supabase
        .from('content_vault_categories')
        .select('id')
        .eq('slug', 'business-documents')
        .single();

      if (!category) return { resources: [], count: 0 };

      const { data: subcats } = await supabase
        .from('content_vault_subcategories')
        .select('id, name')
        .eq('category_id', category.id);

      if (!subcats || subcats.length === 0) return { resources: [], count: 0 };

      const { data: allResources, error } = await supabase
        .from('content_vault_resources')
        .select('id, title, resource_url, preview_url, subcategory_id')
        .in('subcategory_id', subcats.map(s => s.id));

      if (error) throw error;

      const missingPreviews = (allResources || []).filter(r => {
        const isPdf = r.resource_url?.toLowerCase().endsWith('.pdf');
        return !isPdf && !r.preview_url;
      });

      const subcatMap = new Map(subcats.map(s => [s.id, s.name]));
      
      return {
        resources: missingPreviews.map(r => ({
          ...r,
          subcategory_name: subcatMap.get(r.subcategory_id) || 'Unknown'
        })),
        count: missingPreviews.length
      };
    },
    enabled: reprocessOpen,
  });

  const reprocessStats: ReprocessStats = {
    total: reprocessResources.length,
    pending: reprocessResources.filter(r => r.status === 'pending').length,
    processing: reprocessResources.filter(r => r.status === 'processing').length,
    done: reprocessResources.filter(r => r.status === 'done').length,
    error: reprocessResources.filter(r => r.status === 'error').length,
  };

  const reprocessedCount = reprocessStats.done + reprocessStats.error;
  const reprocessProgress = reprocessStats.total > 0 ? (reprocessedCount / reprocessStats.total) * 100 : 0;

  const loadMissingPreviews = useCallback(async () => {
    await refetchMissingPreviews();
    if (missingPreviewsData?.resources) {
      setReprocessResources(missingPreviewsData.resources.map(r => ({
        id: r.id,
        title: r.title,
        resource_url: r.resource_url,
        preview_url: r.preview_url,
        subcategory_name: r.subcategory_name,
        status: 'pending' as const,
      })));
    }
  }, [refetchMissingPreviews, missingPreviewsData]);

  const stopReprocessing = useCallback(() => {
    shouldStopReprocessRef.current = true;
    setReprocessStopped(true);
    toast.info("Stopping after current document...");
  }, []);

  const startReprocess = useCallback(async () => {
    if (reprocessResources.length === 0) {
      toast.error("No documents to reprocess");
      return;
    }

    setIsReprocessing(true);
    setReprocessStopped(false);
    shouldStopReprocessRef.current = false;

    const pendingResources = reprocessResources.filter(r => r.status === 'pending');

    for (const resource of pendingResources) {
      if (shouldStopReprocessRef.current) {
        toast.info("Reprocessing stopped by user");
        break;
      }

      setReprocessResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, status: 'processing' as const } : r
      ));

      try {
        const response = await fetch(resource.resource_url);
        if (!response.ok) throw new Error('Failed to fetch original document');
        
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        const urlParts = resource.resource_url.split('/');
        const filename = urlParts[urlParts.length - 1];

        const { data: convertData, error: convertError } = await supabase.functions.invoke('convert-document-to-pdf', {
          body: { fileBase64: base64, filename }
        });

        if (convertError) throw convertError;
        if (!convertData?.pdfBase64) throw new Error('No PDF returned from conversion');

        const urlPath = new URL(resource.resource_url).pathname.slice(1);
        const previewKey = urlPath
          .replace('business-documents/', 'business-documents/previews/')
          .replace(/\.[^.]+$/, '.pdf');
        
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('vault-preview', {
          body: {
            action: 'upload-preview',
            resourceId: resource.id,
            pdfBase64: convertData.pdfBase64,
            previewKey: previewKey,
          }
        });

        if (uploadError) throw uploadError;

        const previewUrl = uploadData?.previewUrl;
        if (previewUrl) {
          const { error: updateError } = await supabase
            .from('content_vault_resources')
            .update({ preview_url: previewUrl })
            .eq('id', resource.id);

          if (updateError) throw updateError;
        }

        setReprocessResources(prev => prev.map(r => 
          r.id === resource.id ? { ...r, status: 'done' as const } : r
        ));
      } catch (err) {
        console.error(`Reprocess failed for ${resource.title}:`, err);
        setReprocessResources(prev => prev.map(r => 
          r.id === resource.id 
            ? { ...r, status: 'error' as const, error: err instanceof Error ? err.message : 'Reprocess failed' } 
            : r
        ));
      }
    }

    setIsReprocessing(false);
    shouldStopReprocessRef.current = false;
    setReprocessStopped(false);
    
    queryClient.invalidateQueries({ queryKey: ['missing-preview-documents'] });
  }, [reprocessResources, queryClient]);

  const missingCount = missingPreviewsData?.count || 0;

  const stats: UploadStats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    uploading: documents.filter(d => d.status === "uploading").length,
    done: documents.filter(d => d.status === "done").length,
    error: documents.filter(d => d.status === "error").length,
    skipped: documents.filter(d => d.status === "skipped").length,
    duplicate: documents.filter(d => d.status === "duplicate").length,
  };

  const processedCount = stats.done + stats.error + stats.skipped + stats.duplicate;
  const uploadProgress = stats.total > 0 ? (processedCount / stats.total) * 100 : 0;

  const allSubcategories = useCallback((): SubcategoryOption[] => {
    const docSubcats = documents
      .filter(d => d.subcategory && d.subcategoryName)
      .map(d => ({ slug: d.subcategory, name: d.subcategoryName, isNew: true }));
    
    const merged = [...subcategories];
    for (const sub of docSubcats) {
      if (!merged.some(s => s.slug === sub.slug)) {
        merged.push(sub);
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [subcategories, documents]);

  // Files with metadata - relativePath is passed separately for drag-drop folders
  type FileWithPath = { file: File; relativePath?: string };

  const handleFiles = useCallback((files: FileList | File[] | FileWithPath[]) => {
    // Normalize to { file, relativePath } format
    const normalizedFiles: FileWithPath[] = Array.from(files as any).map((item: File | FileWithPath) => {
      if ('file' in item && item.file instanceof File) {
        return item as FileWithPath;
      }
      const file = item as File;
      return { 
        file, 
        relativePath: (file as any).webkitRelativePath || undefined 
      };
    });

    const validFiles = normalizedFiles.filter(({ file }) => {
      if (!isValidDocumentFile(file)) {
        toast.error(`${file.name} is not a supported document type (PDF, DOCX, DOC, RTF)`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const foldersDetected = new Set<string>();

    const newDocuments: PendingDocument[] = validFiles.map(({ file, relativePath }) => {
      const folderParts = extractFullFolderPath(relativePath || '');
      
      let subcategorySlug = subcategories[0]?.slug || 'templates';
      let subcategoryName = subcategories[0]?.name || 'Business Templates';
      
      if (folderParts.length > 0) {
        // Track root folder for toast message
        foldersDetected.add(folderParts[0]);
        // Use full path for subcategory
        subcategorySlug = folderPathToSlug(folderParts);
        subcategoryName = formatFolderPathName(folderParts);
      }

      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        subcategory: subcategorySlug,
        subcategoryName: subcategoryName,
        status: 'pending' as const,
        folderPath: relativePath || undefined,
      };
    });

    setDocuments(prev => [...prev, ...newDocuments]);
    
    if (foldersDetected.size > 0) {
      toast.success(`Added ${validFiles.length} document(s) from ${foldersDetected.size} root folder(s)`);
    } else {
      toast.success(`Added ${validFiles.length} document(s) to queue`);
    }
  }, [subcategories]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (items) {
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }
      
      if (entries.some(e => e.isDirectory)) {
        processEntries(entries);
        return;
      }
    }
    
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const processEntries = async (entries: FileSystemEntry[]) => {
    const filesWithPaths: { file: File; relativePath: string }[] = [];
    
    // readEntries only returns a batch at a time, must call repeatedly
    async function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
      const allEntries: FileSystemEntry[] = [];
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        allEntries.push(...batch);
      } while (batch.length > 0);
      return allEntries;
    }
    
    async function processEntry(entry: FileSystemEntry, path: string = ''): Promise<void> {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        // Don't mutate File - carry relativePath as separate metadata
        filesWithPaths.push({ file, relativePath: path + file.name });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const subEntries = await readAllDirectoryEntries(reader);
        for (const subEntry of subEntries) {
          await processEntry(subEntry, path + entry.name + '/');
        }
      }
    }
    
    try {
      // Process all dropped entries in parallel for speed
      await Promise.all(entries.map(entry => processEntry(entry, '')));
      
      if (filesWithPaths.length > 0) {
        handleFiles(filesWithPaths);
      }
    } catch (err) {
      console.error('Folder drag-drop failed:', err);
      toast.error('Folder drag & drop failed. Please try "Select Folder" instead.');
    }
  };

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setDocuments([]);
  }, []);

  const updateSubcategory = useCallback((id: string, subcategory: string) => {
    const subcat = allSubcategories().find(s => s.slug === subcategory);
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, subcategory, subcategoryName: subcat?.name || subcategory } : d
    ));
  }, [allSubcategories]);

  const applyOverrideAll = useCallback(() => {
    if (!overrideAll) return;
    const subcat = allSubcategories().find(s => s.slug === overrideAll);
    setDocuments(prev => prev.map(d => ({ 
      ...d, 
      subcategory: overrideAll,
      subcategoryName: subcat?.name || overrideAll
    })));
    toast.success(`Applied "${subcat?.name || overrideAll}" to all documents`);
  }, [overrideAll, allSubcategories]);

  const stopUpload = useCallback(() => {
    shouldStopRef.current = true;
    setIsStopped(true);
    toast.info("Stopping upload after current file...");
  }, []);

  const startUpload = useCallback(async () => {
    if (documents.length === 0) return;

    setIsUploading(true);
    setIsStopped(false);
    shouldStopRef.current = false;

    const pendingDocs = documents.filter(d => d.status === 'pending');

    for (const doc of pendingDocs) {
      // Check if stop was requested
      if (shouldStopRef.current) {
        toast.info("Upload stopped by user");
        break;
      }

      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? { ...d, status: 'uploading' as const } : d
      ));

      try {
        const fileBase64 = await fileToBase64(doc.file);

        const { data, error } = await supabase.functions.invoke('upload-document-to-r2', {
          body: {
            fileBase64,
            filename: doc.file.name,
            subcategory: doc.subcategory,
            subcategoryName: doc.subcategoryName,
            title: doc.title,
          }
        });

        if (error) throw error;

        // Handle skipped duplicates
        if (data.skipped) {
          setDocuments(prev => prev.map(d => 
            d.id === doc.id 
              ? { ...d, status: 'duplicate' as const, error: `Duplicate: "${data.title}" already exists` } 
              : d
          ));
        } else {
          setDocuments(prev => prev.map(d => 
            d.id === doc.id 
              ? { ...d, status: 'done' as const, resultUrl: data.url } 
              : d
          ));
        }
      } catch (err) {
        console.error(`Upload failed for ${doc.file.name}:`, err);
        setDocuments(prev => prev.map(d => 
          d.id === doc.id 
            ? { ...d, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' } 
            : d
        ));
      }
    }

    setIsUploading(false);
    shouldStopRef.current = false;
    setIsStopped(false);
  }, [documents]);

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    const colors: Record<string, string> = {
      'pdf': 'text-red-500',
      'docx': 'text-blue-500',
      'doc': 'text-blue-500',
      'rtf': 'text-green-500',
    };
    return colors[ext] || 'text-muted-foreground';
  };

  const currentSubcategories = allSubcategories();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Upload Business Documents</span>
            <span className="text-xs text-muted-foreground">PDF, DOCX, DOC, RTF</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-3 pb-4 space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileType className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop documents or folders here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, DOC, RTF • Max 50MB each
          </p>
          
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-4 h-4 mr-1" />
              Select Files
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              Select Folder
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.rtf"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...{ webkitdirectory: "", directory: "" } as any}
            accept=".pdf,.doc,.docx,.rtf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              // Reset so the same folder can be selected again
              e.target.value = '';
            }}
          />
        </div>

        {/* Folder Upload Tip */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <Folder className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-medium text-foreground">Multi-Level Folder Support</p>
            <p>Full folder paths become subcategory names. Example: <span className="font-mono text-[10px]">Sales/Contracts</span> → "Sales &gt; Contracts"</p>
            <p className="mt-1 text-muted-foreground/80">💡 Drag & drop multiple folders at once. Duplicates are automatically skipped.</p>
          </div>
        </div>

        {/* Override All */}
        {documents.length > 0 && (
          <div className="flex gap-2 items-center">
            <Select value={overrideAll} onValueChange={setOverrideAll}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Override all subcategories..." />
              </SelectTrigger>
              <SelectContent>
                {currentSubcategories.map(sub => (
                  <SelectItem key={sub.slug} value={sub.slug}>
                    {sub.name}
                    {sub.isNew && <Badge variant="secondary" className="ml-2 text-[10px] py-0">New</Badge>}
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
              Apply All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Document Queue */}
        {documents.length > 0 && (
          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-2 space-y-2">
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                >
                  {/* Status Icon */}
                  {doc.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : doc.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  ) : doc.status === 'duplicate' ? (
                    <Copy className="w-4 h-4 text-yellow-500 shrink-0" />
                  ) : doc.status === 'skipped' ? (
                    <SkipForward className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : doc.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${getFileIcon(doc.file.name)}`} />
                  )}

                  {/* Filename & Folder Path */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block max-w-[200px]" title={doc.file.name}>
                      {doc.file.name}
                    </span>
                    {doc.folderPath && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {doc.folderPath.split('/').slice(0, -1).join(' / ')}
                      </span>
                    )}
                  </div>

                  {/* Subcategory Selector */}
                  {doc.status === 'pending' ? (
                    <Select 
                      value={doc.subcategory} 
                      onValueChange={(v) => updateSubcategory(doc.id, v)}
                    >
                      <SelectTrigger className="h-7 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSubcategories.map(sub => (
                          <SelectItem key={sub.slug} value={sub.slug}>
                            {sub.name}
                            {sub.isNew && <Badge variant="secondary" className="ml-1 text-[10px] py-0">New</Badge>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {doc.subcategoryName}
                    </Badge>
                  )}

                  {/* Remove Button */}
                  {doc.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Progress with Stats */}
        {isUploading && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isStopped ? "Stopping..." : "Uploading..."}
              </span>
              <span className="text-muted-foreground">{processedCount}/{stats.total}</span>
            </div>
            <Progress value={uploadProgress} />
            
            {/* Live Stats */}
            <div className="flex flex-wrap gap-2">
              {stats.done > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {stats.done} uploaded
                </Badge>
              )}
              {stats.error > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  {stats.error} failed
                </Badge>
              )}
              {stats.duplicate > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                  <Copy className="w-3 h-3 mr-1" />
                  {stats.duplicate} duplicates
                </Badge>
              )}
              {stats.skipped > 0 && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700">
                  <SkipForward className="w-3 h-3 mr-1" />
                  {stats.skipped} skipped
                </Badge>
              )}
            </div>

            {/* Stop Button */}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopUpload}
              disabled={isStopped}
              className="w-full"
            >
              <Square className="w-4 h-4 mr-2" />
              {isStopped ? "Stopping..." : "Stop Upload"}
            </Button>
          </div>
        )}

        {/* Completed Stats */}
        {!isUploading && (stats.done > 0 || stats.error > 0 || stats.duplicate > 0 || stats.skipped > 0) && (
          <div className="flex flex-wrap gap-2">
            {stats.done > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {stats.done} uploaded
              </Badge>
            )}
            {stats.error > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.error} failed
              </Badge>
            )}
            {stats.duplicate > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                <Copy className="w-3 h-3 mr-1" />
                {stats.duplicate} duplicates
              </Badge>
            )}
            {stats.skipped > 0 && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700">
                <SkipForward className="w-3 h-3 mr-1" />
                {stats.skipped} skipped
              </Badge>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={startUpload} 
          disabled={isUploading || stats.pending === 0}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload {stats.pending} Document(s)
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Supported formats:</strong></p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li><span className="text-red-500">PDF</span> - Portable Document Format</li>
            <li><span className="text-blue-500">DOCX/DOC</span> - Microsoft Word</li>
            <li><span className="text-green-500">RTF</span> - Rich Text Format</li>
          </ul>
        </div>

        {/* Reprocess Missing Previews - Nested Collapsible */}
        <Collapsible open={reprocessOpen} onOpenChange={setReprocessOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto border border-dashed border-orange-300 dark:border-orange-700 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-sm">Reprocess Missing Previews</span>
                {missingCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {missingCount} missing
                  </Badge>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${reprocessOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4 space-y-4">
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
            {missingPreviewsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Scanning for missing previews...</span>
              </div>
            )}

            {/* Missing Previews Content */}
            {!missingPreviewsLoading && missingPreviewsData && (
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
                        disabled={isReprocessing}
                      >
                        Load for Reprocessing
                      </Button>
                    </div>

                    {/* Resource Queue */}
                    {reprocessResources.length > 0 && (
                      <ScrollArea className="h-48 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {reprocessResources.map(resource => (
                            <div 
                              key={resource.id} 
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm"
                            >
                              {resource.status === 'done' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              ) : resource.status === 'error' ? (
                                <XCircle className="w-4 h-4 text-destructive shrink-0" />
                              ) : resource.status === 'processing' ? (
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-orange-500 shrink-0" />
                              )}

                              <span className="flex-1 truncate" title={resource.title}>
                                {resource.title}
                              </span>

                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {resource.subcategory_name}
                              </Badge>

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
                    {isReprocessing && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {reprocessStopped ? "Stopping..." : "Reprocessing..."}
                          </span>
                          <span className="text-muted-foreground">{reprocessedCount}/{reprocessStats.total}</span>
                        </div>
                        <Progress value={reprocessProgress} />
                        
                        <div className="flex flex-wrap gap-2">
                          {reprocessStats.done > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {reprocessStats.done} converted
                            </Badge>
                          )}
                          {reprocessStats.error > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              {reprocessStats.error} failed
                            </Badge>
                          )}
                        </div>

                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={stopReprocessing}
                          disabled={reprocessStopped}
                          className="w-full"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          {reprocessStopped ? "Stopping..." : "Stop Reprocessing"}
                        </Button>
                      </div>
                    )}

                    {/* Completed Stats */}
                    {!isReprocessing && reprocessResources.length > 0 && (reprocessStats.done > 0 || reprocessStats.error > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {reprocessStats.done > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {reprocessStats.done} converted
                          </Badge>
                        )}
                        {reprocessStats.error > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {reprocessStats.error} failed
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Start Button */}
                    {reprocessResources.length > 0 && (
                      <Button 
                        onClick={startReprocess} 
                        disabled={isReprocessing || reprocessStats.pending === 0}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reprocess {reprocessStats.pending} Document(s)
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  );
}
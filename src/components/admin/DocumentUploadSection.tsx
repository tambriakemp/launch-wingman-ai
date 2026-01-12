import { useState, useCallback, useRef } from "react";
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
  FileType
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingDocument {
  id: string;
  file: File;
  title: string;
  subcategory: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  resultUrl?: string;
}

const DOCUMENT_SUBCATEGORIES = [
  { slug: "contracts", name: "Contracts & Agreements" },
  { slug: "proposals", name: "Proposals & Briefs" },
  { slug: "templates", name: "Business Templates" },
  { slug: "guides", name: "Guides & Checklists" },
];

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

export function DocumentUploadSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overrideAll, setOverrideAll] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    uploading: documents.filter(d => d.status === "uploading").length,
    done: documents.filter(d => d.status === "done").length,
    error: documents.filter(d => d.status === "error").length,
  };

  const uploadProgress = stats.total > 0 ? ((stats.done + stats.error) / stats.total) * 100 : 0;

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => {
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

    if (fileArray.length === 0) return;

    const newDocuments: PendingDocument[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      subcategory: 'templates', // Default subcategory
      status: 'pending' as const,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    toast.success(`Added ${fileArray.length} document(s) to queue`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setDocuments([]);
  }, []);

  const updateSubcategory = useCallback((id: string, subcategory: string) => {
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, subcategory } : d
    ));
  }, []);

  const applyOverrideAll = useCallback(() => {
    if (!overrideAll) return;
    setDocuments(prev => prev.map(d => ({ ...d, subcategory: overrideAll })));
    toast.success(`Applied "${DOCUMENT_SUBCATEGORIES.find(s => s.slug === overrideAll)?.name}" to all documents`);
  }, [overrideAll]);

  const startUpload = useCallback(async () => {
    if (documents.length === 0) return;

    setIsUploading(true);

    const pendingDocs = documents.filter(d => d.status === 'pending');

    for (const doc of pendingDocs) {
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
            title: doc.title,
          }
        });

        if (error) throw error;

        setDocuments(prev => prev.map(d => 
          d.id === doc.id 
            ? { ...d, status: 'done' as const, resultUrl: data.url } 
            : d
        ));
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
    
    const successCount = documents.filter(d => d.status === 'done').length + pendingDocs.filter(d => 
      documents.find(doc => doc.id === d.id)?.status === 'done'
    ).length;
    
    toast.success(`Uploaded ${successCount} document(s) to Content Vault`);
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
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <FileType className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop documents here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, DOC, RTF • Max 50MB each
          </p>
        </div>

        {/* Override All */}
        {documents.length > 0 && (
          <div className="flex gap-2 items-center">
            <Select value={overrideAll} onValueChange={setOverrideAll}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Override all subcategories..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_SUBCATEGORIES.map(sub => (
                  <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
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
          <ScrollArea className="h-48 border rounded-lg">
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
                  ) : doc.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${getFileIcon(doc.file.name)}`} />
                  )}

                  {/* Filename */}
                  <span className="text-sm truncate flex-1 max-w-[150px]" title={doc.file.name}>
                    {doc.file.name}
                  </span>

                  {/* Subcategory Selector */}
                  {doc.status === 'pending' ? (
                    <Select 
                      value={doc.subcategory} 
                      onValueChange={(v) => updateSubcategory(doc.id, v)}
                    >
                      <SelectTrigger className="h-7 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_SUBCATEGORIES.map(sub => (
                          <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {DOCUMENT_SUBCATEGORIES.find(s => s.slug === doc.subcategory)?.name || doc.subcategory}
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

        {/* Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Uploading...</span>
              <span>{stats.done + stats.error}/{stats.total}</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Stats */}
        {(stats.done > 0 || stats.error > 0) && !isUploading && (
          <div className="flex gap-4 text-sm">
            {stats.done > 0 && (
              <span className="text-green-500">✓ {stats.done} uploaded</span>
            )}
            {stats.error > 0 && (
              <span className="text-destructive">✗ {stats.error} failed</span>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={startUpload} 
          disabled={isUploading || stats.pending === 0}
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
              Upload {stats.pending} Document(s)
            </>
          )}
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
      </CollapsibleContent>
    </Collapsible>
  );
}
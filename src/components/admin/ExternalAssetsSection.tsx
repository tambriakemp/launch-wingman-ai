import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload,
  Copy,
  ExternalLink,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  Film,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return FileText;
  return File;
}

function getTypeBadge(mimeType: string | null): string {
  if (!mimeType) return 'File';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
  return mimeType.split('/').pop()?.toUpperCase() || 'File';
}

export function ExternalAssetsSection() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['external-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (asset: { id: string; file_path: string }) => {
      // Delete from storage
      await supabase.storage.from('brand-assets').remove([asset.file_path]);
      // Delete from table
      const { error } = await supabase
        .from('external_assets')
        .delete()
        .eq('id', asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-assets'] });
      toast.success('Asset deleted');
    },
    onError: () => toast.error('Failed to delete asset'),
  });

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not authenticated'); return; }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `external/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('external_assets')
        .insert({
          file_name: file.name,
          file_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type || null,
          uploaded_by: user.id,
        });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['external-assets'] });
      toast.success(`Uploaded ${file.name}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [queryClient]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          External Assets
        </CardTitle>
        <CardDescription>
          Upload files to get shareable public URLs — no login required to access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Drop a file here or click to upload</p>
              <p className="text-xs text-muted-foreground">
                PDFs, images, documents, videos — any file type
              </p>
            </div>
          )}
        </div>

        {/* File list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border">
            {assets.map((asset) => {
              const Icon = getFileIcon(asset.mime_type);
              return (
                <div key={asset.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {getTypeBadge(asset.mime_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(asset.file_size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(asset.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyLink(asset.public_url)}
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={asset.public_url} target="_blank" rel="noopener noreferrer" title="Open">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: asset.id, file_path: asset.file_path })}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No external assets uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

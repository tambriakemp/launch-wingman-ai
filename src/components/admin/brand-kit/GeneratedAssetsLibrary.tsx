import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Download, 
  Trash2, 
  Filter,
  Grid3X3,
  List,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Asset {
  id: string;
  asset_type: string;
  platform: string;
  asset_name: string;
  width: number;
  height: number;
  file_url: string;
  file_path: string;
  created_at: string;
}

interface GeneratedAssetsLibraryProps {
  assets: Asset[];
  isLoading: boolean;
  onAssetDeleted: () => void;
}

const PLATFORMS = ['All', 'Instagram', 'X (Twitter)', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest'];
const ASSET_TYPES = ['All', 'icon', 'banner', 'highlight', 'template'];

export const GeneratedAssetsLibrary = ({
  assets,
  isLoading,
  onAssetDeleted,
}: GeneratedAssetsLibraryProps) => {
  const queryClient = useQueryClient();
  const [platformFilter, setPlatformFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (platformFilter !== 'All' && asset.platform !== platformFilter) return false;
    if (typeFilter !== 'All' && asset.asset_type !== typeFilter) return false;
    return true;
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-assets')
        .remove([asset.file_path]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('brand_kit_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Asset deleted');
      onAssetDeleted();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete asset');
    },
  });

  // Download single asset
  const downloadAsset = async (asset: Asset) => {
    try {
      const response = await fetch(asset.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.platform.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${asset.asset_type}-${asset.width}x${asset.height}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download asset');
    }
  };

  // Download all as ZIP (simplified - downloads individually)
  const downloadAll = async () => {
    toast.info(`Downloading ${filteredAssets.length} assets...`);
    for (const asset of filteredAssets) {
      await downloadAsset(asset);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
    }
    toast.success('All assets downloaded');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t === 'All' ? 'All Types' : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {filteredAssets.length > 0 && (
            <Button variant="outline" onClick={downloadAll}>
              <Package className="h-4 w-4 mr-2" />
              Download All ({filteredAssets.length})
            </Button>
          )}
        </div>
      </div>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No assets yet</h3>
            <p className="text-sm text-muted-foreground">
              {assets.length === 0 
                ? 'Generate your first brand assets using the Generator tab.'
                : 'No assets match the current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map(asset => (
            <Card key={asset.id} className="overflow-hidden group">
              <div className="aspect-square relative bg-muted">
                <img
                  src={asset.file_url}
                  alt={asset.asset_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => downloadAsset(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this asset. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(asset.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{asset.asset_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {asset.platform}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {asset.width}×{asset.height}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={asset.file_url}
                      alt={asset.asset_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.asset_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {asset.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {asset.width}×{asset.height}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(asset.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAsset(asset)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this asset.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(asset.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {assets.length > 0 && (
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          {filteredAssets.length} of {assets.length} assets shown
        </div>
      )}
    </div>
  );
};

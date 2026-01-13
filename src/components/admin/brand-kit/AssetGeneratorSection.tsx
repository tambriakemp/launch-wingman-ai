import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, 
  AlertTriangle,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';

// Asset definitions with platform, type, and dimensions
const ASSET_DEFINITIONS = [
  // Instagram
  { id: 'instagram_profile', platform: 'Instagram', name: 'Profile Image', width: 320, height: 320, type: 'icon' },
  { id: 'instagram_highlight_1', platform: 'Instagram', name: 'Highlight Cover 1', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_highlight_2', platform: 'Instagram', name: 'Highlight Cover 2', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_highlight_3', platform: 'Instagram', name: 'Highlight Cover 3', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_highlight_4', platform: 'Instagram', name: 'Highlight Cover 4', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_highlight_5', platform: 'Instagram', name: 'Highlight Cover 5', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_highlight_6', platform: 'Instagram', name: 'Highlight Cover 6', width: 1080, height: 1920, type: 'highlight' },
  { id: 'instagram_carousel', platform: 'Instagram', name: 'Carousel Template', width: 1080, height: 1350, type: 'template' },
  { id: 'instagram_reel', platform: 'Instagram', name: 'Reel Cover Template', width: 1080, height: 1920, type: 'template' },
  
  // Facebook
  { id: 'facebook_profile', platform: 'Facebook', name: 'Page Profile', width: 320, height: 320, type: 'icon' },
  { id: 'facebook_cover', platform: 'Facebook', name: 'Page Cover', width: 1640, height: 856, type: 'banner' },
  
  
  // TikTok
  { id: 'tiktok_profile', platform: 'TikTok', name: 'Profile Image', width: 320, height: 320, type: 'icon' },
  { id: 'tiktok_cover', platform: 'TikTok', name: 'Video Cover Template', width: 1080, height: 1920, type: 'template' },
  
  // YouTube
  { id: 'youtube_icon', platform: 'YouTube', name: 'Channel Icon', width: 800, height: 800, type: 'icon' },
  { id: 'youtube_banner', platform: 'YouTube', name: 'Channel Banner', width: 1920, height: 1080, type: 'banner' },
  
  // Pinterest
  { id: 'pinterest_profile', platform: 'Pinterest', name: 'Profile Image', width: 320, height: 320, type: 'icon' },
  { id: 'pinterest_banner', platform: 'Pinterest', name: 'Profile Banner', width: 800, height: 450, type: 'banner' },
  { id: 'pinterest_pin', platform: 'Pinterest', name: 'Pin Template', width: 1000, height: 1500, type: 'template' },
];

// Group assets by platform
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'tiktok', name: 'TikTok', icon: () => <span className="text-lg">📱</span> },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'pinterest', name: 'Pinterest', icon: () => <span className="text-lg">📌</span> },
];

interface BrandSettings {
  id: string;
  brand_name: string;
  tagline: string;
  subtext: string | null;
  primary_color: string;
  secondary_color: string;
  neutral_color: string;
  header_font: string;
  body_font: string;
  logo_url: string | null;
  icon_url: string | null;
  highlight_labels: string[];
}

interface AssetGeneratorSectionProps {
  brandSettings: BrandSettings | null | undefined;
  onAssetsGenerated: () => void;
}

export const AssetGeneratorSection = ({ 
  brandSettings, 
  onAssetsGenerated 
}: AssetGeneratorSectionProps) => {
  const { session } = useAuth();
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);

  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const togglePlatform = (platformName: string) => {
    const platformAssets = ASSET_DEFINITIONS.filter(a => a.platform === platformName);
    const allSelected = platformAssets.every(a => selectedAssets.has(a.id));
    
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      platformAssets.forEach(asset => {
        if (allSelected) {
          newSet.delete(asset.id);
        } else {
          newSet.add(asset.id);
        }
      });
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedAssets(new Set(ASSET_DEFINITIONS.map(a => a.id)));
  };

  const selectNone = () => {
    setSelectedAssets(new Set());
  };

  // Generate assets mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!brandSettings) throw new Error('Brand settings not configured');
      if (selectedAssets.size === 0) throw new Error('No assets selected');

      const assetsToGenerate = ASSET_DEFINITIONS.filter(a => selectedAssets.has(a.id));
      const total = assetsToGenerate.length;
      let completed = 0;

      for (const asset of assetsToGenerate) {
        setCurrentlyGenerating(asset.name);
        
        // Get highlight label if applicable
        let highlightLabel = '';
        if (asset.type === 'highlight') {
          const highlightIndex = parseInt(asset.id.split('_')[2]) - 1;
          highlightLabel = brandSettings.highlight_labels?.[highlightIndex] || `Label ${highlightIndex + 1}`;
        }

        const { data, error } = await supabase.functions.invoke('generate-brand-asset', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: {
            asset,
            brandSettings: {
              ...brandSettings,
              highlight_label: highlightLabel,
            },
          },
        });

        if (error) {
          console.error(`Error generating ${asset.name}:`, error);
          toast.error(`Failed to generate ${asset.name}`);
        }

        completed++;
        setGenerationProgress((completed / total) * 100);
      }

      setCurrentlyGenerating(null);
      setGenerationProgress(0);
    },
    onSuccess: () => {
      toast.success('Assets generated successfully!');
      setSelectedAssets(new Set());
      onAssetsGenerated();
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate assets');
      setCurrentlyGenerating(null);
      setGenerationProgress(0);
    },
  });

  const isMissingSettings = !brandSettings?.brand_name || !brandSettings?.primary_color;

  return (
    <div className="space-y-6">
      {/* Warning if missing settings */}
      {isMissingSettings && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="text-sm">
                Please configure brand settings in the "Brand Source" tab before generating assets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Select None
          </Button>
        </div>
        <Badge variant="secondary">
          {selectedAssets.size} of {ASSET_DEFINITIONS.length} selected
        </Badge>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map(platform => {
          const platformAssets = ASSET_DEFINITIONS.filter(a => a.platform === platform.name);
          const selectedCount = platformAssets.filter(a => selectedAssets.has(a.id)).length;
          const allSelected = selectedCount === platformAssets.length;
          const someSelected = selectedCount > 0 && !allSelected;
          const Icon = platform.icon;

          return (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {platform.name}
                  </CardTitle>
                  <Checkbox
                    checked={allSelected}
                    // @ts-ignore - indeterminate is valid but not in types
                    data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                    onCheckedChange={() => togglePlatform(platform.name)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {selectedCount} of {platformAssets.length} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {platformAssets.map(asset => (
                    <div 
                      key={asset.id}
                      className="flex items-center justify-between py-1"
                    >
                      <Label 
                        htmlFor={asset.id}
                        className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                      >
                        <Checkbox
                          id={asset.id}
                          checked={selectedAssets.has(asset.id)}
                          onCheckedChange={() => toggleAsset(asset.id)}
                        />
                        <span>{asset.name}</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {asset.width}×{asset.height}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generation Progress */}
      {generateMutation.isPending && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Generating assets...</span>
              <span className="text-muted-foreground">{currentlyGenerating}</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              This may take a few minutes. Please don't close this page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || selectedAssets.size === 0 || isMissingSettings}
        >
          {generateMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate {selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};

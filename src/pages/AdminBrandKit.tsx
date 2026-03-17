import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Palette, 
  Settings2, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  RefreshCw,
  Upload,
  AlertTriangle,
  Sparkles,
  Grid3X3,
  Filter
} from 'lucide-react';
import { BrandSourceSection } from '@/components/admin/brand-kit/BrandSourceSection';
import { AssetGeneratorSection } from '@/components/admin/brand-kit/AssetGeneratorSection';
import { GeneratedAssetsLibrary } from '@/components/admin/brand-kit/GeneratedAssetsLibrary';
import { PostGeneratorSection } from '@/components/admin/brand-kit/PostGeneratorSection';
import { GeneratedPostsLibrary } from '@/components/admin/brand-kit/GeneratedPostsLibrary';
import { FileText } from 'lucide-react';

const AdminBrandKit = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('source');

  // Fetch brand settings
  const { data: brandSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['brand-kit-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_kit_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      // Transform highlight_labels from Json to string[]
      return {
        ...data,
        highlight_labels: Array.isArray(data.highlight_labels) 
          ? data.highlight_labels as string[]
          : ['Start Here', 'How It Works', 'Launching', 'Tech Clarity', 'Templates', 'Wins'],
      };
    },
  });

  // Fetch generated assets
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['brand-kit-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_kit_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Brand Kit</h1>
        <p className="text-sm text-muted-foreground">
          Generate platform-specific social media brand assets
        </p>
      </div>

      {/* Main Content */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="source" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Brand Source</span>
              <span className="sm:hidden">Source</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Generator</span>
              <span className="sm:hidden">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Assets Library</span>
              <span className="sm:hidden">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Post Generator</span>
              <span className="sm:hidden">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="posts-library" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Posts Library</span>
              <span className="sm:hidden">Library</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="source">
            <BrandSourceSection 
              brandSettings={brandSettings} 
              isLoading={settingsLoading}
              onSettingsSaved={() => {
                queryClient.invalidateQueries({ queryKey: ['brand-kit-settings'] });
              }}
            />
          </TabsContent>

          <TabsContent value="generator">
            <AssetGeneratorSection 
              brandSettings={brandSettings}
              onAssetsGenerated={() => {
                queryClient.invalidateQueries({ queryKey: ['brand-kit-assets'] });
                setActiveTab('library');
              }}
            />
          </TabsContent>

          <TabsContent value="library">
            <GeneratedAssetsLibrary 
              assets={assets || []}
              isLoading={assetsLoading}
              onAssetDeleted={() => {
                queryClient.invalidateQueries({ queryKey: ['brand-kit-assets'] });
              }}
            />
          </TabsContent>

          <TabsContent value="posts">
            <PostGeneratorSection 
              brandSettings={brandSettings}
              onPostGenerated={() => {
                queryClient.invalidateQueries({ queryKey: ['generated-posts'] });
                setActiveTab('posts-library');
              }}
            />
          </TabsContent>

          <TabsContent value="posts-library">
            <GeneratedPostsLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBrandKit;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { 
  Download, 
  Trash2, 
  Loader2, 
  Grid3X3, 
  List,
  Calendar,
  FileText,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GeneratedPost {
  id: string;
  platform: string;
  topic: string;
  generated_content: {
    headline?: string;
    subheadline?: string;
    bullets?: string[];
    cta?: string;
  };
  file_url: string;
  file_path: string;
  carousel_slides: Array<{
    slideNumber: number;
    content: any;
    imageUrl: string;
    filePath: string;
  }> | null;
  status: string;
  created_at: string;
}

interface GeneratedPostsLibraryProps {
  onRefresh?: () => void;
}

const PLATFORMS = ['All', 'Instagram', 'LinkedIn', 'X', 'Facebook', 'TikTok', 'Pinterest'];
const STATUSES = ['All', 'draft', 'approved', 'published'];

export const GeneratedPostsLibrary = ({ onRefresh }: GeneratedPostsLibraryProps) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<GeneratedPost | null>(null);

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['generated-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as GeneratedPost[];
    },
  });

  // Filter posts
  const filteredPosts = posts?.filter(post => {
    if (platformFilter !== 'All' && post.platform !== platformFilter) return false;
    if (statusFilter !== 'All' && post.status !== statusFilter) return false;
    return true;
  }) || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (post: GeneratedPost) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-assets')
        .remove([post.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete carousel slides if any
      if (post.carousel_slides) {
        const slidePaths = post.carousel_slides.map(s => s.filePath);
        await supabase.storage.from('brand-assets').remove(slidePaths);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('generated_posts')
        .delete()
        .eq('id', post.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['generated-posts'] });
      setDeleteTarget(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete post');
    }
  });

  // Download function
  const downloadPost = async (post: GeneratedPost) => {
    try {
      if (post.carousel_slides && post.carousel_slides.length > 0) {
        // Download all slides
        for (const slide of post.carousel_slides) {
          const response = await fetch(slide.imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${post.topic.slice(0, 30)}_slide_${slide.slideNumber}.png`;
          a.click();
          window.URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 500));
        }
        toast.success(`Downloaded ${post.carousel_slides.length} slides`);
      } else {
        const response = await fetch(post.file_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${post.topic.slice(0, 30)}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Downloaded');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>
                  {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{filteredPosts.length} of {posts?.length || 0} posts</span>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your first social media post in the "Generator" tab
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredPosts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden group">
              <div className="aspect-[4/5] relative">
                <img
                  src={post.file_url}
                  alt={post.topic}
                  className="w-full h-full object-cover"
                />
                {post.carousel_slides && post.carousel_slides.length > 1 && (
                  <Badge className="absolute top-2 left-2">
                    {post.carousel_slides.length} slides
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => downloadPost(post)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => window.open(post.file_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => setDeleteTarget(post)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {post.generated_content?.headline || post.topic}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredPosts.length > 0 && (
        <div className="space-y-2">
          {filteredPosts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={post.file_url}
                      alt={post.topic}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {post.generated_content?.headline || post.topic}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {post.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {post.platform}
                      </Badge>
                      {post.carousel_slides && (
                        <Badge variant="secondary" className="text-xs">
                          {post.carousel_slides.length} slides
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadPost(post)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(post.file_url, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Size
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteTarget(post)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post and all associated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { ResourceCard } from "@/components/content-vault/ResourceCard";
import { ResourceEditDialog } from "@/components/content-vault/ResourceEditDialog";
import { ResourceLightbox } from "@/components/content-vault/ResourceLightbox";
import { PromptModal } from "@/components/content-vault/PromptModal";
import { VaultFilters } from "@/components/content-vault/VaultFilters";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAdmin } from "@/hooks/useAdmin";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BulkCoverGeneratorDialog } from "@/components/content-vault/BulkCoverGeneratorDialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package, Trash2, X, CheckSquare, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  resource_count?: number;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  resource_type: string;
  resource_url: string;
  preview_url: string | null;
  tags: string[];
  subcategory_id: string;
}

const ContentVaultCategory = () => {
  const { categorySlug } = useParams();
  const queryClient = useQueryClient();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const { isAdmin } = useAdmin();
  const canAccessVault = hasAccess('content_vault');

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedPromptType, setSelectedPromptType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Edit/Delete/Lightbox state
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [promptResource, setPromptResource] = useState<Resource | null>(null);
  
  const isAiPrompts = categorySlug === 'ai-prompts';
  
  // Bulk selection state (admin only)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkCoverGenerator, setShowBulkCoverGenerator] = useState(false);

  // Fetch category
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['content-vault-category', categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_vault_categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();
      
      if (error) throw error;
      return data as Category;
    },
    enabled: canAccessVault && !!categorySlug,
  });

  // Fetch subcategories with resource counts
  const { data: subcategories } = useQuery({
    queryKey: ['content-vault-subcategories-with-counts', category?.id],
    queryFn: async () => {
      const { data: subs, error: subsError } = await supabase
        .from('content_vault_subcategories')
        .select('*')
        .eq('category_id', category!.id)
        .order('position', { ascending: true });
      
      if (subsError) throw subsError;
      if (!subs || subs.length === 0) return [];

      // Get subcategory IDs
      const subIds = subs.map(s => s.id);

      // Fetch resource counts per subcategory
      const { data: resourceCounts, error: rcError } = await supabase
        .from('content_vault_resources')
        .select('subcategory_id')
        .in('subcategory_id', subIds);
      
      if (rcError) throw rcError;

      // Count resources per subcategory
      const countMap = new Map<string, number>();
      resourceCounts?.forEach(r => {
        countMap.set(r.subcategory_id, (countMap.get(r.subcategory_id) || 0) + 1);
      });

      return subs.map(sub => ({
        ...sub,
        resource_count: countMap.get(sub.id) || 0,
      })) as Subcategory[];
    },
    enabled: canAccessVault && !!category?.id,
  });

  // Fetch resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['content-vault-resources', category?.id],
    queryFn: async () => {
      const subcategoryIds = subcategories?.map(s => s.id) || [];
      if (subcategoryIds.length === 0) return [];

      const { data, error } = await supabase
        .from('content_vault_resources')
        .select('*')
        .in('subcategory_id', subcategoryIds)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Resource[];
    },
    enabled: canAccessVault && !!subcategories && subcategories.length > 0,
  });

  // Single delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from('content_vault_resources')
        .delete()
        .eq('id', resourceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-vault-resources'] });
      toast.success("Resource deleted successfully");
      setDeletingResource(null);
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('content_vault_resources')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-vault-resources'] });
      toast.success(`${selectedIds.size} resources deleted successfully`);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBulkDeleteConfirm(false);
    },
    onError: (error) => {
      toast.error("Failed to delete resources: " + error.message);
    },
  });

  // Get all unique tags
  const allTags = useMemo(() => {
    if (!resources) return [];
    const tags = new Set<string>();
    resources.forEach(r => r.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    if (!resources) return [];
    
    return resources.filter(resource => {
      // Subcategory filter
      if (selectedSubcategory !== "all" && resource.subcategory_id !== selectedSubcategory) {
        return false;
      }
      
      // Prompt type filter (for AI prompts category)
      if (isAiPrompts && selectedPromptType !== "all" && resource.resource_type !== selectedPromptType) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!resource.title.toLowerCase().includes(query) && 
            !resource.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Tags filter
      if (selectedTags.length > 0) {
        if (!selectedTags.some(tag => resource.tags?.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }, [resources, selectedSubcategory, selectedPromptType, searchQuery, selectedTags, isAiPrompts]);

  const handleResourceClick = (resource: Resource, index: number) => {
    // Don't open lightbox in selection mode
    if (isSelectionMode) {
      toggleSelection(resource.id);
      return;
    }
    
    // AI Prompts open the prompt modal
    if (resource.resource_type === 'image_prompt' || resource.resource_type === 'video_prompt') {
      setPromptResource(resource);
      return;
    }
    
    // Check if it's a media file or document that can be shown in lightbox
    const isMediaOrDocument = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|pdf|docx|doc|rtf)$/i.test(resource.resource_url);
    
    if (isMediaOrDocument) {
      setLightboxIndex(index);
    } else {
      // For non-media files (like Canva links), open in new tab
      window.open(resource.resource_url, '_blank');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredResources.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  // Show loading state while checking permissions
  if (accessLoading) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </ProjectLayout>
    );
  }

  // Show upgrade prompt for free users
  if (!canAccessVault) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background p-6">
          <UpgradePrompt 
            feature="content_vault" 
            variant="card" 
            customMessage="The Content Vault is a Pro feature. Upgrade to access our library of ready-to-use templates."
          />
        </div>
      </ProjectLayout>
    );
  }

  if (categoryLoading) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </ProjectLayout>
    );
  }

  if (!category) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background p-6">
          <p className="text-muted-foreground">Category not found.</p>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link 
                to="/content-vault" 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Package className="w-4 h-4" />
                Content Vault
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{category.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
            
            {/* Admin Bulk Actions */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSelectionMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All ({filteredResources.length})
                    </Button>
                    {isAiPrompts && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkCoverGenerator(true)}
                        disabled={selectedIds.size === 0}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Covers ({selectedIds.size})
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      disabled={selectedIds.size === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedIds.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Bulk Select
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <VaultFilters
            subcategories={subcategories || []}
            selectedSubcategory={selectedSubcategory}
            onSubcategoryChange={setSelectedSubcategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            isPromptCategory={isAiPrompts}
            selectedPromptType={selectedPromptType}
            onPromptTypeChange={setSelectedPromptType}
            resources={resources || []}
          />

          {/* Resources Grid */}
          {resourcesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredResources.map((resource, index) => (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  title={resource.title}
                  description={resource.description}
                  coverImageUrl={resource.cover_image_url}
                  coverImageFit={(resource as any).cover_image_fit}
                  resourceUrl={resource.resource_url}
                  previewUrl={resource.preview_url}
                  resourceType={resource.resource_type}
                  tags={resource.tags}
                  onClick={() => handleResourceClick(resource, index)}
                  isSelectable={isSelectionMode}
                  isSelected={selectedIds.has(resource.id)}
                  onSelectionChange={() => toggleSelection(resource.id)}
                  isAdmin={isAdmin}
                  onEdit={() => setEditingResource(resource)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {resources && resources.length > 0 
                  ? "No resources match your filters." 
                  : "No resources available in this category yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <ResourceEditDialog
        resource={editingResource}
        open={!!editingResource}
        onOpenChange={(open) => !open && setEditingResource(null)}
      />

      {/* Single Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingResource}
        onOpenChange={(open) => !open && setDeletingResource(null)}
        onConfirm={() => deletingResource && deleteMutation.mutate(deletingResource.id)}
        title="Delete Resource"
        description={`Are you sure you want to delete "${deletingResource?.title}"? This action cannot be undone.`}
        isDeleting={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmationDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        title="Delete Multiple Resources"
        description={`Are you sure you want to delete ${selectedIds.size} resources? This action cannot be undone.`}
        isDeleting={bulkDeleteMutation.isPending}
      />

      {/* Lightbox */}
      <ResourceLightbox
        resources={filteredResources}
        currentIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      />

      {/* Bulk Cover Generator */}
      <BulkCoverGeneratorDialog
        open={showBulkCoverGenerator}
        onOpenChange={setShowBulkCoverGenerator}
        resources={filteredResources.filter((r) => selectedIds.has(r.id))}
      />

      {/* Prompt Modal for AI Prompts */}
      <PromptModal
        open={!!promptResource}
        onOpenChange={(open) => !open && setPromptResource(null)}
        title={promptResource?.title || ''}
        description={promptResource?.description || null}
        coverImageUrl={promptResource?.cover_image_url || null}
        coverImageFit={(promptResource as any)?.cover_image_fit}
        tags={promptResource?.tags || []}
      />
    </ProjectLayout>
  );
};

export default ContentVaultCategory;

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { ResourceCard } from "@/components/content-vault/ResourceCard";
import { ResourceEditDialog } from "@/components/content-vault/ResourceEditDialog";
import { VaultFilters } from "@/components/content-vault/VaultFilters";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAdmin } from "@/hooks/useAdmin";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Package } from "lucide-react";
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
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  resource_type: string;
  resource_url: string;
  tags: string[];
  subcategory_id: string;
}

const ContentVaultCategory = () => {
  const { categorySlug } = useParams();
  const queryClient = useQueryClient();
  const { hasAccess } = useFeatureAccess();
  const { isAdmin } = useAdmin();
  const canAccessVault = hasAccess('content_vault');

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Edit/Delete state
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

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

  // Fetch subcategories
  const { data: subcategories } = useQuery({
    queryKey: ['content-vault-subcategories', category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_vault_subcategories')
        .select('*')
        .eq('category_id', category!.id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Subcategory[];
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

  // Delete mutation
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
  }, [resources, selectedSubcategory, searchQuery, selectedTags]);

  const handleResourceClick = (resource: Resource) => {
    window.open(resource.resource_url, '_blank');
  };

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
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
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  title={resource.title}
                  description={resource.description}
                  coverImageUrl={resource.cover_image_url}
                  resourceType={resource.resource_type}
                  tags={resource.tags}
                  onClick={() => handleResourceClick(resource)}
                  isAdmin={isAdmin}
                  onEdit={() => setEditingResource(resource)}
                  onDelete={() => setDeletingResource(resource)}
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

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingResource}
        onOpenChange={(open) => !open && setDeletingResource(null)}
        onConfirm={() => deletingResource && deleteMutation.mutate(deletingResource.id)}
        title="Delete Resource"
        description={`Are you sure you want to delete "${deletingResource?.title}"? This action cannot be undone.`}
        isDeleting={deleteMutation.isPending}
      />
    </ProjectLayout>
  );
};

export default ContentVaultCategory;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, ArrowRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { CategoryCard } from "@/components/content-vault/CategoryCard";
import { PopularResourceItem } from "@/components/content-vault/PopularResourceItem";
import { CategoryEditDialog } from "@/components/content-vault/CategoryEditDialog";
import { VaultHeader } from "@/components/content-vault/VaultHeader";
import { getCategoryIcon } from "@/components/content-vault/categoryIcons";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAdmin } from "@/hooks/useAdmin";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  position: number;
}

interface PopularResource {
  id: string;
  title: string;
  resource_type: string;
  resource_url: string;
  subcategory: {
    name: string;
    category: {
      name: string;
      slug: string;
    };
  };
}

const ContentVault = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const { hasAdminAccess } = useAdmin();
  const canAccessVault = hasAccess('content_vault');
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['content-vault-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_vault_categories')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: canAccessVault,
  });

  // Search resources by title
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['content-vault-search', searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_vault_resources')
        .select(`
          id,
          title,
          resource_type,
          resource_url,
          subcategory:content_vault_subcategories!inner(
            name,
            category:content_vault_categories!inner(name, slug)
          )
        `)
        .ilike('title', `%${searchQuery}%`)
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: canAccessVault && searchQuery.trim().length > 1,
  });

  // Fetch total resource count
  const { data: totalResourceCount } = useQuery({
    queryKey: ['content-vault-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('content_vault_resources')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: canAccessVault,
  });

  // Fetch popular/recent resources with fallback to first resource from each category
  const { data: popularResources, isLoading: popularLoading } = useQuery({
    queryKey: ['content-vault-popular-resources', categories?.map(c => c.id)],
    queryFn: async () => {
      // First, try to get resources sorted by download count
      const { data: topDownloaded, error: topError } = await supabase
        .from('content_vault_resources')
        .select(`
          id,
          title,
          resource_type,
          resource_url,
          download_count,
          subcategory:content_vault_subcategories!inner(
            name,
            category:content_vault_categories!inner(name, slug)
          )
        `)
        .gt('download_count', 0)
        .order('download_count', { ascending: false })
        .limit(5);
      
      if (topError) throw topError;
      
      // If we have 5 popular resources with downloads, use them
      if (topDownloaded && topDownloaded.length >= 5) {
        return topDownloaded;
      }
      
      // Fallback: Get first resource from each of the first 5 categories
      if (!categories || categories.length === 0) {
        return topDownloaded || [];
      }
      
      const first5Categories = categories.slice(0, 5);
      const fallbackPromises = first5Categories.map(async (category) => {
        // First get subcategories for this category
        const { data: subcategories } = await supabase
          .from('content_vault_subcategories')
          .select('id')
          .eq('category_id', category.id);
        
        if (!subcategories || subcategories.length === 0) return null;
        
        const subcategoryIds = subcategories.map(s => s.id);
        
        const { data: firstResource } = await supabase
          .from('content_vault_resources')
          .select(`
            id,
            title,
            resource_type,
            resource_url,
            download_count,
            subcategory:content_vault_subcategories!inner(
              name,
              category:content_vault_categories!inner(name, slug)
            )
          `)
          .in('subcategory_id', subcategoryIds)
          .order('position', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        return firstResource;
      });
      
      const fallbackResults = await Promise.all(fallbackPromises);
      const fallbackResources = fallbackResults.filter(Boolean);
      
      // Combine any downloaded resources with fallback to reach 5
      const combined = [...(topDownloaded || [])];
      const existingIds = new Set(combined.map(r => r.id));
      
      for (const resource of fallbackResources) {
        if (resource && !existingIds.has(resource.id) && combined.length < 5) {
          combined.push(resource);
          existingIds.add(resource.id);
        }
      }
      
      return combined;
    },
    enabled: canAccessVault && !!categories,
  });

  const handleCategoryClick = (slug: string) => {
    navigate(`/content-vault/${slug}`);
  };

  // Show loading state while checking permissions
  if (accessLoading) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <VaultHeader />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </ProjectLayout>
    );
  }

  // Show upgrade prompt for free users
  if (!canAccessVault) {
    return (
      <ProjectLayout>
        <div className="min-h-screen bg-background">
          <VaultHeader />
          <div className="max-w-4xl mx-auto px-6 py-12">
            <UpgradePrompt 
              feature="content_vault" 
              variant="card" 
              customMessage="The Content Vault is a Pro feature. Upgrade to access our library of ready-to-use templates, social media posts, ebooks, planners, and more."
            />
          </div>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <VaultHeader totalResourceCount={totalResourceCount || undefined} />
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchQuery.trim().length > 1 ? (
            /* Search Results Mode */
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Search Results</span>
              </div>
              {searchLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="divide-y divide-border">
                  {searchResults.map((resource) => (
                    <PopularResourceItem
                      key={resource.id}
                      id={resource.id}
                      title={resource.title}
                      categoryName={(resource.subcategory as any).category.name}
                      resourceType={resource.resource_type}
                      resourceUrl={resource.resource_url}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No results found for "{searchQuery}"
                </p>
              )}
            </Card>
          ) : (
            <>
              {/* Categories Grid */}
              {categoriesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (() => {
                const filteredCategories = categories?.filter(cat =>
                  cat.name.toLowerCase().includes(searchQuery.toLowerCase())
                ) ?? [];
                return filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {filteredCategories.map((category) => {
                    const iconConfig = getCategoryIcon(category.slug);
                    return (
                      <CategoryCard
                        key={category.id}
                        name={category.name}
                        icon={iconConfig.icon}
                        iconColor={iconConfig.color}
                        onClick={() => handleCategoryClick(category.slug)}
                        showEditButton={hasAdminAccess}
                        onEditClick={() => setEditingCategory(category)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 mb-8">
                  <p className="text-muted-foreground">No categories available yet.</p>
                </div>
              );
              })()}

              {/* Popular Resources Section */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-foreground">Popular Resources</span>
                </div>
                
                {popularLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : popularResources && popularResources.length > 0 ? (
                  <div className="divide-y divide-border">
                    {popularResources.map((resource) => (
                      <PopularResourceItem
                        key={resource.id}
                        id={resource.id}
                        title={resource.title}
                        categoryName={resource.subcategory.category.name}
                        resourceType={resource.resource_type}
                        resourceUrl={resource.resource_url}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No resources available yet.
                  </p>
                )}
              </Card>
            </>
          )}

          {/* Edit Dialog */}
          {editingCategory && (
            <CategoryEditDialog
              open={!!editingCategory}
              onOpenChange={(open) => !open && setEditingCategory(null)}
              category={editingCategory}
            />
          )}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default ContentVault;

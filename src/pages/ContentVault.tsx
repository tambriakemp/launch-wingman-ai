import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, ArrowRight } from "lucide-react";
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

  // Fetch popular/recent resources
  const { data: popularResources, isLoading: popularLoading } = useQuery({
    queryKey: ['content-vault-popular-resources'],
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
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as unknown as PopularResource[];
    },
    enabled: canAccessVault,
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
          
          {/* Categories Grid */}
          {categoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categories.map((category) => {
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
          )}

          {/* Popular Resources Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-foreground">Popular Resources</span>
              </div>
              <Button 
                variant="link" 
                className="text-muted-foreground hover:text-primary p-0 h-auto"
                onClick={() => navigate('/content-vault/all')}
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
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

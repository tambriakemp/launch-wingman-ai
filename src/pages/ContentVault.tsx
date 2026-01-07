import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { CategoryCard } from "@/components/content-vault/CategoryCard";
import { CategoryEditDialog } from "@/components/content-vault/CategoryEditDialog";
import { VaultHeader } from "@/components/content-vault/VaultHeader";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAdmin } from "@/hooks/useAdmin";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { getVaultThumbnail } from "@/data/vaultThumbnails";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  position: number;
}

const ContentVault = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const { hasAdminAccess } = useAdmin();
  const canAccessVault = hasAccess('content_vault');
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
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
          <VaultHeader />
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  description={category.description}
                  coverImageUrl={category.cover_image_url || getVaultThumbnail(category.slug)}
                  onClick={() => handleCategoryClick(category.slug)}
                  showEditButton={hasAdminAccess}
                  onEditClick={() => setEditingCategory(category)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No categories available yet.</p>
            </div>
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

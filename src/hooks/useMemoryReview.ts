import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MEMORY_LABELS, MEMORY_DESCRIPTIONS, MemoryKey } from "@/types/projectMemory";

export interface MemoryReviewItem {
  id: string;
  memoryKey: MemoryKey;
  label: string;
  description: string;
  needsReview: boolean;
  reviewedAt: string | null;
}

interface UseMemoryReviewOptions {
  projectId: string;
}

export function useMemoryReview({ projectId }: UseMemoryReviewOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all memory items for this project
  const { data: memoryItems, isLoading } = useQuery({
    queryKey: ["project-memory", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_memory")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      if (error) throw error;

      return (data || []).map((item): MemoryReviewItem => ({
        id: item.id,
        memoryKey: item.memory_key as MemoryKey,
        label: MEMORY_LABELS[item.memory_key as MemoryKey] || item.memory_key,
        description: MEMORY_DESCRIPTIONS[item.memory_key as MemoryKey] || "",
        needsReview: item.needs_review,
        reviewedAt: item.reviewed_at,
      }));
    },
    enabled: !!projectId,
  });

  // Get items that need review
  const itemsNeedingReview = memoryItems?.filter((item) => item.needsReview) || [];
  const hasItemsToReview = itemsNeedingReview.length > 0;

  // Mark an item as reviewed
  const markReviewedMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      const { error } = await supabase
        .from("project_memory")
        .update({
          needs_review: false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", memoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-memory", projectId] });
    },
  });

  // Mark all items as reviewed
  const markAllReviewedMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("project_memory")
        .update({
          needs_review: false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .eq("needs_review", true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-memory", projectId] });
    },
  });

  return {
    memoryItems,
    itemsNeedingReview,
    hasItemsToReview,
    isLoading,
    markReviewed: markReviewedMutation.mutateAsync,
    markAllReviewed: markAllReviewedMutation.mutateAsync,
    isMarkingReviewed: markReviewedMutation.isPending || markAllReviewedMutation.isPending,
  };
}

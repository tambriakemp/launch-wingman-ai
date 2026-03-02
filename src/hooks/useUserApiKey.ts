import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserApiKey(service: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-api-key", user?.id, service],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_api_keys")
        .select("id, api_key")
        .eq("service", service)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      // Upsert: delete existing then insert
      await supabase.from("user_api_keys").delete().eq("service", service);
      const { error } = await supabase
        .from("user_api_keys")
        .insert({ user_id: user!.id, service, api_key: apiKey });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-api-key"] }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_api_keys")
        .delete()
        .eq("service", service);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-api-key"] }),
  });

  const maskedKey = query.data?.api_key
    ? `${query.data.api_key.slice(0, 8)}${"•".repeat(20)}`
    : null;

  return {
    hasKey: !!query.data,
    maskedKey,
    isLoading: query.isLoading,
    save: saveMutation.mutateAsync,
    clear: clearMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}

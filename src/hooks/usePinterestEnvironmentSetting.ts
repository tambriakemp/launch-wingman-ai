import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PinterestEnvironment = "production" | "sandbox";

export function usePinterestEnvironmentSetting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: environment = "production" as PinterestEnvironment, isLoading } = useQuery({
    queryKey: ["pinterest-environment-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("value")
        .eq("key", "pinterest_environment")
        .single();
      
      if (error || !data) {
        console.log("[usePinterestEnvironmentSetting] No setting found, defaulting to production");
        return "production" as PinterestEnvironment;
      }
      
      return (data.value === "sandbox" ? "sandbox" : "production") as PinterestEnvironment;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const setEnvironmentMutation = useMutation({
    mutationFn: async (newEnv: PinterestEnvironment) => {
      const { error } = await supabase
        .from("integration_settings")
        .upsert(
          { key: "pinterest_environment", value: newEnv, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      
      if (error) {
        console.error("[usePinterestEnvironmentSetting] Failed to update:", error);
        throw error;
      }
      
      return newEnv;
    },
    onSuccess: (newEnv) => {
      queryClient.setQueryData(["pinterest-environment-setting"], newEnv);
      queryClient.invalidateQueries({ queryKey: ["pinterest-environment-setting"] });
    },
  });

  const setEnvironment = (newEnv: PinterestEnvironment) => {
    setEnvironmentMutation.mutate(newEnv);
  };

  return {
    environment,
    setEnvironment,
    isLoading,
    isSaving: setEnvironmentMutation.isPending,
  };
}

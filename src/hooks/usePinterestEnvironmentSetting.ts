import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PinterestEnvironment = "production" | "sandbox";

export function usePinterestEnvironmentSetting() {
  const queryClient = useQueryClient();

  const { data: environment = "sandbox", isLoading } = useQuery({
    queryKey: ["pinterest-environment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("value")
        .eq("key", "pinterest_environment")
        .single();

      if (error || !data) {
        // Default to sandbox for Trial access apps
        return "sandbox" as PinterestEnvironment;
      }
      return data.value as PinterestEnvironment;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (newEnvironment: PinterestEnvironment) => {
      // Try to update first
      const { data: existing } = await supabase
        .from("integration_settings")
        .select("id")
        .eq("key", "pinterest_environment")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("integration_settings")
          .update({ value: newEnvironment, updated_at: new Date().toISOString() })
          .eq("key", "pinterest_environment");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("integration_settings").insert({
          key: "pinterest_environment",
          value: newEnvironment,
        });
        if (error) throw error;
      }
      return newEnvironment;
    },
    onSuccess: (newEnvironment) => {
      queryClient.setQueryData(["pinterest-environment"], newEnvironment);
    },
  });

  return {
    environment: environment as PinterestEnvironment,
    setEnvironment: mutation.mutate,
    isLoading,
    isSaving: mutation.isPending,
  };
}

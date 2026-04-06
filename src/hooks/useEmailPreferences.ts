import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EmailPreferences {
  id: string;
  product_emails_enabled: boolean;
  check_in_emails_enabled: boolean;
  relaunch_emails_enabled: boolean;
  goal_reminder_emails_enabled: boolean;
}

export function useEmailPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["email-preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as EmailPreferences | null;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Omit<EmailPreferences, "id">>) => {
      if (!user) throw new Error("Not authenticated");

      // Check if preferences exist
      const { data: existing } = await supabase
        .from("email_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("email_preferences")
          .update(updates)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_preferences")
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
    },
  });

  // Default values when no preferences exist
  const effectivePreferences: EmailPreferences = preferences || {
    id: "",
    product_emails_enabled: true,
    check_in_emails_enabled: true,
    relaunch_emails_enabled: true,
    goal_reminder_emails_enabled: true,
  };

  return {
    preferences: effectivePreferences,
    isLoading,
    updatePreferences: updatePreferences.mutateAsync,
    isUpdating: updatePreferences.isPending,
  };
}

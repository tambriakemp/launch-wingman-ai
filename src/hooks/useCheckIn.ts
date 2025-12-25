import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addMonths, addDays, isAfter, parseISO } from "date-fns";

export type CheckInCadence = "monthly" | "quarterly";

export type OrientationChoice = 
  | "continue_current"
  | "revisit_past"
  | "plan_relaunch"
  | "start_new"
  | "not_sure";

interface CheckInPreferences {
  id: string;
  cadence: CheckInCadence;
  snoozed_until: string | null;
  last_check_in_at: string | null;
}

interface CheckIn {
  id: string;
  reflection_prompt: string | null;
  reflection_response: string | null;
  orientation_choice: string | null;
  created_at: string;
}

// Reflection prompts to rotate
const REFLECTION_PROMPTS = [
  "What feels clear right now?",
  "What feels unclear or heavy?",
  "What have you been thinking about lately?",
  "What do you want to work toward next?",
];

export function useCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPrompt, setCurrentPrompt] = useState("");

  // Fetch preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["check-in-preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_in_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as CheckInPreferences | null;
    },
    enabled: !!user,
  });

  // Fetch check-in history
  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!user,
  });

  // Create or update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<CheckInPreferences>) => {
      if (!user) throw new Error("Not authenticated");

      // Try to update first
      const { data: existing } = await supabase
        .from("check_in_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("check_in_preferences")
          .update(updates)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("check_in_preferences")
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in-preferences"] });
    },
  });

  // Submit check-in
  const submitCheckInMutation = useMutation({
    mutationFn: async ({
      reflectionPrompt,
      reflectionResponse,
      orientationChoice,
    }: {
      reflectionPrompt: string;
      reflectionResponse: string;
      orientationChoice: OrientationChoice;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Create the check-in record
      const { error: checkInError } = await supabase
        .from("check_ins")
        .insert({
          user_id: user.id,
          reflection_prompt: reflectionPrompt,
          reflection_response: reflectionResponse || null,
          orientation_choice: orientationChoice,
        });

      if (checkInError) throw checkInError;

      // Update last check-in timestamp
      await updatePreferencesMutation.mutateAsync({
        last_check_in_at: new Date().toISOString(),
        snoozed_until: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["check-in-preferences"] });
    },
  });

  // Snooze check-in
  const snoozeCheckIn = async (days: number = 30) => {
    const snoozeUntil = addDays(new Date(), days);
    await updatePreferencesMutation.mutateAsync({
      snoozed_until: snoozeUntil.toISOString(),
    });
  };

  // Set cadence
  const setCadence = async (cadence: CheckInCadence) => {
    await updatePreferencesMutation.mutateAsync({ cadence });
  };

  // Determine if check-in should be shown
  const shouldShowCheckIn = (): boolean => {
    if (!user) return false;

    // Check if snoozed
    if (preferences?.snoozed_until) {
      const snoozeDate = parseISO(preferences.snoozed_until);
      if (isAfter(snoozeDate, new Date())) {
        return false;
      }
    }

    // Check last check-in date
    const lastCheckIn = preferences?.last_check_in_at
      ? parseISO(preferences.last_check_in_at)
      : null;

    if (!lastCheckIn) {
      // No previous check-in, show after 30 days from account creation
      return true;
    }

    const cadence = preferences?.cadence || "monthly";
    const monthsToAdd = cadence === "quarterly" ? 3 : 1;
    const nextCheckInDue = addMonths(lastCheckIn, monthsToAdd);

    return isAfter(new Date(), nextCheckInDue);
  };

  // Select a prompt on mount (rotate based on check-in count)
  useEffect(() => {
    const promptIndex = checkIns.length % REFLECTION_PROMPTS.length;
    setCurrentPrompt(REFLECTION_PROMPTS[promptIndex]);
  }, [checkIns.length]);

  return {
    preferences,
    checkIns,
    currentPrompt,
    isLoading: isLoadingPreferences,
    shouldShowCheckIn: shouldShowCheckIn(),
    submitCheckIn: submitCheckInMutation.mutateAsync,
    isSubmitting: submitCheckInMutation.isPending,
    snoozeCheckIn,
    setCadence,
    updatePreferences: updatePreferencesMutation.mutateAsync,
  };
}

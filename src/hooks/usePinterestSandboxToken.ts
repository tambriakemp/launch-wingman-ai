import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePinterestSandboxToken() {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase
          .from("integration_settings")
          .select("value")
          .eq("key", "pinterest_sandbox_token")
          .maybeSingle();

        if (error) throw error;
        setToken(data?.value || "");
      } catch (error) {
        console.error("Error fetching Pinterest sandbox token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  const saveToken = async (newToken: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("integration_settings")
        .upsert(
          { key: "pinterest_sandbox_token", value: newToken, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;
      setToken(newToken);
      toast.success("Sandbox token saved");
      return true;
    } catch (error) {
      console.error("Error saving Pinterest sandbox token:", error);
      toast.error("Failed to save sandbox token");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { token, isLoading, isSaving, saveToken };
}

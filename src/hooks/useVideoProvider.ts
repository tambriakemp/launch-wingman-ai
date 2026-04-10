import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVideoProvider() {
  return useQuery({
    queryKey: ["platform-setting", "video_provider"],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("update-platform-settings", {
        body: { action: "get", key: "video_provider" },
      });
      return (data?.value as string) || "fal";
    },
    staleTime: 60_000,
  });
}

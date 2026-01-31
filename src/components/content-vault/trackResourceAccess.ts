import { supabase } from "@/integrations/supabase/client";

/**
 * Track resource access/download for popularity tracking.
 * This function is fire-and-forget - errors are logged but don't block the user.
 */
export const trackResourceAccess = async (resourceId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_resource_download', { 
      resource_id: resourceId 
    });
    
    if (error) {
      console.error('Failed to track resource access:', error);
    }
  } catch (error) {
    console.error('Failed to track resource access:', error);
  }
};

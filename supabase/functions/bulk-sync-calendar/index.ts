import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all planner tasks WITH dates that haven't been synced yet
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, start_at, end_at, due_at")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .neq("column_id", "done");

    if (tasksError || !tasks) {
      return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing sync mappings to skip already-synced tasks
    const { data: existingMappings } = await supabase
      .from("calendar_sync_mappings")
      .select("task_id")
      .eq("user_id", user.id);

    const syncedTaskIds = new Set((existingMappings || []).map((m: any) => m.task_id));
    // Only sync tasks that have at least one date AND aren't already synced
    const unsyncedTasks = tasks
      .filter((t: any) => t.start_at || t.end_at || t.due_at)
      .filter((t: any) => !syncedTaskIds.has(t.id));

    if (unsyncedTasks.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, message: "All tasks already synced" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call sync-calendar-event for each unsynced task
    let synced = 0;
    let failed = 0;

    for (const task of unsyncedTasks) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-calendar-event`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
          },
          body: JSON.stringify({ task_id: task.id, action: "create" }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) synced++;
          else failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced, 
      failed, 
      total: unsyncedTasks.length,
      message: `Synced ${synced} task(s) to your calendar${failed > 0 ? `, ${failed} failed` : ""}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bulk sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

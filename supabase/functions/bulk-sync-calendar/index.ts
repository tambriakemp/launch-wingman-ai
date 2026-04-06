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

    // Get all planner tasks WITH dates (not done)
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

    // Get existing sync mappings to determine create vs update
    const { data: existingMappings } = await supabase
      .from("calendar_sync_mappings")
      .select("task_id")
      .eq("user_id", user.id);

    const syncedTaskIds = new Set((existingMappings || []).map((m: any) => m.task_id));

    // Only sync tasks that have at least one date
    const datedTasks = tasks.filter((t: any) => t.start_at || t.end_at || t.due_at);

    if (datedTasks.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, updated: 0, message: "No dated tasks to sync" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call sync-calendar-event for each dated task — update if already mapped, create if new
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const task of datedTasks) {
      try {
        const action = syncedTaskIds.has(task.id) ? "update" : "create";
        const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-calendar-event`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
          },
          body: JSON.stringify({ task_id: task.id, action }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            if (action === "update") updated++;
            else created++;
          } else {
            failed++;
          }
        } else {
          await res.text(); // consume body
          failed++;
        }
      } catch {
        failed++;
      }
    }

    const total = created + updated;
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} new`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (failed > 0) parts.push(`${failed} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      synced: total,
      created,
      updated,
      failed, 
      total: datedTasks.length,
      message: total > 0 ? `Synced ${parts.join(", ")} task(s)` : "All tasks up to date" + (failed > 0 ? ` (${failed} failed)` : ""),
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

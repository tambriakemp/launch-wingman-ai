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

    // Get all planner tasks WITH dates (not done), including recurrence fields
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, start_at, end_at, due_at, title, recurrence_rule, recurrence_exception_dates")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .neq("column_id", "done");

    if (tasksError || !tasks) {
      return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing sync mappings
    const { data: existingMappings } = await supabase
      .from("calendar_sync_mappings")
      .select("task_id, occurrence_date")
      .eq("user_id", user.id);

    const syncedKeys = new Set(
      (existingMappings || []).map((m: any) => m.occurrence_date ? `${m.task_id}::${m.occurrence_date}` : m.task_id)
    );

    // Only sync tasks that have at least one date OR have a recurrence rule
    const syncableTasks = tasks.filter((t: any) => t.start_at || t.end_at || t.due_at || t.recurrence_rule);
    console.log(`[bulk-sync] Found ${tasks.length} total tasks, ${syncableTasks.length} syncable, ${syncedKeys.size} already mapped`);

    if (syncableTasks.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, updated: 0, message: "No dated tasks to sync" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const task of syncableTasks) {
      try {
        // For recurring tasks, sync-calendar-event will handle expansion internally
        const isAlreadySynced = syncedKeys.has(task.id);
        const action = isAlreadySynced ? "update" : "create";
        
        console.log(`[bulk-sync] Syncing task=${task.id} recurring=${!!task.recurrence_rule} action=${action}`);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-calendar-event`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
          },
          body: JSON.stringify({ task_id: task.id, action }),
        });

        const responseBody = await res.text();
        if (res.ok) {
          try {
            const result = JSON.parse(responseBody);
            if (result.success) {
              const syncedCount = result.synced || 0;
              if (action === "update") updated += syncedCount || 1;
              else created += syncedCount || 1;
            } else { failed++; }
          } catch { failed++; }
        } else { failed++; }
      } catch (err) {
        console.error(`[bulk-sync] Exception for task=${task.id}:`, err);
        failed++;
      }
    }

    const total = created + updated;
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} new`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (failed > 0) parts.push(`${failed} failed`);

    return new Response(JSON.stringify({ 
      success: true, synced: total, created, updated, failed, total: syncableTasks.length,
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

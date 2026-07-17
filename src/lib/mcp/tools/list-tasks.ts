import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description: "List the signed-in user's tasks. Optionally filter by project_id or by due date range.",
  inputSchema: {
    project_id: z.string().uuid().optional().describe("Only return tasks for this project."),
    due_from: z.string().optional().describe("ISO date (YYYY-MM-DD) inclusive lower bound on due_date."),
    due_to: z.string().optional().describe("ISO date (YYYY-MM-DD) inclusive upper bound on due_date."),
    limit: z.number().int().min(1).max(200).optional().describe("Max tasks to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, due_from, due_to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("tasks")
      .select("id, project_id, title, description, due_date, due_at, start_at, end_at, phase, category, priority, column_id, task_type")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(limit ?? 50);
    if (project_id) query = query.eq("project_id", project_id);
    if (due_from) query = query.gte("due_date", due_from);
    if (due_to) query = query.lte("due_date", due_to);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tasks: data ?? [] },
    };
  },
});

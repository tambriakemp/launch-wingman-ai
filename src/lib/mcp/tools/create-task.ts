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
  name: "create_task",
  title: "Create task",
  description: "Create a new task in the signed-in user's planner. Optionally attach to a project and set a due date.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Task title."),
    description: z.string().optional().describe("Optional task description / notes."),
    project_id: z.string().uuid().optional().describe("Attach the task to this project (must belong to the user)."),
    due_date: z.string().optional().describe("Due date as YYYY-MM-DD."),
    priority: z.enum(["low", "medium", "high"]).optional().describe("Task priority."),
    category: z.string().optional().describe("Free-form category label."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, description, project_id, due_date, priority, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const payload: Record<string, unknown> = {
      user_id: ctx.getUserId(),
      title,
      description: description ?? null,
      project_id: project_id ?? null,
      due_date: due_date ?? null,
      priority: priority ?? null,
      category: category ?? "general",
      task_origin: "user",
      task_scope: "planner",
      task_type: "task",
      column_id: "todo",
    };
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .insert(payload)
      .select("id, title, project_id, due_date, priority, category")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created task ${data.id}: ${data.title}` }],
      structuredContent: { task: data },
    };
  },
});

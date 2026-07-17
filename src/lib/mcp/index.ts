import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list-projects";
import listTasksTool from "./tools/list-tasks";
import createTaskTool from "./tools/create-task";

// The OAuth issuer must be the direct Supabase host, not the .lovable.cloud proxy.
// Build it from the project ref (a build-time literal), never from SUPABASE_URL.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "launchely-mcp",
  title: "Launchely",
  version: "0.1.0",
  instructions:
    "Tools for the Launchely / Cre8Visions launch platform. Use list_projects to see the user's launch projects, list_tasks to browse planner tasks, and create_task to add a new task.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjectsTool, listTasksTool, createTaskTool],
});

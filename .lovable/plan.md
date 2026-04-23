
## Add Planner Task tools to the Launchely MCP

Goal: extend the `launchely-prompts` MCP server (and matching REST API) so any user with their personal API key can **create, update, and delete planner tasks** from Claude/ChatGPT, including all calendar fields (dates, times, status, priority, recurrence) and assignment to a Space + Category.

### What you'll see in Claude

Six new tools added to the existing server (no admin gate — every user manages their own planner):

| Tool | Purpose |
|---|---|
| `list_spaces` | List your planner spaces (id, name, color) |
| `list_space_categories` | List categories in a space (or all of them) |
| `list_planner_tasks` | List tasks, filterable by space, status, due-date range, or search |
| `create_planner_task` | Create a new planner task with full field support |
| `update_planner_task` | Edit any field of an existing task |
| `delete_planner_task` | Delete a task by ID |

### Inputs for `create_planner_task`

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Task title |
| `description` | no | Long-form notes |
| `spaceId` **or** `spaceName` | no | Resolved to `space_id`. Defaults to your first space |
| `category` | no | Category name (free text — matches `space_categories.name`) |
| `status` | no | One of `todo` (default), `in-progress`, `in-review`, `done`, `blocked`, `abandoned` |
| `priority` | no | One of `urgent`, `high`, `normal` (default), `low` |
| `dueDate` | no | ISO datetime — for due-only tasks (no calendar block) |
| `startAt` + `endAt` | no | ISO datetimes for scheduled tasks |
| `recurrence` | no | Object: `{ frequency: 'daily'|'weekly'|'monthly'|'yearly', interval?, byDay?, until? }` — stored verbatim in `recurrence_rule` JSONB |
| `location` | no | Free-text location |

`update_planner_task` takes the same fields plus `taskId`. Only provided fields are updated; pass `null` to clear an optional field.

`list_planner_tasks` accepts: `spaceId`, `status`, `dueAfter`, `dueBefore`, `search`, `limit` (default 50, max 200). Returns id, title, status, priority, space, category, dates, recurrence, plus a `planner_url` deep link.

### Server-side behavior

- **Auth**: reuses the existing `authenticate()` helper (personal API key `lw_sk_...` or session JWT). All queries scoped to the caller's `user_id`.
- **Required field defaults** (matches `Planner.tsx` insert path):
  - `task_scope = "planner"`, `task_origin = "user"`, `task_type = "task"`
  - `column_id` defaults to `"todo"`; validated against the 6 status values
  - `priority` defaults to `"normal"`; validated against the 4 values
  - `position = 0`
- **Date semantics** mirror `PlannerTaskDialog`:
  - `startAt + endAt` → scheduled timed task
  - `startAt` only → all-day scheduled (end = start, due = start)
  - `dueDate` only → due-only (no calendar block)
- **`project_id`**: NOT NULL on the table, but planner tasks aren't conceptually tied to a project. Resolved the same way the in-app UI does — pick the user's first project. If the user has no project, return: `"Create a project in Launchely before adding planner tasks via MCP"`.
- **Calendar sync**: after create/update/delete, fires `sync-calendar-event` (background, fire-and-forget) so Google/Outlook/Apple feeds stay in sync — same as the in-app UI.
- **Errors**: friendly messages for invalid status/priority, bad date ranges, unknown space, etc.

### Response shape (create/update)

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "title": "Record podcast intro",
    "status": "todo",
    "priority": "high",
    "space": { "id": "uuid", "name": "Work" },
    "category": "Content",
    "due_at": "2026-04-25T15:00:00Z",
    "start_at": "2026-04-25T15:00:00Z",
    "end_at": "2026-04-25T16:00:00Z",
    "recurrence": null,
    "planner_url": "https://launchely.com/app/planner"
  }
}
```

### REST parity

Same six actions added to `prompts-api/index.ts` so personal-API-key REST clients have identical capabilities.

### Files to change

- `supabase/functions/prompts-mcp/index.ts` — add 6 tool definitions + shared helpers (`resolveSpaceId`, `resolveProjectId`, `validateStatus`, `validatePriority`, `buildDateFields`, `triggerCalendarSync`)
- `supabase/functions/prompts-api/index.ts` — mirror the 6 actions
- `mem://integrations/claude-mcp-and-rest-api` — document new tools

*(No DB migration, no new secrets, no client/UI changes — tasks created via MCP appear instantly in the existing Planner views.)*

### Reconnecting Claude

After deploy: quit + reopen Claude Desktop (or start a fresh chat on claude.ai) and the new tools appear under `launchely-prompts`. Same `lw_sk_...` key, same endpoint — no config change.

### Non-goals (v1)

- **Subtasks** — table exists; happy to add `add_subtask` / `toggle_subtask` later
- **Event-type tasks** — `start_at + end_at` covers calendar blocks; pure events skipped
- **Bulk operations** — single-task only

### Open questions

1. **Subtasks**: include `add_subtask` / `toggle_subtask` now (~40 extra lines), or save for later?
2. **Server name**: keep `launchely-prompts` (no Claude config change) or rename to `launchely` since it's no longer prompts-only?

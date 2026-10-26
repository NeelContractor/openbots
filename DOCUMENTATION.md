# OpenBots Technical Documentation & Architecture Reference

This document describes the architecture, execution lifecycle, monorepo packages, database schema, tool engine, and local operations for this version of OpenBots.

This fork intentionally excludes the reference project's cloud desktop and browser automation stack (Daytona and Browserbase). Agents in this version do not expose browser, VNC, computer-use, or human-in-the-loop desktop tools.

For the product overview, see [README.md](README.md).

---

## 1. System Architecture

OpenBots separates presentation, typed RPC contracts, agent execution, persistence, and external integrations.

```
                              +------------------------------+
                              |      Next.js Web App         |
                              |  App Router / React 19       |
                              |        localhost:3000        |
                              +--------------+---------------+
                                             |
                                 Typed RPC (Hono hc Client)
                                             |
                              +--------------v---------------+
                              |        Hono API Server       |
                              |     (@openbots/api-contract) |
                              |        localhost:3001        |
                              +--------------+---------------+
                                             |
             +-------------------------------+-------------------------------+
             |                                                               |
             v                                                               v
+------------------------------+                               +------------------------------+
|    Direct Agent Executor     |                               |   Trigger.dev v4 Worker      |
|  Interactive chat fast path  |                               | Durable background + cron    |
+--------------+---------------+                               +--------------+---------------+
             |                                                               |
             +-------------------------------+-------------------------------+
                                             |
             +-------------------------------+-------------------------------+
             |                               |                               |
             v                               v                               v
+------------------------------+ +---------------------------+ +-------------------------------+
|        PostgreSQL DB         | | Redis REST / Upstash      | |      External Providers        |
| Agents, runs, schedules,     | | Cross-process event       | | Google AI, OpenAI, Anthropic,  |
| memory, auth, API keys       | | streams and cancellation  | | OpenRouter, Composio, MCP,     |
|                              | |                           | | Supabase Storage, Web Push     |
+------------------------------+ +---------------------------+ +-------------------------------+
```

The marketing site is a separate Next.js app on port `3002`. It shares UI and API client packages but does not participate in agent execution.

### Execution Pathways

1. **Interactive fast path (direct executor)**
   - The API server registers a direct executor at startup.
   - A chat request creates a queued run, then executes it in-process with the Vercel AI SDK `ToolLoopAgent`.
   - Tokens, tool activity, and status changes stream to the browser immediately.
   - Trigger.dev is not required for interactive chat.

2. **Durable background path (Trigger.dev)**
   - Delayed reminders and recurring tasks are dispatched to Trigger.dev.
   - The `agent-run` task executes a run and persists its result.
   - The `scheduled-agent-task` task fires cron schedules, creates a new run, and reuses the same execution engine.
   - Trigger.dev retries are intentionally disabled for agent runs. Run claiming and database status transitions prevent duplicate execution.

---

## 2. Monorepo Structure

Managed with **Bun workspaces** and **Turborepo**.

```
openbots/
├── apps/
│   ├── web/                    # Main product UI (Next.js 16, React 19)
│   ├── marketing/              # Public marketing site (Next.js 16, port 3002)
│   └── api/                    # Hono API server, agent runtime, Trigger.dev tasks
│
├── packages/
│   ├── api-contract/           # Hono routes, Zod schemas, domain logic, event hubs
│   ├── api-client/             # Typed RPC client used by the web and marketing apps
│   ├── db/                     # Drizzle schemas, PostgreSQL client, Redis, storage
│   ├── ui/                     # Shared design system and UI primitives
│   └── typescript-config/      # Shared TypeScript configurations
│
├── docker-compose.yml          # Local Postgres, Redis, and Redis REST proxy
├── DOCUMENTATION.md            # This document
├── README.md                   # Product overview and quick start
└── turbo.json                  # Build, dev, lint, typecheck, and database tasks
```

### Package Roles

- **`@openbots/api-contract`**
  - Declares Hono routes, validation schemas, service logic, SSE streams, and shared event hubs.
  - Owns the API surface consumed by the typed client.
  - Does not contain the agent tool implementations.

- **`@openbots/api-client`**
  - Wraps Hono's `hc<AppType>` client so frontend calls are typed without code generation.

- **`@openbots/db`**
  - Drizzle ORM schemas and PostgreSQL connection.
  - Upstash-compatible Redis client and Supabase Storage helpers.
  - Exposes the shared package entry points used by the API and service layer.

- **`@openbots/ui`**
  - Shared components, design tokens, typography, avatars, and iconography.

- **`@openbots/typescript-config`**
  - Shared Node and Next.js TypeScript configurations.

---

## 3. Technology Stack

| Component | Technology | Version |
| :--- | :--- | :--- |
| Package manager / runtime | Bun | `1.4.0` |
| Web framework | Next.js App Router | `16.4.3` |
| UI runtime | React | `19.3.1` (`19.3.0` in marketing) |
| Styling | Tailwind CSS | `v4` |
| API framework | Hono | `^4.13.13` |
| Agent reasoning | Vercel AI SDK (`ToolLoopAgent`) | `^7.0.153` |
| Background execution | Trigger.dev SDK | `4.8.1` |
| Database ORM | Drizzle ORM | `^0.45.4` |
| Database | PostgreSQL | 17 (local Docker) |
| Redis | Upstash REST client / local REST proxy | `^1.39.0` |
| Authentication | Better Auth | `^1.7.12` |
| File storage | Supabase Storage | `^2.118.0` |
| SaaS integrations | Composio | `^0.27.0` |
| MCP client | `@modelcontextprotocol/client` | `^2.4.0` |
| Linting / formatting | Biome | `2.6.3` |
| TypeScript | TypeScript | `7.0.2` |

---

## 4. Local Development

### Infrastructure

`docker-compose.yml` starts three services:

| Service | Container | Host port | Purpose |
| :--- | :--- | :--- | :--- |
| `postgres` | `openbots-postgres` | `5433` | Application database |
| `redis` | `openbots-redis` | `6379` | Redis backing store |
| `redis-http` | `openbots-redis-http` | `8079` | Upstash-compatible REST API for the app |

The application uses the Upstash REST protocol, not the Redis wire protocol directly. The `redis-http` service adapts the local Redis instance to that protocol.

### Environment loading

The root `.env` is the source of truth. For local development it is symlinked into the workspaces that load their own environment files:

- `apps/api/.env` → `../../.env`
- `apps/web/.env.local` → `../../.env`
- `packages/db/.env` → `../../.env`

Bun loads `apps/api/.env` for the API. Next.js loads `apps/web/.env.local` for the web app. Drizzle Kit loads `packages/db/.env` for database commands.

### Environment variables

**Required to boot**

| Variable | Local value / purpose |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/openbots` |
| `BETTER_AUTH_SECRET` | Random secret used to sign authentication sessions |
| `ENCRYPTION_KEY` | Random key used to encrypt stored provider API keys |
| `BETTER_AUTH_URL` | `http://localhost:3001` |
| `APP_URL` | `http://localhost:3000` — allowed web origin |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |
| `PORT` | `3001` for the API server |

**Local Redis**

| Variable | Local value |
| :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | `http://localhost:8079` |
| `UPSTASH_REDIS_REST_TOKEN` | Token shared with the `redis-http` service |
| `REDIS_HTTP_TOKEN` | Passed to the Docker service via Compose |

**Required for chat**

At least one provider key is required. The default agent model is `google/gemini-2.5-flash`.

| Variable | Purpose |
| :--- | :--- |
| `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic |
| `OPENROUTER_API_KEY` | OpenRouter |
| `GROQ_API_KEY` | Groq |
| `XAI_API_KEY` | xAI |
| `DEEPSEEK_API_KEY` | DeepSeek |

Users can also store encrypted provider keys through the API key settings UI.

**Optional features**

| Variables | Enables |
| :--- | :--- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_STORAGE_BUCKET` | Conversation attachments and generated downloadable files |
| `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` | Durable background runs and recurring schedules |
| `COMPOSIO_API_KEY` | Composio SaaS integrations |
| `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Browser push notifications |

Without Redis, single-process streaming still works through the in-memory event emitters, but cross-process streams and cancellation fall back to process-local behavior. Without Supabase, document uploads and generated file storage fail. Without Trigger.dev, interactive chat works but schedules and background execution do not.

### Commands

```bash
bun install
bun run db:up          # start Postgres, Redis, and the Redis REST proxy
bun run db:push        # apply the current Drizzle schema
bun run dev            # web on :3000, API on :3001, marketing on :3002
```

Optional:

```bash
cd apps/api
bun run trigger:dev    # local Trigger.dev worker for schedules/background runs
```

### Ports

| Service | URL |
| :--- | :--- |
| Web | `http://localhost:3000` |
| API | `http://localhost:3001` |
| API health | `http://localhost:3001/api/health` |
| Marketing | `http://localhost:3002` |
| Postgres | `localhost:5433` |
| Redis REST proxy | `http://localhost:8079` |

---

## 5. Agent Execution Lifecycle

1. A request creates a run and, if needed, a conversation and user message.
2. The run is claimed with an atomic database update from `queued` to `running`. If another worker already claimed it, execution exits.
3. Agent configuration, conversation history, model credentials, enabled tools, connections, and client context are loaded.
4. `resolveModel` selects the provider and decrypts a user-provided key when one exists; otherwise it uses the server environment key.
5. `buildSystemInstructions` injects temporal context, truthfulness rules, scheduling guidance, memory guidance, connected-app context, and documentation for the tools that are actually enabled.
6. `buildAgentTools` assembles dynamic OpenBots tools, internal tools, Composio tools, and MCP tools.
7. `ToolLoopAgent` runs the reasoning loop. Every model and tool step is persisted to `run_steps`.
8. Tool results flow back into the loop until the model produces a final response.
9. The run is finalized with its output, status, completion time, and step count. Errors are sanitized before persistence.
10. Events are published to the run, agent, and workspace streams.

Direct runs have a 10-minute execution timeout. Aborting a run cancels the active controller and marks queued/running runs as cancelled exactly once.

### Prompt assembly

The prompt builder combines:

- The agent's own system instructions.
- Current date, time, timezone, locale, and optional location from the client.
- Scheduled-run behavior when the trigger type is `schedule`.
- Truthfulness and verification rules.
- Tool usage, memory, scheduling, and integration guidance.
- Documentation for enabled tools only.

---

## 6. Streaming and Real-Time Events

There are three event scopes:

- **Run events** — text deltas, tool start/finish, status changes, and completion.
- **Agent events** — run lifecycle, schedule changes, and agent updates.
- **User workspace events** — aggregate activity across an authenticated user's agents.

Each hub publishes to a process-local `EventEmitter` first. If Redis is configured, events are also written to Redis lists with monotonic sequence numbers and a bounded expiry. SSE endpoints replay from the last acknowledged sequence so reconnecting clients do not lose events.

Redis is therefore optional for a single API process, but required for reliable cross-process streaming when the API and Trigger.dev workers run separately.

---

## 7. Tool System

Tool construction lives in `apps/api/src/agent/tools`:

- `internal-registry.ts` — stateless internal tools.
- `builder.ts` — dynamic tools, internal tools, Composio, MCP, and per-agent enable/disable state.
- `prompt-tools.ts` — tool documentation injected into the system prompt.
- `runner.ts` — dispatches shell and code execution to Trigger.dev tasks, or runs them locally during direct execution.

Internal tools are enabled by default unless the agent has an explicit disabled configuration. Dynamic conversation tools are always available. Composio tools are added when `COMPOSIO_API_KEY` is configured. MCP tools are added from enabled `agent_tools` rows whose provider is `mcp`.

### Built-in tools

| Tool | Category | Functionality |
| :--- | :--- | :--- |
| `get_current_time` | Utility | Current time, date, weekday, timezone, and ISO timestamp |
| `calculate` | Utility | Safe arithmetic parser with parentheses, decimals, and powers |
| `generate_uuid` | Utility | UUIDv4 values and random tokens |
| `transform_text` | Utility | Case changes, Base64/URL encoding, slugification, reverse |
| `unit_converter` | Utility | Length, weight, volume, temperature, and digital storage |
| `random_generator` | Utility | Random numbers, choices, dice, coin flips, shuffles |
| `json_parser` | Data | JSON parsing and dot-path extraction |
| `text_analyzer` | Data | Word/character counts, readability, keyword frequency |
| `execute_code` | Compute | Short-lived JavaScript evaluation in a restricted `node:vm` context |
| `bash` | Compute | Shell commands in a temporary working directory |
| `web_search` | Research | DuckDuckGo search results with titles, URLs, and snippets |
| `fetch_web_page` | Research | Readable text extraction from public pages |
| `wikipedia_search` | Research | Wikipedia summaries and article search |
| `http_request` | Integration | REST requests with configurable method, headers, and body |
| `get_weather` | Live data | Current conditions and forecasts |
| `currency_converter` | Live data | Foreign exchange conversion |
| `dns_lookup` | Diagnostics | A, AAAA, MX, TXT, CNAME, and NS records |
| `parse_document` | Documents | Text, tables, and metadata from PDF, DOCX, PPTX, XLSX, CSV, and text |
| `create_downloadable_file` | Documents | Generates and stores PDF, DOCX, XLSX, CSV, text, or code files |
| `create_schedule` | Scheduling | One-off reminders, delays, and timestamped runs |
| `create_recurring_task` | Scheduling | Recurring intervals and cron schedules with timezone support |
| `get_task_history` | Scheduling | Past scheduled run history and outputs |
| `manage_schedule` | Scheduling | List, update, pause, resume, reschedule, or cancel schedules |
| `search_memory` | Memory | Retrieves persistent user and agent facts |
| `save_memory` | Memory | Stores durable facts, preferences, and instructions |
| `delete_memory` | Memory | Removes outdated or incorrect memories |
| `get_chat_history` | Conversation | Reads earlier messages for additional context |
| `react_to_message` | Conversation | Adds an emoji reaction to a message |

### Shell and code execution

- With Trigger.dev, `bash` and `execute_code` run as Trigger tasks with checkpointing and cancellation propagation.
- During direct API execution, they run in-process as a fallback.
- `bash` uses a fresh temporary directory, a restricted environment, a 5-minute maximum, and output redaction. It is not a hardened security boundary.
- `execute_code` uses `node:vm` with no imports, network, or filesystem access and a 5-second timeout. It is intended for trusted transformations, not hostile code.

---

## 8. Artifacts and Activity Presentation

### Interactive artifacts

Agents can emit structured artifacts that render inside the conversation and an expandable side sheet:

- Interactive HTML/CSS previews in a sandboxed frame.
- SVG graphics.
- Mermaid diagrams.
- File artifacts such as PDF, DOCX, XLSX, CSV, Markdown, and code.
- Generated downloadable files stored in Supabase Storage.

The artifact parser and viewers live in `apps/web/modules/artifacts`.

### Human-readable activity stream

`apps/web/modules/runs/activity-stream.ts` converts raw run steps into grouped activity:

- Classifies steps into research, code, document, communication, schedule, data, and action categories.
- Groups adjacent related actions with summaries such as sources analyzed or files created.
- Keeps a sanitized technical trace available through the Details disclosure.
- Redacts keys, tokens, authorization headers, and credentials before display.

---

## 9. Scheduling and Natural-Language Timers

Schedules are stored in PostgreSQL and represented in Trigger.dev by a schedule ID.

- One-off schedules are dispatched as delayed Trigger.dev tasks.
- Recurring schedules use cron expressions and timezone-aware scheduling.
- The natural-language parser infers a cron expression or delay from phrases such as "every weekday at 9am" or "remind me in 30 minutes".
- Timezone conversion helpers normalize the client timezone before persistence.
- If the API server is running, interactive runs bypass Trigger.dev and execute directly.

The schedule API also supports pause, resume, update, delete, and execution history.

---

## 10. Memory and Chat History

### Persistent memory

Memories are stored in the `memories` table and scoped to a user and agent.

- `save_memory` inserts or updates a keyed fact with a category and optional metadata.
- `search_memory` queries stored facts for preferences, project conventions, and prior context.
- `delete_memory` removes outdated facts.
- Memory reads are cached in Redis when available; writes invalidate the relevant cache keys.

### Chat history

`get_chat_history` reads the current conversation from PostgreSQL. Older messages can also be cached in Redis to reduce repeated database work.

---

## 11. Database Schema

Schemas live in `packages/db/src/schemas/`.

| Table | Purpose |
| :--- | :--- |
| `agents` | Name, description, instructions, model, status, autonomy, max steps, owner |
| `agent_tools` | Per-agent tool configuration, provider (`internal`, `composio`, `mcp`), enablement, config |
| `conversations` | User and agent conversation threads |
| `messages` | User/assistant messages with JSON content and attachment metadata |
| `runs` | Execution status, trigger type, input, output, error, timestamps |
| `run_steps` | Model and tool steps with inputs, outputs, timing, and identifiers |
| `schedules` | Prompt, cron expression, timezone, Trigger schedule ID, active/paused status |
| `memories` | Keyed persistent facts, category, metadata, user and agent scope |
| `connections` | External integration accounts and status |
| `user_api_keys` | Encrypted provider keys with IV, auth tag, and key hint |
| `push_subscriptions` | Browser push endpoints and encryption keys |
| `user`, `session`, `account`, `verification` | Better Auth identity and session tables |

### Migrations

```bash
bun run db:push        # recommended for local development
cd packages/db
bun run db:generate    # create a new migration
bun run db:migrate     # apply versioned migrations
bun run db:studio      # open Drizzle Studio
```

Because this fork removed the reference project's `sandbox_id` column from the `agents` schema, use `db:push` for a fresh local database. Older migration files may still contain that column.

---

## 12. API Surface

All routes are mounted under `/api`:

| Route group | Responsibility |
| :--- | :--- |
| `/health` | Liveness check |
| `/auth/*` | Better Auth sign-up, sign-in, sessions, email changes |
| `/agents` | CRUD, tool configuration, models, run creation, SSE streams |
| `/conversations` | Conversation CRUD, message history, attachments |
| `/runs` | Run lookup, cancellation, step history, SSE streams |
| `/schedules` | CRUD, natural-language creation, pause/resume, streams |
| `/tasks` | Extraction of actionable tasks from conversations |
| `/memories` | Memory CRUD and cache invalidation |
| `/connections` | Composio connection management |
| `/notifications` | Web Push subscription and VAPID key delivery |
| `/api-keys` | Encrypted provider key storage and validation |

The client uses `packages/api-client` to call these routes with end-to-end TypeScript types.

---

## 13. Security and Operational Notes

- **Atomic run claiming** prevents two workers from executing the same run.
- **Tenant isolation** is enforced with user-scoped foreign keys and ownership checks.
- **Provider keys** are encrypted at rest with `ENCRYPTION_KEY`; the API returns only hints, never plaintext.
- **Trace sanitization** redacts secrets from stored and displayed tool output.
- **Prompt injection defense** is instructed in the system prompt: tool output and fetched pages are treated as untrusted data.
- **Only `NEXT_PUBLIC_*` values** are exposed to the browser. Server credentials must never use that prefix.
- **Direct shell execution** is a development convenience, not a secure sandbox. Run untrusted workloads through a controlled Trigger.dev environment or a dedicated sandbox service.
- **Supabase Storage** is required for uploaded attachments and generated downloadable files. The configured bucket must be public because the app uses public URLs for previews.
- **Redis** is optional for single-process local use, but recommended for multi-process streaming and cancellation.
- **Trigger.dev** is optional for interactive chat, but required for durable schedules and background tasks.

---

## 14. Development Commands

| Task | Command |
| :--- | :--- |
| Start local infrastructure | `bun run db:up` |
| Stop local infrastructure | `bun run db:down` |
| Push database schema | `bun run db:push` |
| Run web, API, and marketing | `bun run dev` |
| Build all apps and packages | `bun run build` |
| Type check | `bun run typecheck` |
| Lint | `bun run lint` |
| Format with Biome | `bun run format` |
| Lint and format | `bun run check` |
| Trigger.dev local worker | `cd apps/api && bun run trigger:dev` |

### Troubleshooting

- **API port already in use**: stop the existing process on `3001` or change `PORT`.
- **Database connection refused**: confirm `docker compose ps` shows `openbots-postgres` as healthy.
- **Redis errors**: confirm `openbots-redis-http` is running and the token matches `UPSTASH_REDIS_REST_TOKEN`.
- **Chat fails with no provider configured**: add `GEMINI_API_KEY` or another provider key.
- **File tools fail**: configure Supabase Storage and create or make public the `conversation-attachments` bucket.
- **Schedules do not fire**: run the Trigger.dev worker and set `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_REF`.

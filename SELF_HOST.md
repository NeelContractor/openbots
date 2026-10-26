# Self-Hosting OpenBots

A practical guide to running this version of OpenBots locally, on a VPS, or on bare-metal infrastructure.

This fork excludes the reference project's Daytona and Browserbase desktop/browser stack. There are no cloud desktop, VNC, computer-use, HITL, or hosted browser services to configure.

---

## Architecture Overview

A self-hosted deployment consists of:

1. **Web frontend (`apps/web`)** — Next.js 16 product UI, default port `3000`.
2. **Marketing site (`apps/marketing`)** — optional Next.js 16 site, default port `3002`.
3. **API server (`apps/api`)** — Bun + Hono HTTP service and interactive agent executor, default port `3001`.
4. **PostgreSQL** — agents, conversations, runs, steps, schedules, memories, auth, and API keys.
5. **Redis REST endpoint** — cross-process event streaming and cancellation. Either Upstash or the included local Redis REST proxy.
6. **Supabase Storage** — optional; required for attachments and generated downloadable files.
7. **Trigger.dev v4** — optional; required for durable scheduled and background runs.
8. **External providers** — AI model APIs, Composio, MCP servers, and Web Push.

Interactive chat works without Trigger.dev. Scheduling and background execution require it.

---

## 1. Prerequisites

### Hardware

- **Minimum:** 2 vCPU, 2 GB RAM, 10 GB disk
- **Recommended:** 4 vCPU, 8 GB RAM, 25 GB SSD

Next.js builds and `pdfjs-dist`/document tooling can be memory-hungry. If the build runs out of memory, add swap or build on a larger machine.

### Software

- **Bun** `1.4.0` (pinned in `package.json`)
- **Node.js** `>= 20.9.0` (required by Next.js and workspace tooling)
- **Docker** with Compose v2 (for the included PostgreSQL/Redis stack)
- **Git**

Verify:

```bash
bun --version
node --version
docker compose version
```

---

## 2. Infrastructure Setup

### A. PostgreSQL

The included Compose file starts PostgreSQL 17 on host port `5433`:

```bash
bun run db:up
```

Connection string:

```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/openbots
```

For production, change the Compose password or use a managed PostgreSQL provider such as Neon, Supabase, Railway, or RDS. Do not expose port `5433` publicly.

### B. Redis

OpenBots uses the Upstash REST client, not the Redis wire protocol directly. The Compose stack includes a local REST adapter:

- Redis: `localhost:6379`
- Upstash-compatible REST endpoint: `http://localhost:8079`

Local variables:

```ini
REDIS_HTTP_TOKEN=replace-with-a-long-random-token
UPSTASH_REDIS_REST_URL=http://localhost:8079
UPSTASH_REDIS_REST_TOKEN=replace-with-the-same-token
```

The Compose service reads `REDIS_HTTP_TOKEN` and passes it to the adapter. The application reads the two `UPSTASH_*` variables.

For production, prefer [Upstash Redis](https://upstash.com/) or place the local Redis REST adapter on a private network with a strong token. Do not expose port `8079` to the public internet.

Redis is optional for a single API process because the app has process-local event emitters. It is required for reliable cross-process streaming when the API and Trigger.dev workers run separately.

### C. Supabase Storage (Optional)

Attachments and generated files require Supabase Storage:

1. Create a project at [supabase.com](https://supabase.com) or self-host Supabase.
2. Create a bucket named `conversation-attachments`.
3. Make the bucket public. The app renders public URLs for file previews.
4. Copy the project URL and service role key.

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=conversation-attachments
```

The service role key is server-only. Never expose it through a `NEXT_PUBLIC_*` variable.

### D. AI Providers

At least one provider key is required to chat. The default model is `google/gemini-2.5-flash`.

```ini
GEMINI_API_KEY=...
```

Google AI Studio offers a free tier. Optional providers:

```ini
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
GROQ_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=
```

Users can also store encrypted provider keys through the settings UI.

### E. Trigger.dev (Optional)

Required for delayed reminders, recurring tasks, and durable background execution:

1. Create a project at [trigger.dev](https://trigger.dev) or self-host Trigger.dev v4.
2. Copy the project ref and a development or production secret key.

```ini
TRIGGER_PROJECT_REF=proj_...
TRIGGER_SECRET_KEY=tr_dev_...
```

Interactive chat still works without these values because the API registers a direct in-process executor.

### F. Composio (Optional)

Enables SaaS integrations such as Gmail, Slack, GitHub, Notion, and Linear:

```ini
COMPOSIO_API_KEY=
```

Custom MCP servers can be enabled per agent after configuring an MCP tool entry.

### G. Web Push (Optional)

Generate VAPID keys:

```bash
bunx web-push generate-vapid-keys
```

Then set:

```ini
VAPID_SUBJECT=mailto:admin@your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...
VAPID_PRIVATE_KEY=...
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is embedded into the browser bundle at build time. Set it before running `bun run build`.

---

## 3. Installation and Configuration

### Step 1: Install dependencies

```bash
git clone https://github.com/NeelContractor/openbots
cd openbots
bun install
```

### Step 2: Create the environment file

```bash
cp .env.example .env
```

Generate secrets:

```bash
openssl rand -hex 32   # BETTER_AUTH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
openssl rand -hex 24   # REDIS_HTTP_TOKEN
```

For local development, the repository expects the root `.env` to be available to each workspace:

```bash
ln -sfn ../../.env apps/api/.env
ln -sfn ../../.env apps/web/.env.local
ln -sfn ../../.env packages/db/.env
```

For production, avoid symlinking secrets if your process manager can inject environment variables directly. If you use files, ensure each app has its own permissions and that `.env` is never committed.

### Step 3: Complete the environment

Minimum configuration:

```ini
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/openbots

# Authentication and encryption
BETTER_AUTH_SECRET=...
ENCRYPTION_KEY=...
BETTER_AUTH_URL=http://localhost:3001
APP_URL=http://localhost:3000

# API and web
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Redis
REDIS_HTTP_TOKEN=...
UPSTASH_REDIS_REST_URL=http://localhost:8079
UPSTASH_REDIS_REST_TOKEN=...

# AI
GEMINI_API_KEY=...

# Optional integrations
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_STORAGE_BUCKET=conversation-attachments
TRIGGER_PROJECT_REF=
TRIGGER_SECRET_KEY=
COMPOSIO_API_KEY=

# Optional Web Push
VAPID_SUBJECT=mailto:admin@your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

For a real domain, replace the localhost values:

```ini
APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
BETTER_AUTH_URL=https://api.your-domain.com
```

`APP_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_API_URL` are included in Better Auth trusted origins and CORS checks.

---

## 4. Initialize the Database

Start infrastructure and push the current Drizzle schema:

```bash
bun run db:up
bun run db:push
```

`db:push` is recommended for a fresh local database. The historical migration directory may still contain the removed `sandbox_id` column from the reference project. For versioned production deployments, generate and review a new migration before applying it.

Inspect data visually:

```bash
cd packages/db
bun run db:studio
```

---

## 5. Run Locally

```bash
bun run dev
```

| Service | URL |
| :--- | :--- |
| Web | `http://localhost:3000` |
| API | `http://localhost:3001` |
| API health | `http://localhost:3001/api/health` |
| Marketing | `http://localhost:3002` |

For local schedules and background tasks, run the Trigger.dev worker in a second terminal:

```bash
cd apps/api
bun run trigger:dev
```

---

## 6. Production Deployment

### Build

Set production environment variables first, especially `NEXT_PUBLIC_*`, then build:

```bash
bun install
bun run build
```

The build produces:

- `apps/api/dist/index.js` — bundled API server
- `apps/web/.next` — Next.js production output
- `apps/marketing/.next` — optional marketing output

### Run the API

```bash
cd apps/api
bun run start
```

The API loads environment variables from its working directory. If you do not use a process manager with env injection, create `apps/api/.env`.

### Run the web app

```bash
cd apps/web
bun run start
```

Web must have `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` available at build time. Server secrets such as `BETTER_AUTH_SECRET`, `DATABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` should also be present at runtime.

### Run the marketing site

```bash
cd apps/marketing
bunx next start -p 3002
```

The marketing site is optional for the product itself.

### Deploy Trigger.dev tasks

```bash
cd apps/api
bun run trigger:deploy
```

Trigger.dev tasks need access to the same database, Redis, AI provider keys, and Supabase credentials as the API.

### Process manager example

Using PM2:

```bash
pm2 start "bun run start" --name openbots-api --cwd apps/api
pm2 start "bun run start" --name openbots-web --cwd apps/web
pm2 start "bunx next start -p 3002" --name openbots-marketing --cwd apps/marketing
```

Use `pm2 save` and `pm2 startup` if you want PM2 to survive reboots.

---

## 7. Reverse Proxy and TLS

Terminate TLS with Caddy, Nginx, or a cloud load balancer.

### Caddy

Caddy handles certificates automatically:

```caddy
your-domain.com {
    reverse_proxy localhost:3000
}

api.your-domain.com {
    reverse_proxy localhost:3001
}
```

### Nginx

```nginx
server {
    server_name your-domain.com;
    listen 443 ssl http2;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name api.your-domain.com;
    listen 443 ssl http2;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streams must not be buffered
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        add_header X-Accel-Buffering no;
    }
}
```

Streaming endpoints use Server-Sent Events. Buffering proxies can make agent responses appear frozen.

---

## 8. Health Checks and Verification

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

Verify the web app:

```bash
curl -I http://localhost:3000
```

Verify PostgreSQL:

```bash
docker compose ps
docker exec openbots-postgres psql -U postgres -d openbots -c "select 1;"
```

Verify the Redis REST adapter:

```bash
curl -s -X POST http://localhost:8079/ \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["SET","openbots:health","ok"]'
```

Then create an account in the UI and run a short agent prompt. A successful run confirms the database, authentication, model key, and streaming pipeline.

---

## 9. Backups and Maintenance

### PostgreSQL

Back up with Docker:

```bash
docker exec openbots-postgres pg_dump -U postgres -d openbots -F c \
  -f /tmp/openbots_$(date +%Y%m%d_%H%M%S).dump
docker cp openbots-postgres:/tmp/openbots_YYYYMMDD_HHMMSS.dump ./backups/
```

Restore:

```bash
docker cp ./backups/openbots_backup.dump openbots-postgres:/tmp/
docker exec openbots-postgres pg_restore -U postgres -d openbots -v /tmp/openbots_backup.dump
```

For managed PostgreSQL, use the provider's automated backups and point-in-time recovery.

### Redis

Redis here is ephemeral event/coordination storage. Losing it does not lose agents, runs, conversations, or schedules, though active streams may disconnect and reconnecting clients may miss buffered events.

### Upgrades

```bash
git pull
bun install
bun run db:push
bun run build
pm2 restart all
```

Always back up PostgreSQL before applying schema changes. Review generated migrations rather than relying on `db:push` in a production environment.

---

## 10. Operational Notes

- **Run ownership:** direct API runs claim the run atomically before execution. Do not run multiple API instances against the same database without Redis and a plan for coordinating streams.
- **Trigger.dev:** scheduled runs are created by Trigger tasks and executed through the same agent engine. Trigger retries are disabled for agent runs to avoid duplicate side effects.
- **Shell tools:** `bash` is not a hardened sandbox. It executes in a temporary directory with a restricted environment, but on the API host during direct execution. Use a controlled Trigger runtime or an external sandbox for untrusted work.
- **File tools:** attachment uploads and generated downloadable files fail without Supabase Storage. The bucket must be public for preview URLs.
- **Authentication:** set `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` to long random values. Changing `ENCRYPTION_KEY` makes existing encrypted provider keys unreadable.
- **CORS and auth origins:** production domains must be present in `APP_URL` or `NEXT_PUBLIC_APP_URL`; localhost origins are also trusted for development.
- **Web Push:** VAPID public keys are build-time public values. The private key stays server-side.
- **No desktop/browser services:** this fork has no Daytona, Browserbase, VNC, HITL, or desktop sandbox integration.

---

## Need Help?

- [DOCUMENTATION.md](DOCUMENTATION.md) — architecture, execution lifecycle, tools, schema, and API surface.
- [README.md](README.md) — product overview and quick start.
- Open an issue on the repository for deployment-specific problems.

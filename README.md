# Forge Pipeline

Internal tool for generating and hosting client websites (insurance agencies, local service businesses). Scrape an existing site → extract data with AI → generate content → preview → publish — all from one admin dashboard, served from one multi-tenant runtime.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   sites-admin (Next.js :3000)                    │
│  Create projects · Run pipeline · Manage sites · Manage domains  │
└──────────────┬───────────────────────────────────────────────────┘
               │ API routes enqueue BullMQ jobs
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Worker (BullMQ via Redis)                            │
│  scrape · extract · detect-missing · generate-copy · gen-config  │
└──────────────┬───────────────────────────────────────────────────┘
               │ Reads/writes Postgres via Prisma
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL (via Prisma)                              │
│  Sites · Domains · Projects · ScrapedPages · ProjectData         │
│  FormSubmissions                                                 │
└──────────────┬───────────────────────────────────────────────────┘
               │ sites-runtime reads Site.previewConfig / liveConfig
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              sites-runtime (Next.js :3001)                       │
│  Multi-tenant: hostname → Site lookup → render config            │
│  Serves ALL client sites from one process                        │
│  Feature-flagged backend (contact forms, lead capture)           │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Multi-Tenant Runtime
One Next.js app serves **all** client websites. When a request comes in:
1. Middleware passes the hostname to server components
2. Server component looks up the hostname in the `domains` table
3. If no custom domain match, tries slug-based subdomain resolution
4. Loads the site's config JSON from Postgres
5. Renders the template with that config

No separate deployment per client.

### Site Types
- **STATIC** — Pure static site, no backend features
- **STATIC_PLUS** — Static pages + contact forms, quote requests, lead capture

### Pipeline Flow
```
CREATE → SCRAPING → EXTRACTED → DETECT MISSING → READY_TO_GENERATE → GENERATING → PREVIEW_READY → APPROVED
```

### Preview vs Production
- **Pipeline generates config** → saved to `Site.previewConfig` → viewable at `/preview/{slug}` on the runtime
- **Approve** → copies config to `Site.liveConfig` → served on the site's custom domain(s)

## Project Structure

```
forge-pipeline/
├── apps/
│   ├── admin/            # Internal admin dashboard (port 3000)
│   │   └── src/app/      # Next.js App Router
│   │       ├── api/      # Project CRUD, pipeline actions, domain management
│   │       └── projects/ # UI pages
│   └── runtime/          # Multi-tenant site server (port 3001)
│       └── src/
│           ├── app/      # Main page (hostname routing) + /preview/[slug]
│           ├── components/  # Site renderer + section components
│           └── lib/      # Site resolution helpers
├── packages/
│   └── core/             # Shared business logic
│       ├── prisma/       # Database schema
│       └── src/
│           ├── ai/       # LLM extraction + generation
│           ├── db/       # Prisma client
│           ├── jobs/     # BullMQ queues + workers
│           ├── pipeline/ # Status state machine
│           ├── scraper/  # Playwright web scraper
│           └── sites/    # Multi-tenant site resolution
├── scripts/
│   └── worker.ts         # BullMQ worker process
└── .env                  # Environment variables (gitignored)
```

## Setup (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Redis running locally
- Playwright browsers

### Install

```bash
cd forge-pipeline
npm install
npx playwright install chromium
```

### Configure

```bash
cp .env.example .env
# Edit .env — add your API keys and database URL
```

### Database

```bash
npm run db:push       # Create/update tables
npm run db:generate   # Generate Prisma client
```

### Run (3 terminals)

```bash
# Terminal 1 — Admin UI
npm run dev:admin     # http://localhost:3000

# Terminal 2 — Site Runtime
npm run dev:runtime   # http://localhost:3001

# Terminal 3 — Background Workers
npm run worker
```

## Usage

### 1. Create a Project
Go to http://localhost:3000 → **New Project**. Fill in:
- Client name and contact info
- **Site Type** (Static or Static + Backend)
- **Template Family** (Insurance Agency, Local Service, Professional Services)
- **Feature flags** (contact form, quote request, lead capture)
- Optional notes

This creates both a **Site** (the tenant entity) and a **Project** (the pipeline run).

### 2. Run the Pipeline
On the project detail page, click buttons in order:
1. **Run Scrape** — crawls up to 10 pages via Playwright
2. **Run Extraction** — LLM extracts structured business data
3. **Detect Missing Info** — checks for critical missing fields
4. **Generate Content** — LLM generates website copy
5. The pipeline automatically generates the site config and publishes to preview

### 3. Preview
Once the pipeline completes to PREVIEW_READY, click **Open Preview** on the project detail page. This opens the site on the runtime at `/preview/{slug}`.

### 4. Approve / Publish
Click **Mark Approved** to copy the preview config to production (`Site.liveConfig`). The site is now live on any custom domains you've configured.

### 5. Custom Domains
Add domains via the API: `POST /api/sites/{siteId}/domains` with `{ "hostname": "www.example.com", "isPrimary": true }`.

On Railway, add the same custom domain to the `sites-runtime` service.

## Railway Deployment

### Service Layout (One Railway Project)

| Service | Source | Root Dir | Build Command | Start Command |
|---------|--------|----------|---------------|---------------|
| **sites-admin** | Same repo | `/` | `npm run build:admin` | `npm run start:admin` |
| **sites-runtime** | Same repo | `/` | `npm run build:runtime` | `npm run start:runtime` |
| **worker** | Same repo | `/` | `npm install` | `npm run worker` |
| **postgres** | Railway plugin | — | — | — |
| **redis** | Railway plugin | — | — | — |

### Environment Variables

**Shared (all services):**
| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Railway Postgres (auto-injected via reference variable) |
| `REDIS_URL` | Railway Redis (auto-injected via reference variable) |
| `ANTHROPIC_API_KEY` | Your API key |
| `AI_PROVIDER` | `"anthropic"` |

**sites-admin only:**
| Variable | Value |
|----------|-------|
| `RUNTIME_URL` | Internal or public URL of sites-runtime service |

**sites-runtime only:**
| Variable | Value |
|----------|-------|
| `PORT` | Auto-set by Railway |

### Deploy Steps

1. Push repo to GitHub
2. Create a new Railway project
3. Add **PostgreSQL** and **Redis** plugins
4. Add three services from the same repo:
   - `sites-admin` — set root dir `/`, build `npm run build:admin`, start `npm run start:admin`
   - `sites-runtime` — set root dir `/`, build `npm run build:runtime`, start `npm run start:runtime`
   - `worker` — set root dir `/`, build `npm install`, start `npm run worker`
5. Set env vars on each service (DATABASE_URL and REDIS_URL via Railway reference variables)
6. Add `ANTHROPIC_API_KEY` to all services
7. Set `RUNTIME_URL` on sites-admin to the sites-runtime URL
8. Deploy

### Custom Domains

For production client sites:
1. Add the domain to `sites-runtime` service in Railway (Settings → Custom Domains)
2. Add the same domain to the `Domain` table via admin API
3. Client sets DNS CNAME to the Railway-provided target

### Preview Domains

Preview is accessible at `{sites-runtime-url}/preview/{site-slug}`. No DNS config needed.

## Database

Browse data directly:
```bash
npm run db:studio
```

## AI Provider

Set `AI_PROVIDER` in your `.env`:
- `"anthropic"` — uses Claude Sonnet
- `"openai"` — uses GPT-4o

# Halketon — Repo Setup Runbook

**Goal:** scaffold the shared repo skeleton so all 4 devs start from the exact same base — folder structure + important files (as placeholders) + real config files. **No feature templates** (no ingest/agent/pipeline logic) — those are implemented during the hackathon, against `ARCHITECTURE.md` and the per-feature specs.

**Who runs this:** the repo lead, **once**, on day 0. Then commit + push; everyone clones.

**Conventions:** every placeholder code file carries a header comment pointing to its contract section in `ARCHITECTURE.md`. Config files (deps, drizzle, vercel, env example) get **real content** — they are the shared base. Page/route files are minimal stubs so `pnpm dev` builds immediately.

> The **capture source** (how messages get in) is intentionally **not** part of this scaffold — the app just exposes a source-agnostic `POST /api/ingest`. Whatever reads WhatsApp (the Chrome extension reader, paste/import, etc.) is a separate workspace/spec and doesn't block the repo base.

> Commands below use **PowerShell** (the lead is on Windows). A teammate setting up on macOS/Linux can run the same `pnpm` commands; ask for a bash version of the scaffold block in §4 if needed.

---

## 0) Prerequisites

- **Node 20+** and **pnpm** (`npm i -g pnpm`)
- **git** + an empty GitHub repo created
- Accounts / keys ready (don't block setup, but you'll need them to run):
  - **Supabase** project → grab BOTH connection strings from *Connect*:
    - Transaction pooler `:6543` → `DATABASE_URL`
    - Session pooler `:5432` → `MIGRATION_DATABASE_URL`
  - **Vercel** account (project linked later)
  - **Anthropic API key** (`ANTHROPIC_API_KEY`); OpenAI key optional (audio)
  - An `INGEST_API_KEY` value (any strong random string — the capture source presents it)

---

## 1) Scaffold the Next.js app

```powershell
pnpm create next-app@latest halketon --ts --app --tailwind --src-dir --import-alias "@/*" --eslint --use-pnpm
```
Accept defaults when prompted (App Router; Turbopack optional). Then:
```powershell
cd halketon
```

---

## 2) Install dependencies

```powershell
# runtime
pnpm add drizzle-orm postgres @anthropic-ai/sdk zod @t3-oss/env-nextjs server-only
# dev
pnpm add -D drizzle-kit
# optional (only if used)
pnpm add openai zod-to-json-schema
```
- `postgres` is the **postgres-js** driver (import from `drizzle-orm/postgres-js`).
- Initialize **shadcn/ui** (Tailwind v4 compatible):
  ```powershell
  pnpm dlx shadcn@latest init
  ```
  > shadcn creates `src/lib/utils.ts` (the `cn` helper). Keep it. Our `src/lib/utils/` folder holds `dates.ts` / `ids.ts` only.

---

## 3) Copy the architecture doc into the repo

Copy `ARCHITECTURE.md` to the repo root. It is the source of truth every placeholder points to.

---

## 4) Scaffold folders + placeholder files

Run this PowerShell block **from the repo root** (`halketon/`). It creates the full tree from architecture §5, with header-comment placeholders for code files, minimal stubs for pages/routes, and `.gitkeep` for empty dirs.

```powershell
$ErrorActionPreference = "Stop"

# --- directories ---
$dirs = @(
  "src/app/(dashboard)/tasks","src/app/(dashboard)/people","src/app/(dashboard)/decisions",
  "src/app/(dashboard)/groups","src/app/(dashboard)/activity","src/app/(dashboard)/settings",
  "src/app/api/ingest","src/app/api/pipeline/process-pending",
  "src/app/api/groups/[id]/authorize","src/app/api/history/import",
  "src/services/ingestion","src/services/pipeline","src/services/agents",
  "src/services/commands","src/services/tasks","src/services/groups",
  "src/repositories/messages","src/repositories/tasks","src/repositories/decisions",
  "src/repositories/memory","src/repositories/groups","src/repositories/runs",
  "src/repositories/claude","src/repositories/transcription",
  "src/db/schema","src/types",
  "src/exceptions/base","src/exceptions/pipeline","src/exceptions/external","src/exceptions/validation",
  "src/lib/handlers","src/lib/claude","src/lib/ingest","src/lib/openai","src/lib/utils",
  "src/components/dashboard","src/components/ui",
  "drizzle"
)
$dirs | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

# --- placeholder code files (header comment only; see architecture for the contract) ---
$placeholders = @(
  "src/services/ingestion/ingestion.service.ts",
  "src/services/ingestion/history-import.service.ts",
  "src/services/pipeline/pipeline.service.ts",
  "src/services/pipeline/normalizer.ts",
  "src/services/pipeline/batch-builder.ts",
  "src/services/pipeline/state-manager.ts",
  "src/services/agents/extraction.agent.ts",
  "src/services/agents/reconciliation.agent.ts",
  "src/services/agents/memory.agent.ts",
  "src/services/commands/commands.service.ts",
  "src/services/tasks/tasks.service.ts",
  "src/services/groups/groups.service.ts",
  "src/repositories/messages/messages.repository.ts",
  "src/repositories/tasks/tasks.repository.ts",
  "src/repositories/decisions/decisions.repository.ts",
  "src/repositories/memory/memory.repository.ts",
  "src/repositories/groups/groups.repository.ts",
  "src/repositories/runs/agent-runs.repository.ts",
  "src/repositories/claude/claude.repository.ts",
  "src/repositories/transcription/transcription.repository.ts",
  "src/db/index.ts",
  "src/db/schema/index.ts",
  "src/db/schema/organizations.ts",
  "src/db/schema/groups.ts",
  "src/db/schema/users.ts",
  "src/db/schema/messages.ts",
  "src/db/schema/tasks.ts",
  "src/db/schema/decisions.ts",
  "src/db/schema/memory.ts",
  "src/db/schema/embeddings.ts",
  "src/db/schema/runs.ts",
  "src/db/schema/relations.ts",
  "src/exceptions/base/base-exceptions.ts",
  "src/exceptions/pipeline/pipeline-exceptions.ts",
  "src/exceptions/external/external-exceptions.ts",
  "src/exceptions/validation/validation-exceptions.ts",
  "src/lib/handlers/route-handler.ts",
  "src/lib/handlers/http-error-mapper.ts",
  "src/lib/env.ts",
  "src/lib/claude/client.ts",
  "src/lib/ingest/types.ts",
  "src/lib/openai/client.ts",
  "src/lib/utils/dates.ts",
  "src/lib/utils/ids.ts"
)
foreach ($f in $placeholders) {
  "// $f`n// Halketon placeholder — see ARCHITECTURE.md for the contract. TODO: implement.`n" |
    Set-Content -Path $f -Encoding utf8
}

# --- route stubs (must export a method so Next builds). method per architecture §4.1 ---
$routes = @{
  "src/app/api/ingest/route.ts"                   = "POST"
  "src/app/api/pipeline/process-pending/route.ts" = "POST"
  "src/app/api/groups/[id]/authorize/route.ts"    = "POST"
  "src/app/api/history/import/route.ts"           = "POST"
}
foreach ($r in $routes.GetEnumerator()) {
  "// $($r.Key) — see ARCHITECTURE.md. TODO: implement.`nexport async function $($r.Value)() {`n  return new Response('Not implemented', { status: 501 })`n}`n" |
    Set-Content -Path $r.Key -Encoding utf8
}

# --- dashboard page stubs (so the app renders; see architecture §17) ---
$pages = @(
  "src/app/(dashboard)/page.tsx",
  "src/app/(dashboard)/tasks/page.tsx",
  "src/app/(dashboard)/people/page.tsx",
  "src/app/(dashboard)/decisions/page.tsx",
  "src/app/(dashboard)/groups/page.tsx",
  "src/app/(dashboard)/activity/page.tsx",
  "src/app/(dashboard)/settings/page.tsx"
)
foreach ($p in $pages) {
  "// $p — see ARCHITECTURE.md §17. TODO: implement.`nexport default function Page() {`n  return <main className=`"p-8`">TODO: $p</main>`n}`n" |
    Set-Content -Path $p -Encoding utf8
}

# --- keep otherwise-empty dirs in git ---
"" | Set-Content "src/types/.gitkeep"
"" | Set-Content "src/components/dashboard/.gitkeep"

Write-Host "Scaffold complete."
```

---

## 5) Config files (real content — the shared base)

Create these with the content below.

### `drizzle.config.ts` (repo root)
```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  // SESSION pooler (5432) for migrations — NOT the 6543 tx pooler, NOT the direct (IPv6) URL
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL! },
})
```

### `vercel.json` (repo root)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
```
> Scheduling is **Supabase pg_cron** by default (architecture §14) — no `crons` block needed. Only add a `crons` entry here if you confirm a **Vercel Pro** plan (Hobby is limited to once/day and would fail deployment).

### `.env.example` (repo root)
```bash
# --- Next.js app (Vercel) ---
DATABASE_URL=                 # Supabase TX pooler :6543  (runtime; use prepare:false + max:1)
MIGRATION_DATABASE_URL=       # Supabase session pooler :5432  (drizzle-kit only)
SUPABASE_SERVICE_ROLE_KEY=    # server only
NEXT_PUBLIC_SUPABASE_URL=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=               # optional (audio transcription); declare .optional() in env.ts
INGEST_API_KEY=               # capture sources present this (Bearer) to POST /api/ingest
CRON_SECRET=                  # guards /api/pipeline/process-pending
```

---

## 6) gitignore + housekeeping

`create-next-app` already ignores `.env*` and `node_modules`. Create an empty `DEMO.md` at the root (scripted demo conversation + run order — filled later).

---

## 7) Verify + commit

```powershell
pnpm install
pnpm dev          # dashboard should boot with stub pages
# Ctrl+C, then:
git add -A
git commit -m "chore: scaffold shared repo base (structure + config, no feature code)"
git remote add origin <your-empty-repo-url>
git push -u origin main
```

Team clones, runs `pnpm install`, copies `.env.example` → `.env` with shared dev values, and starts on their feature slice (architecture §22).

---

## What this setup deliberately does NOT include

- No implementation of the ingest endpoint, agents, pipeline stages, repositories, `routeHandler`, `db` client, or `env` validation. Those are **placeholders pointing to the architecture** — implemented during the hackathon.
- **No capture source.** The app exposes `POST /api/ingest`; how messages arrive (Chrome extension reader, import/seed) is a separate workspace/spec, not part of the repo base.
- The real code for `db/index.ts` and `lib/env.ts` already exists verbatim in `ARCHITECTURE.md` (§13, §21) — copy from there when you implement.
- Feature specs (ingestion, extraction, commands, extension reader) are separate documents under `specs/`.

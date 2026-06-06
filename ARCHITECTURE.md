# Architecture — Halketon · Memoria Operativa en WhatsApp para ONGs

Project name: **Halketon Bot** — an operational-memory assistant for NGOs that read their WhatsApp group conversations. The bot turns messy messages into **tasks, decisions, progress updates, responsibilities and searchable institutional memory**, and exposes that both from WhatsApp (via `/bot` commands) and a web dashboard (control surface).

> **North star:** the NGO keeps working in WhatsApp exactly as before — but the group gains memory, tracking and the ability to act. We are **not** another task manager; we are a thin intelligence layer over the channel they already use.

This document defines the architecture, conventions and design decisions for the project. It is the single source of truth the whole team builds against during the hackathon. Goal: consistency, inspectability, and zero merge-chaos with 4 people on one repo in one session.

**Context:** Halketon (hackathon social) — **Track 1: coordinación y memoria interna**.
**Hosting decision:** Next.js app on **Vercel** (sponsor), **Supabase** for data. **No always-on gateway server** — the capture layer is source-agnostic and runs client-side (see §9, §15).

---

## CRITICAL — non-negotiable rules

These are the rules that, if broken, silently kill the demo. Treat them as hard constraints, not suggestions.

1. **The ingest endpoint NEVER calls the LLM inline.** `POST /api/ingest` only: authenticate → dedupe → `INSERT raw_messages (status='pending')` → return `200` fast. All AI work happens later in `/api/pipeline/process-pending`. (Sources may retry → duplicate delivery; the `pending` queue is our durability + idempotency layer.)
2. **The AI proposes structure; the system validates and applies it.** No agent writes directly to final tables. Every agent output is validated with **Zod** before any DB write. Deterministic state changes (`Task State Manager`) are plain code, never an LLM.
3. **Everything traces back to source messages.** Every task / decision / fact must store `source_message_ids`. If you can't link it to messages, it doesn't get created. This is also our answer to the "surveillance" objection.
4. **Dedupe on the source's stable message id (`external_message_id`).** Re-delivery / re-import resends the same id → `ON CONFLICT DO NOTHING`. The source adapter must not forward the bot's own outbound messages.
5. **DB access rules are fixed (§13):** runtime through the Supabase **transaction pooler (6543)** with `prepare: false` + singleton client + `max: 1`; migrations through the **session pooler (5432)**. Never the direct connection (IPv6-only → fails on Vercel/CI).
6. **No backend code in frontend files.** No raw Supabase queries, no Anthropic SDK calls from client components. All of it lives in `services/` + `repositories/`, behind route handlers or called directly from server components. Server-only modules start with `import 'server-only'`.
7. **No secrets in the client bundle.** Only `NEXT_PUBLIC_*` reach the browser. Service-role key, Anthropic key, ingest key, CRON secret → server-only, validated at startup (§21).

---

## 1) Required stack

### Core
- **Next.js 15+** (App Router, TypeScript strict) — deployed to **Vercel**
- **Tailwind CSS v4** + **shadcn/ui** — dashboard UI
- **Drizzle ORM** + **`postgres-js`** driver — typed data access
- **Supabase Postgres + pgvector** — single source of truth (relational + vector)
- **Zod** — validation at every boundary (request, agent output, ingest payloads)
- **`@anthropic-ai/sdk`** (Claude) — extraction, reconciliation, summaries, replies
- **`@t3-oss/env-nextjs`** — typed env validated at build time
- **Source-agnostic capture** — one canonical `IngestMessage` contract + `POST /api/ingest` (§9). Primary live source: **Chrome extension reader** (`specs/extension-reader-spec.md`); demo source: paste/import + seed.

### Optional (only if core already works)
- **`@anthropic-ai/sdk` Batches API** — cheaper bulk extraction (non-live)
- **OpenAI `gpt-4o-mini-transcribe`** — audio → text (feeds the normal pipeline)
- **`@vercel/analytics`** — basic usage signals during the demo

### Infra
- **Vercel** — Next.js app + all API routes (app, ingest endpoint, pipeline trigger)
- **Supabase `pg_cron` + `pg_net`** — scheduled pipeline trigger (§14)
- The **capture source runs client-side** (extension in a browser) or as a no-infra import — there is no server to host (§15).

---

## 2) Principles

- **Pipeline over monolith.** Not one giant agent that decides everything. A stable pipeline: capture → normalize → batch → extract → reconcile → apply state → memory. Each stage is small, testable and inspectable.
- **Source-agnostic capture.** Any source maps to one canonical `IngestMessage` contract; nothing downstream of `raw_messages` knows or cares where a message came from.
- **Stability + inspectability first.** Every raw message is stored before any processing; every agent run is logged (`agent_runs`); every entity links to its source.
- **Idempotency everywhere.** No complex queue at MVP, so message states (`pending → processing → processed/failed`), batch ids and extraction hashes are how we avoid double-processing and duplicates.
- **Strict layered separation:** route handlers (controllers) → services (use cases / pipeline stages) → repositories (data + external APIs).
- **Zod at every external boundary** — request body/params/query, ingest payloads, **every LLM output**, external API responses. `safeParse`, never trust.
- **Silent by default in WhatsApp.** The bot answers only when invoked with `/bot ...` or on explicit demo actions. No notification spam.
- **Privacy-aware from the start.** Authorized groups only, demo on fake/test data, source-linked auditability, no training on NGO data, retention/delete path.
- **shadcn/ui first.** Don't hand-roll components that exist in the registry.
- **Security by default.** Secrets server-only, validated at startup. Ingest endpoint behind an API key.

---

## 3) High-level architecture

```txt
Capture source  (Chrome extension reader on WhatsApp Web  |  paste/import  |  seed)
        │  POST /api/ingest  (Bearer INGEST_API_KEY)  — canonical IngestMessage[]
        ▼
Next.js  POST /api/ingest               ── authenticate → dedupe → INSERT raw_messages(pending) → 200
        │
        ▼
   Supabase Postgres  (raw_messages: pending)
        │
        ▼
Trigger: manual button  |  Supabase pg_cron (every 5–15 min)
        │  POST /api/pipeline/process-pending  (CRON_SECRET-guarded, DB-claim lock)
        ▼
AI Processing Pipeline (services/)
   ├─ Normalizer + Batch Builder         → conversational batches (window + last N context)
   ├─ Extraction Agent       (Claude + Zod)     → tasks / decisions / progress / questions / facts
   ├─ Reconciliation Agent   (Claude + SQL)     → new vs update vs duplicate vs ambiguous
   ├─ Task State Manager     (deterministic)    → create/update tasks, task_updates
   └─ Memory Agent           (Claude + Zod)     → knowledge_facts, decisions, summaries, embeddings
        │
        ▼
   Supabase Postgres (tasks, task_updates, decisions, summaries, knowledge_facts, agent_runs, embeddings)
        │
        ├──────────────► WhatsApp `/bot` replies (back through the capture channel)
        └──────────────► Web Dashboard (Vercel) — tasks, people, decisions, agent_runs, config
```

The **two surfaces**: WhatsApp is the place of *action*; the web is the place of *control*.

---

## 4) Layers and responsibilities

We keep the house-style layered architecture. The pipeline maps onto it cleanly.

### 4.1 Controllers — Route Handlers (`src/app/api/**/route.ts`)
**Responsibility:** expose HTTP endpoints, parse/verify the request, delegate to a service, respond.
**Rules:**
- No business logic, no direct data access, no raw external calls.
- Wrapped in `routeHandler(...)` for centralized error handling (§19).
- Machine-to-machine endpoints (ingest, cron target) are route handlers — **not** Server Actions. Server Actions are only for internal dashboard mutations triggered from our own UI.

Endpoints:
- `POST /api/ingest` — receive `IngestMessage[]` from any capture source (auth, dedupe, enqueue).
- `POST /api/pipeline/process-pending` — run the pipeline over pending messages (CRON_SECRET-guarded).
- `POST /api/groups/[id]/authorize` — enable/disable a group for monitoring.
- `POST /api/history/import` — paste/export-chat ingestion (demo source / safety net).

### 4.2 Services — Use cases & pipeline stages (`src/services/`)
**Responsibility:** business rules and the pipeline stages. Input normalization + Zod validation. Orchestration of repositories and agents.
**Rules:**
- **Never** return error objects — always `throw` typed exceptions.
- The **Task State Manager is pure deterministic code**, no LLM.
- Stages are independently testable; pass data explicitly.

### 4.3 Repositories — Data access & external integrations (`src/repositories/`)
**Responsibility:** Supabase/Postgres access (via Drizzle), Anthropic SDK calls, OpenAI transcription.
**Rules:**
- Validate payloads with Zod **before** insert/update/outbound request.
- Return domain models, never UI-shaped responses or raw upstream payloads.
- Throw domain exceptions derived from `BaseException`.

### 4.4 Agents (`src/services/agents/` + `src/lib/claude/`)
Specialized, **not autonomous**. Each agent has one responsibility, a fixed input/output contract, and returns **Zod-validated** JSON. See §12.

---

## 5) Folder structure

Single Next.js app (`src/`). The capture source (Chrome extension) is a separate workspace (`extension/`) per `specs/extension-reader-spec.md`; the app only exposes `/api/ingest`. The app deploys to Vercel.

```txt
halketon/
├─ src/
│  ├─ app/
│  │  ├─ (dashboard)/
│  │  │  ├─ page.tsx                      # overview: tasks by status/person
│  │  │  ├─ tasks/page.tsx
│  │  │  ├─ people/page.tsx               # map participants → real users
│  │  │  ├─ decisions/page.tsx
│  │  │  ├─ groups/page.tsx               # authorize groups, link to project
│  │  │  ├─ activity/page.tsx             # agent_runs, batches, source messages
│  │  │  └─ settings/page.tsx             # capture status, processing
│  │  ├─ api/
│  │  │  ├─ ingest/route.ts               # ⬅ auth + dedupe + enqueue (source-agnostic)
│  │  │  ├─ pipeline/process-pending/route.ts
│  │  │  ├─ groups/[id]/authorize/route.ts
│  │  │  └─ history/import/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  │
│  ├─ services/
│  │  ├─ ingestion/
│  │  │  ├─ ingestion.service.ts          # enqueueMany, dedupe
│  │  │  └─ history-import.service.ts     # paste/export source
│  │  ├─ pipeline/
│  │  │  ├─ pipeline.service.ts           # orchestrates the stages, claims batch
│  │  │  ├─ normalizer.ts
│  │  │  ├─ batch-builder.ts
│  │  │  └─ state-manager.ts              # DETERMINISTIC — no LLM
│  │  ├─ agents/
│  │  │  ├─ extraction.agent.ts
│  │  │  ├─ reconciliation.agent.ts
│  │  │  └─ memory.agent.ts
│  │  ├─ commands/
│  │  │  └─ commands.service.ts           # /bot tareas / resumen / mis tareas ...
│  │  ├─ tasks/
│  │  │  └─ tasks.service.ts
│  │  └─ groups/
│  │     └─ groups.service.ts
│  │
│  ├─ repositories/
│  │  ├─ messages/messages.repository.ts  # raw_messages, batches
│  │  ├─ tasks/tasks.repository.ts        # tasks, assignments, updates
│  │  ├─ decisions/decisions.repository.ts
│  │  ├─ memory/memory.repository.ts      # knowledge_facts, summaries, embeddings
│  │  ├─ groups/groups.repository.ts
│  │  ├─ runs/agent-runs.repository.ts    # agent_runs, audit_log
│  │  ├─ claude/claude.repository.ts      # Anthropic SDK calls
│  │  └─ transcription/transcription.repository.ts  # OpenAI audio (optional)
│  │
│  ├─ db/
│  │  ├─ index.ts                         # drizzle client singleton (§13)
│  │  └─ schema/
│  │     ├─ index.ts                      # barrel export
│  │     ├─ organizations.ts
│  │     ├─ groups.ts
│  │     ├─ users.ts
│  │     ├─ messages.ts                   # raw_messages, message_batches
│  │     ├─ tasks.ts                      # tasks, task_assignments, task_updates
│  │     ├─ decisions.ts
│  │     ├─ memory.ts                     # knowledge_facts, summaries, extracted_items
│  │     ├─ embeddings.ts                 # pgvector
│  │     ├─ runs.ts                       # agent_runs, audit_log
│  │     └─ relations.ts
│  │
│  ├─ types/
│  │  └─ <module>/{dto,types}/            # Zod schemas + domain types per module
│  │
│  ├─ exceptions/
│  │  ├─ base/base-exceptions.ts
│  │  ├─ pipeline/pipeline-exceptions.ts
│  │  ├─ external/external-exceptions.ts  # Claude, OpenAI, capture
│  │  └─ validation/validation-exceptions.ts
│  │
│  ├─ lib/
│  │  ├─ handlers/
│  │  │  ├─ route-handler.ts
│  │  │  └─ http-error-mapper.ts
│  │  ├─ env.ts                           # @t3-oss/env-nextjs (§21)
│  │  ├─ claude/client.ts                 # Anthropic client + prompt-cache helpers
│  │  ├─ ingest/types.ts                  # canonical IngestMessage Zod contract (§9)
│  │  ├─ openai/client.ts                 # transcription (optional)
│  │  └─ utils/{cn.ts, dates.ts, ids.ts}
│  │
│  └─ components/
│     ├─ dashboard/                       # tables, person view, activity feed
│     └─ ui/                              # shadcn primitives
│
├─ extension/                             # Chrome extension reader (separate workspace) — specs/extension-reader-spec.md
├─ drizzle/                               # generated migrations (if using generate/migrate)
├─ drizzle.config.ts                      # points at the 5432 SESSION pooler
├─ vercel.json
├─ ARCHITECTURE.md                        # this file
└─ DEMO.md                                # scripted demo conversation + run order
```

---

## 6) Naming conventions

- **Folders / routes / segments:** `kebab-case` (`process-pending`, `agent-runs`).
- **Files:** `feature.type.ts` (`tasks.repository.ts`, `extraction.agent.ts`, `route-handler.ts`).
- **Types / interfaces / Zod schemas:** `PascalCase` (`RawMessageModel`, `ExtractionResult`, `IngestMessage`). Zod schemas end in `Schema` (`ExtractionResultSchema`).
- **DB tables:** `snake_case` plural (`raw_messages`, `task_updates`).
- **Constants:** `UPPER_SNAKE_CASE` (`CONFIDENCE_AUTO_APPLY`, `BATCH_WINDOW_MINUTES`).
- **Components:** `PascalCase`. **Hooks:** `useX`.

---

## 7) Data model (minimum, but complete)

The model separates **raw messages**, **suggested extractions**, and **confirmed operational entities**. Automation may create entities directly, but always with `source_message_ids` + confidence flags (§16). Source-neutral throughout.

| Table | Role | Key columns |
|---|---|---|
| `organizations` | NGO / workspace | `id`, `name` |
| `whatsapp_groups` | Authorized groups, linked to a project | `id`, `org_id`, `external_chat_id`, `is_authorized`, `project_id` |
| `users` | Detected or manually-loaded people | `id`, `org_id`, `display_name` |
| `group_members` | group ↔ person mapping | `group_id`, `user_id`, `external_sender_id`, `phone`, `display_name` |
| `raw_messages` | Raw messages from any source | `id`, `source` (`extension`/`import`/`seed`), `external_message_id` (**unique, dedupe key**), `group_id`, `sender_external_id`, `sender_name`, `ts`, `text`, `transcript`, `message_type`, `quoted_external_id`, `raw_payload` (jsonb), `processing_status` (`pending`/`processing`/`processed`/`failed`), `batch_id` |
| `message_batches` | Windows processed together | `id`, `group_id`, `window_start`, `window_end`, `message_ids_hash`, `status`, `created_at` |
| `agent_runs` | Log of every pipeline run | `id`, `batch_id`, `stage`, `model`, `input_tokens`, `output_tokens`, `status`, `error`, `started_at`, `finished_at` |
| `projects` | Main project per group (+ optional sub) | `id`, `org_id`, `name` |
| `tasks` | Operational tasks | `id`, `project_id`, `title`, `description`, `status` (`open`/`in_progress`/`blocked`/`done`), `priority`, `due_date`, `confidence`, `review_flag`, `source_message_ids` (uuid[]), `extraction_hash` (**unique**) |
| `task_assignments` | Responsibles & collaborators | `task_id`, `user_id`, `assignee_hint`, `role` |
| `task_updates` | Progress, blockers, status changes | `id`, `task_id`, `kind`, `note`, `source_message_ids`, `confidence` |
| `decisions` | Decisions detected in conversation | `id`, `project_id`, `title`, `source_message_ids`, `confidence`, `extraction_hash` |
| `knowledge_facts` | Institutional facts (not actionable) | `id`, `project_id`, `fact`, `source_message_ids`, `confidence` |
| `extracted_items` | Open questions / low-confidence items | `id`, `project_id`, `kind`, `content`, `source_message_ids`, `confidence` |
| `summaries` | Per group/project/period summaries | `id`, `group_id`, `period`, `content`, `created_at` |
| `embeddings` | Vectors for messages/decisions/summaries/facts | `id`, `owner_type`, `owner_id`, `embedding` (`vector(1536)`), `content` |
| `audit_log` | Important changes + source | `id`, `entity_type`, `entity_id`, `action`, `source`, `actor`, `ts` |

**Idempotency keys (CRITICAL):**
- `raw_messages.external_message_id` unique → ingest dedupe.
- `message_batches` unique on `(group_id, message_ids_hash)`.
- `tasks.extraction_hash = hash(normalized_title + source_message_ids_hash)` → reconciliation dedupe.

**pgvector:** enable once (`create extension if not exists vector;`). Embed only what matters: processed messages, decisions, summaries, knowledge_facts. Index with **HNSW** + `vector_cosine_ops`. See §13.

> The detailed, copy-paste Drizzle schema lives in `specs/ingestion-spec.md` §3 (ingestion-owned tables) and `specs/extraction-pipeline-spec.md` §3 (downstream tables).

---

## 8) The ingestion + processing pipeline (detailed flow)

### 8.1 Ingestion (`/api/ingest` — fast path, NO LLM)
1. A capture source POSTs `IngestMessage[]` to `/api/ingest` with `Authorization: Bearer ${INGEST_API_KEY}`.
2. Authenticate; reject otherwise.
3. Validate the batch with Zod (`IngestBatchSchema`).
4. Per message: resolve `group_id` from `group_external_id` (`whatsapp_groups.external_chat_id`); if not found or not authorized → skip that message.
5. `INSERT raw_messages` with `status='pending'`, unique on `external_message_id` (on conflict do nothing → dedupe).
6. If media/audio → store metadata; transcription happens later (optional).
7. Return `200` immediately. **No processing here.** (Full detail: `specs/ingestion-spec.md` §5.)

### 8.2 Processing (`/api/pipeline/process-pending` — manual button + pg_cron)
1. **Auth:** require `Authorization: Bearer ${CRON_SECRET}`.
2. **Claim** pending messages with a DB-level lock so two cron ticks don't grab the same rows:
   ```sql
   UPDATE raw_messages SET processing_status='processing'
   WHERE id IN (
     SELECT id FROM raw_messages
     WHERE processing_status='pending' AND group_id=$1
     ORDER BY ts LIMIT $batchSize
     FOR UPDATE SKIP LOCKED
   ) RETURNING *;
   ```
3. **Normalize** (resolve author from the source sender, replies, timestamps).
4. **Batch builder** — group claimed messages per group + add last N context messages.
5. **Extraction Agent** (Claude + Zod) → tasks / decisions / progress / open questions / facts with `confidence` + `source_message_ids`.
6. **Reconciliation Agent** (Claude + SQL) → for each item: new / update / duplicate / ambiguous (matches against existing rows via `extraction_hash` + semantic search).
7. **Task State Manager** (deterministic) → apply create/update with confidence flags (§16).
8. **Memory Agent** → store knowledge_facts, decisions, summaries; enqueue embeddings.
9. Mark messages `processed` (or `failed`), write `agent_runs`, write `audit_log`.

**Why this shape:** the ingest endpoint must return a quick `200` (sources retry → duplicates). `after()`/fire-and-forget dies at `maxDuration` with no retry or visibility. The `pending` table is the durable boundary; the cron drains it. The **manual "Procesar mensajes pendientes" button hits the same endpoint** and is the demo safety net.

> `/bot` commands are handled separately, at capture time (not in this batch) — see §10 and `specs/commands-replies-spec.md`.

---

## 9) Capture sources & the ingest contract (source-agnostic)

Capture is decoupled behind **one canonical contract**. Any source maps its native shape to `IngestMessage` and POSTs to `POST /api/ingest`. Nothing downstream knows the source.

**Canonical `IngestMessage`** (`src/lib/ingest/types.ts`): `source`, `externalMessageId` (dedupe), `groupExternalId`, `sender {externalId, name}`, `ts` (ISO), `text`, `type`, `quotedExternalId?`, `media?`, `raw?`. Full schema: `specs/ingestion-spec.md` §4.

| Source / adapter | How it delivers | Status |
|---|---|---|
| **Chrome extension reader** | Reads WhatsApp Web DOM in a logged-in browser → POSTs `IngestMessage[]` to `/api/ingest`. Reads pre-existing groups of any size; runs on the user's real session (lower ban risk than a spoofed client). | **Primary (live).** `specs/extension-reader-spec.md` |
| **Paste / export import** | `/api/history/import` parses a WhatsApp export → `IngestMessage[]` → same enqueue. | **Demo source / safety net** |
| **Seed** | Curated demo messages. | Guaranteed-stable demo |
| **Cloud API (optional, DMs)** | Meta webhook → adapter maps to `IngestMessage`. Official/compliant but **1:1 only** — cannot read pre-existing groups. | Compliance alternative |

> **Why not a server-side gateway or the official Groups API:** server-side libraries that spoof a linked WhatsApp device risk number bans under current policy. Meta's official Groups API can only read groups the business *creates* (≤8 members, OBA-gated) — it cannot read pre-existing human-made groups. The extension reader, running on a real logged-in session, is the only path that reads real existing groups at acceptable risk for a demo.

---

## 10) Bot commands v1 (silent by default)

The bot only speaks when invoked with the **`/bot`** prefix. It works **in groups and in 1:1 chats**. Commands use a **generic registry framework** — adding a command is registering a handler; the dispatcher never changes. Detected at **capture time** and answered fast via `after()` (not inside the 5–15 min batch). Full design: `specs/commands-replies-spec.md`.

| Command | Function |
|---|---|
| `/bot help` | List available commands (auto-generated from the registry) |
| `/bot resumen` | Short group/project summary (LLM) |
| `/bot tareas` | Open tasks (group → project, DM → org) |
| `/bot mis tareas` | Tasks assigned to the asker |
| `/bot novedades` | Recently detected tasks/decisions/updates |
| `/bot crear tarea: ...` | Explicitly create a task (via the State Manager) |
| `/bot hecha: ...` | Find similar task → complete, or list candidates if ambiguous |
| `/bot buscar: ...` (`que se decidio sobre ...`) | Retrieve related decisions/facts/summaries (semantic search) |

Rules: answer **only** with data the sender's org/group authorizes; cite/show source when possible; keep replies short; write-commands route through the **deterministic State Manager**, never raw writes.

---

## 11) Ingest endpoint (fast ack, no LLM)

```ts
// src/app/api/ingest/route.ts
import { IngestBatchSchema } from '@/lib/ingest/types'
import { ingestionService } from '@/services/ingestion/ingestion.service'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${env.INGEST_API_KEY}`)
    return new Response('Unauthorized', { status: 401 })

  const parsed = IngestBatchSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ ok: false, error: 'invalid' }, { status: 400 })

  const result = await ingestionService.enqueueMany(parsed.data.messages) // dedupe + INSERT pending
  return Response.json({ ok: true, accepted: result.accepted, deduped: result.deduped })
}
```
No HMAC/raw-body dance: a Bearer key is enough for a source-controlled POST of JSON. (A Cloud API adapter, if added, verifies Meta's signature in its own route then calls the same `enqueueMany`.)

---

## 12) AI agents spec (Claude)

**Client:** `@anthropic-ai/sdk`, module-level singleton, explicit `timeout` below the function `maxDuration`, `maxRetries: 2`.

### Structured output — primary approach
Use native structured outputs: `client.messages.parse()` + `zodOutputFormat` from `@anthropic-ai/sdk/helpers/zod`. The SDK validates and returns a typed object. **Fallback** (only if needed): tool-use forcing with `tool_choice` + `zod-to-json-schema`. Do not build both.

```ts
const res = await client.messages.parse({
  model: 'claude-haiku-4-5',
  max_tokens: 8000,
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: batch }],
  output_config: { format: zodOutputFormat(ExtractionResultSchema) },
})
const data = res.parsed_output  // null on refusal/max_tokens → guard
```

### Prompt caching (big cost/latency win)
Put the large static instructions in `system` with `cache_control: { type: 'ephemeral' }`. **Minimum cacheable prefix is model-dependent** — Haiku 4.5 & all Opus need **≥4096 tokens**, Sonnet 4.6 **≥2048**. Verify with `res.usage.cache_read_input_tokens > 0`. No `Date.now()`/UUIDs in the cached prefix; serialize JSON deterministically.

### Model selection
| Stage | Model | Why |
|---|---|---|
| Extraction (high volume) | `claude-haiku-4-5` | fast, cheap, structured output reliable |
| Reconciliation | `claude-sonnet-4-6` (escalate hard cases to `claude-opus-4-8`) | judgment on merges |
| User-facing replies | `claude-haiku-4-5` | short, cheap |

### Validation loop
Validate every output with Zod before any DB write. On schema mismatch, retry once feeding the error back (keep the retry message **after** the cached prefix). Check `stop_reason`: `max_tokens` → raise limit; `refusal` → surface, don't loop.

### Agent contracts (Zod-validated)
| Agent | Input | Output |
|---|---|---|
| Extraction | conversational batch | `{ tasks[], decisions[], progressUpdates[], openQuestions[], facts[] }` each with `confidence` + `source_message_ids` |
| Reconciliation | extractions + current DB | `new` / `update` / `duplicate` / `ambiguous` |
| Memory | non-actionable facts | knowledge_facts, decisions, summaries |
| Command Router | a `/bot` command string | intent + args (rules + Claude) |

---

## 13) Database access conventions (Drizzle + Supabase)

**Client singleton — runtime through the transaction pooler (6543):**
```ts
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const g = globalThis as unknown as { client?: ReturnType<typeof postgres> }
export const client =
  g.client ?? postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 }) // prepare:false REQUIRED
if (process.env.NODE_ENV !== 'production') g.client = client
export const db = drizzle(client, { schema })
```

**Migrations — through the session pooler (5432):**
```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL! }, // 5432 session pooler
})
```

**Hackathon workflow:** use **`drizzle-kit push`** against a **shared Supabase dev project** (one source of truth, no migration-file merge pain). Coordinate who runs `push`. The DB schema is **locked centrally on day 0** (§22) — everyone codes against it.

**pgvector:**
```ts
import { index, pgTable, uuid, text, vector } from 'drizzle-orm/pg-core'
export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerType: text('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
}, (t) => [ index('embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')) ])
```
Similarity: `1 - cosineDistance(embeddings.embedding, q)`, `ORDER BY` the distance expression so HNSW is used.

**Gotchas (hard rules):** `prepare:false` mandatory on 6543; migrations on 5432 (direct = IPv6-only → fails on Vercel/CI); enable `vector` extension manually; singleton + `max:1`; two env vars (`DATABASE_URL` 6543, `MIGRATION_DATABASE_URL` 5432).

---

## 14) Cron / scheduling

**Default: Supabase `pg_cron` + `pg_net`.** Already running Supabase, sub-minute granularity, no extra service.
```sql
select cron.schedule('process-pending', '*/5 * * * *', $$
  select net.http_post(
    url     := 'https://<app>.vercel.app/api/pipeline/process-pending',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
$$);
```
Store the secret via Vault / a GUC, not inline.

**Alternative: Vercel Cron** — clean *only on Pro*. ⚠️ **On Hobby, Vercel Cron is limited to once/day → `*/5 * * * *` fails deployment.** Don't default to it.
**Always available:** the manual dashboard button → same endpoint (demo control + debug).

---

## 15) Hosting & deployment

No always-on gateway server to host — that's the upside of the source-agnostic, client-side capture model.

- **App + all API routes → Vercel** (`/api/ingest`, `/api/pipeline/process-pending`, dashboard). Set `INGEST_API_KEY`, `CRON_SECRET`, DB + Anthropic secrets in Vercel env.
- **Data → Supabase** (managed Postgres + pgvector). Connect via the **6543 pooler** at runtime, **5432** for migrations (§13).
- **Scheduling → Supabase `pg_cron`** hitting `/api/pipeline/process-pending` (§14).
- **Capture runs client-side, not on a server:**
  - **Chrome extension reader** runs in a teammate's browser on WhatsApp Web and POSTs to `/api/ingest`. Nothing to deploy server-side; the "always-on" concern is just keeping that tab open during the demo.
  - **Import/seed** needs no infra at all.
  - **(Optional) Cloud API** for 1:1/DMs is a Meta-hosted webhook → an adapter route on Vercel; still no server to run.

This collapses the old multi-host setup (app + gateway + cron) into **Vercel + Supabase**, with capture pushed to the edge/client.

---

## 16) Confidence, review & idempotency rules

For the demo we prioritize automation but flag uncertainty visibly.

| Confidence | Action | Visualization |
|---|---|---|
| ≥ 50% | Apply automatically | none / light info |
| 20–49% | Apply + flag | review flag |
| < 20% | Save with strong flag, or create as critical item if structured enough | critical flag |

**Exception:** if there's not enough to make a functional task (no actionable title/context), save as `extracted_items` (open_question / low_confidence), not a final task.
**Idempotency:** message states `pending → processing → processed/failed`; batch ids; `extraction_hash` checked before creating a task (Reconciliation Agent).

---

## 17) Dashboard v1

The web does not replace WhatsApp — it's for config, supervision and visualization.
- View capture/connection status; trigger processing.
- Authorize groups; link each to a project; map participants → real users.
- Task board by status / responsible / due date; per-person view.
- Recent decisions & summaries; items with review/critical flags.
- `agent_runs`, errors, batches, source messages.
- **Manual "Procesar mensajes pendientes" button** (demo/debug safety net).

---

## 18) Validation (Zod)

Every external input validated with Zod: request body/params/query, **ingest payloads**, **every LLM output**, external API responses. `safeParse` in services/repositories. Validation errors → `ValidationException`. Zod schemas live in `types/<module>/dto`.

---

## 19) Error handling

- **Route handlers** wrapped in `routeHandler(...)`. Consistent `{ data }` / `{ error: { statusCode, message, userMessage } }`.
- **Services / repositories** never return error objects — always `throw` typed exceptions derived from `BaseException`.
- `http-error-mapper.ts` maps exception → status (400 validation, 401/403 auth, 409 conflict, 429 rate-limit, 502 external provider, 500 db/unknown).
- **External provider failures** (Claude/OpenAI) → `ExternalProviderException`; never crash the whole batch — mark the message `failed`, log to `agent_runs`, continue.

---

## 20) Security, privacy & traceability

- Bot only active in **admin-authorized** groups; **visible** to participants, never a hidden reader.
- Demo uses **fake/test data** or test groups unless explicit consent.
- Every task/decision links to **source messages** (audit).
- **No NGO data used to train models.** Raw history can be deleted / retained per policy after structure is extracted.
- Secrets server-only, validated at startup. Ingest endpoint behind `INGEST_API_KEY`; pipeline behind `CRON_SECRET`.
- The capture layer is a **consent-based companion** on the NGO's own account; production must review compliance and the official-API alternative.

---

## 21) Environment variables

```bash
# --- Next.js app (Vercel) ---
DATABASE_URL=postgresql://...@aws-...pooler.supabase.com:6543/postgres   # TX pooler (runtime)
MIGRATION_DATABASE_URL=postgresql://...@aws-...pooler.supabase.com:5432/postgres  # session pooler (drizzle-kit)
SUPABASE_SERVICE_ROLE_KEY=...            # server only
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...                       # optional (audio); declare .optional() in env.ts
INGEST_API_KEY=...                       # capture sources present this to POST /api/ingest
CRON_SECRET=...                          # guards /api/pipeline/process-pending
```
Validate app vars with `@t3-oss/env-nextjs` in `src/lib/env.ts`, imported from `next.config.ts` so build fails fast on a missing secret.

---

## 22) Work split & build order (4 devs, 1 repo, 1 session)

The doc's real job with 4 people is **minimizing merge conflicts**. So:

### Day-0 shared foundation (locked centrally, before parallel work)
**Owner: repo lead (you).** Nothing below starts until these exist and are pushed:
1. Repo scaffold (folder structure §5), `env.ts`, `route-handler.ts`, `db/index.ts`, Drizzle config.
2. **The DB schema (§7)** pushed to the shared Supabase project (`drizzle-kit push`).
3. **Seed** one org + one authorized `whatsapp_groups` row (the test group's `external_chat_id`) — without it, ingestion silently drops everything.
4. **The shared Zod contracts** (`IngestMessageSchema`, `ConversationBatchSchema`, `ExtractionResultSchema`) — ingestion, pipeline, dashboard all depend on these. Freeze them early, change only by team agreement.

### Parallel feature slices (one owner each — own folders → no conflicts)
| Dev | Owns | Folders |
|---|---|---|
| **A — Capture/Ingestion** | Chrome extension reader + `/api/ingest` + dedupe + raw store + paste/import | `extension/`, `api/ingest`, `services/ingestion`, `lib/ingest` |
| **B — AI pipeline** | extraction, reconciliation, memory agents, prompt caching, validation loop | `services/agents`, `services/pipeline`, `lib/claude`, `repositories/claude` |
| **C — Dashboard** | tasks board, person view, activity feed, group config, capture status | `app/(dashboard)`, `components` |
| **D — State + commands + data** | deterministic state manager, `/bot` commands, tasks/decisions repositories, semantic search | `services/pipeline/state-manager`, `services/commands`, `repositories/{tasks,decisions,memory}` |

### Critical path vs roadmap (full scope kept — this is build ORDER, not scope cutting)
**Demo-critical (must work):** ingest → pending store → manual button → extraction → reconciliation → state manager → task board + `/bot tareas` reply.
**High value:** `/bot resumen` / `mis tareas`, semantic memory (`que se decidio sobre...`), pg_cron automation.
**Roadmap (build only if core is solid):** audio transcription, embeddings over all messages, advanced summaries, analytics.

> Build the **paste/import path early** — it's the demo safety net if the live extension reader misbehaves on hackathon wifi. Same pipeline, different entry point.

---

## 23) Definition of "feature complete"

A feature is complete only if it includes:
- Zod schema (`types/<module>/dto`) + domain types (`types/<module>/types`).
- Repository (if it touches data / external APIs), with Zod validation before write/send.
- Service (business rule / pipeline stage), throwing typed exceptions.
- Route handler(s) when interactive, wrapped in `routeHandler(...)`.
- Dashboard UI with shadcn/ui primitives + responsive `<Suspense>` skeleton when it renders data.
- Typed error handling end-to-end; failures logged to `agent_runs` where relevant.
- Idempotency respected (dedupe keys, state transitions).
- Source traceability (`source_message_ids`) for any AI-created entity.

---

## 24) Scope — hackathon vs production

| Area | Hackathon | Production |
|---|---|---|
| Capture | Chrome extension reader / import on a test group | consent-based companion at scale, or Cloud API where 1:1 fits; compliance review |
| Processing | pg_cron 5–15 min + manual button | robust queues, retries, observability, scalable workers |
| Tasks | automation + confidence flags | confirmation configurable per org/role |
| History | paste/export + extension backfill | controlled import, retention, reindex, permissions |
| Audio | optional if setup is fast | full media pipeline (transcription, diarization, retention) |
| Security | authorized groups, test data, logs | RBAC, advanced audit, encryption, deletion policies |
| Auth (dashboard) | minimal (see §25) | full auth + roles |

---

## 25) Pending decisions (document each as it's made — date + rationale)

- **Dashboard auth:** default for hackathon = **single-org, light gate** (one shared Supabase magic-link login, or a simple password env for the demo). *(Default chosen: light gate; revisit if time.)*
- **Embeddings coverage:** v1 embeds decisions/summaries/facts + processed messages. *(Default: structured entities + processed messages only.)*
- **Cron cadence:** 5 min default via pg_cron. Decide final interval (5 vs 10 vs 15) based on demo pacing.
- **Audio transcription:** in or out for the demo — build only if the core pipeline is solid by mid-afternoon.
- **`messages.parse` vs tool-use:** primary is `messages.parse` + `zodOutputFormat`. Revisit only if a stage needs branching tool semantics.
- **Schema addition — `extracted_items`** *(2026-06-05)*: `specs/extraction-pipeline-spec.md` adds an `extracted_items` table (open questions + low-confidence/unstructured items) for the §16 confidence-exception path.
- **Command prefix `/bot` + capture-time handling** *(2026-06-05)*: commands use `/bot`, work in groups **and** DMs, and are answered at capture time via `after()` (not inside the batch). See `specs/commands-replies-spec.md`.
- **Schema addition — `handled_commands`** *(2026-06-05, optional)*: command-reply dedupe table. May instead be folded into `raw_messages` with `source='command'`.
- **Capture model — source-agnostic, client-side** *(2026-06-05)*: no server-side gateway. Capture sits behind the `IngestMessage` contract + `POST /api/ingest`. Primary live source = **Chrome extension reader** (`specs/extension-reader-spec.md`, reads real WhatsApp Web — pre-existing groups of any size, runs on a real session); demo source = paste/import + seed; **Cloud API** is the compliance alternative for 1:1/DMs (no pre-existing-group reads). Server-side spoofed-client gateways were ruled out for ban risk under current policy.

Any structural deviation from this architecture must be justified in the PR description.

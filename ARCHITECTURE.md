# Architecture — helpr (Halketon) · 1:1 WhatsApp work tracking

> A WhatsApp 1:1 assistant that turns each person's messages (text or voice note) into tracked
> tasks for their team / NGO. The **bot, capture, transcription and task-extraction all run in
> n8n**. **This repo is the Next.js dashboard + read API** over the shared **Supabase** database.
> People keep working in WhatsApp; the team gains a live, queryable task board.

This document is the source of truth for **the app in this repo**. n8n's internal workflow is treated
as a **black box** — what matters here is the **database contract** between n8n and the app (§2–§3).

**Hosting:** Next.js app on **Vercel**; data on **Supabase** (Postgres). n8n runs the WhatsApp bot
and writes to Supabase out-of-band. There is no AI/ingestion code in this repo.

---

## 1) System overview

```txt
WhatsApp (1:1 chat)
   │  message (text / voice note)
   ▼
n8n workflow ── capture · transcribe audio · extract task (LLM) · confirm with user · promote draft → task
   │  writes via Supabase service-role key (held inside n8n)
   ▼
Supabase Postgres ── single source of truth
   │   organizaciones · personas · proyectos · tareas · tareas_borrador · inbox
   ▲
   │  reads via Drizzle (postgres-js)
Next.js app (this repo) ── dashboard + /api/* GET endpoints ── deploys to Vercel
```

- **n8n = the brain and the writer.** Receives WhatsApp, stores raw messages, transcribes voice,
  extracts task fields with an LLM, stages a draft, confirms with the user, and promotes the draft
  to a real task. All n8n-owned; it writes to Supabase with its own service-role key.
- **This app = the reader and the surface.** A Next.js dashboard + a small REST read API over the
  same database. It holds **no** WhatsApp/AI logic and performs **no writes** today.
- **Supabase = the contract.** The two systems share only the schema in §3.

---

## 2) The boundary contract

| Table | n8n | this app |
|---|---|---|
| `inbox` | writes (raw WhatsApp messages) | reads (activity feed) |
| `tareas_borrador` | writes + updates (drafts, promotion) | reads (pending drafts) |
| `tareas` | writes (on confirmation) | reads (task board) |
| `personas`, `proyectos`, `organizaciones` | reads/writes as needed | reads |

- **Identity / dedupe keys:** `inbox.wamid` is unique (WhatsApp message id → dedupe);
  `personas.telefono` is unique and is the person identity key.
- **`wa_id` = `personas.telefono`.** `inbox.wa_id` and `tareas_borrador.wa_id` hold the sender's
  phone, equal to `personas.telefono`. That equality is the join the app uses to attribute a raw
  message / draft to a person (and therefore to an organization).
- **Writes:** today only n8n writes; the app is **read-only**. When dashboard write actions are
  added (e.g. reassign, mark done), they go through the layered services (§6) and are documented here.

---

## 3) Data model

Verified 1:1 against the live Supabase DB (the Drizzle schema in `src/db/schema/*` mirrors it).

| Table | Role | Key columns |
|---|---|---|
| `organizaciones` | team / NGO / workspace | `id`, `nombre` |
| `personas` | people, by phone | `id`, `organizacion_id→org`, `nombre`, `telefono` (**unique**), `rol`, `activo` |
| `proyectos` | projects; one per org may be the default tray | `id`, `organizacion_id→org`, `nombre`, `descripcion`, `es_bandeja`, `activo` |
| `tareas` | tracked tasks | `id`, `proyecto_id→proyectos` (**NOT NULL**), `asignado_id→personas`, `creado_por_id→personas`, `descripcion`, `prioridad` (`alta`/`media`/`baja`), `estado` (`pendiente`/`en_progreso`/`hecho`), `fecha_limite`, `origen` (`audio`/`texto`) |
| `tareas_borrador` | drafts awaiting WhatsApp confirmation (`estado='esperando'`); **no project until promoted** | `id`, `wa_id`, `descripcion`, `prioridad`, `fecha_limite`, `asignado_id→personas`, `creado_por_id→personas`, `origen`, `estado` |
| `inbox` | raw WhatsApp messages landed by n8n | `id`, `wa_id`, `wamid` (**unique**), `type`, `body`, `audio_id`, `processed_at`, `execution_id` |

- `prioridad`/`estado`/`origen` on `tareas` carry DB **CHECK** constraints; on `tareas_borrador`
  they are free text. The app types them with TS unions for ergonomics but the DB is authoritative.
- **`es_bandeja`** marks the default "inbox/tray" project. On promotion a draft becomes a `tarea`
  with a `proyecto_id` (defaulting to the org's `es_bandeja` project) — that logic lives in n8n.

---

## 4) The n8n flow (black box — context only)

High level, owned by n8n; node-level details (provider, transcription service, extraction LLM,
promotion logic) live in n8n, not here:

```txt
WhatsApp message
  → insert inbox            (dedupe on wamid; record execution_id; audio_id for voice notes)
  → if voice: transcribe
  → LLM extracts task fields
  → insert tareas_borrador  (estado = 'esperando')
  → confirm with the user over WhatsApp
  → on confirmation: promote → insert tareas (sets proyecto_id, default = org's es_bandeja)
```

---

## 5) Stack (this repo)

- **Next.js 16** (App Router, TypeScript strict) — deployed to **Vercel**
- **Drizzle ORM** + **`postgres-js`** — typed data access
- **Supabase Postgres** — shared source of truth
- **Zod** — validation at every boundary (query params today; request bodies when writes land)
- **Tailwind CSS v4** + **shadcn/ui** — dashboard UI

---

## 6) Layers

Route handlers (controllers) → services (use cases) → repositories (Drizzle data access). DTOs (Zod)
at the boundary. No agents/pipeline/ingestion here — that is n8n.

- **Controllers** (`src/app/api/**/route.ts`): native Next 16 `GET` signature; parse + validate the
  query with a Zod DTO, delegate to a service, return. Bodies wrapped via `routeHandler` (§9).
- **Services** (`src/services/<m>/`): business rules; **throw** typed exceptions, never return errors.
- **Repositories** (`src/repositories/<m>/`): Drizzle queries; return domain rows. Joins live here.
- **Exceptions** (`src/exceptions/base/`): `BaseException` + `ValidationException` + `NotFoundException`.

---

## 7) Folder structure

```txt
src/
├─ app/
│  ├─ (dashboard)/…                 # dashboard pages (tasks, people, projects, activity, settings…)
│  └─ api/
│     ├─ organizaciones/route.ts
│     ├─ personas/route.ts
│     ├─ proyectos/route.ts
│     ├─ tareas/route.ts  +  tareas/[id]/route.ts
│     ├─ tareas-borrador/route.ts
│     └─ inbox/route.ts
├─ services/<entity>/<entity>.service.ts
├─ repositories/<entity>/<entity>.repository.ts
├─ types/<entity>/dto/<entity>.dto.ts      # Zod query schemas + inferred types
├─ db/
│  ├─ index.ts                              # drizzle client singleton (lazy; §8)
│  └─ schema/{organizaciones,personas,proyectos,tareas,tareas-borrador,inbox,relations,index}.ts
├─ exceptions/base/base-exceptions.ts
└─ lib/
   ├─ handlers/{route-handler,http-error-mapper}.ts
   └─ env.ts                                # lazy, server-only env validation
```

---

## 8) Database access (Drizzle + Supabase)

- **Runtime → `DATABASE_URL` = transaction pooler (6543).** `postgres-js` with `prepare:false` +
  `max:1`, a global singleton, created lazily (so `next build` is green without credentials).
  See `src/db/index.ts`.
- **`drizzle-kit` → `MIGRATION_DATABASE_URL` = session pooler (5432).** Never the **direct**
  connection (`db.<ref>.supabase.co`) — it's IPv6-only and fails on Vercel/CI.
- **Schema ownership:** the DB is **shared with n8n**. The Drizzle schema mirrors it and may evolve,
  but reconcile with **`drizzle-kit pull`** and coordinate before any **`drizzle-kit push`** — n8n
  depends on this schema. (The current schema was reconciled against the live DB and matches.)

---

## 9) GET API

- **Multi-org:** org-scoped endpoints **require `?organizacionId=<uuid>`** (400 if missing) — a
  cross-tenant safety constraint, not just a filter. `inbox`/`tareas-borrador` take it optionally
  (scoped via the `telefono = wa_id` join).
- **Auth:** dashboard **light gate** for the hackathon (no per-user auth yet). n8n writes
  out-of-band with its service role, so the app needs no service-role/anon keys.
- **Response shape:** `{ data }` on success; `{ error: { statusCode, message, userMessage } }` on
  failure. Errors map via `http-error-mapper` (`ZodError → 400`, `BaseException → its status`, else 500).

| Endpoint | Query params |
|---|---|
| `GET /api/organizaciones` | — |
| `GET /api/personas` | `organizacionId` (req), `activo` |
| `GET /api/proyectos` | `organizacionId` (req), `activo`, `esBandeja` |
| `GET /api/tareas` | `organizacionId` (req), `proyectoId`, `asignadoId`, `estado`, `prioridad` |
| `GET /api/tareas/[id]` | — (404 if not found) |
| `GET /api/tareas-borrador` | `organizacionId`, `waId`, `estado` |
| `GET /api/inbox` | `organizacionId`, `waId`, `limite` (≤500, default 100) |

`tareas` resolves project + assignee + creator names via joins (aliased `leftJoin`s for the two
person FKs). `inbox`/`tareas-borrador` resolve the sender via `personas.telefono = wa_id`.

---

## 10) Conventions

- **Naming:** Spanish, matching the DB **1:1** — `snake_case` keys, so the API JSON mirrors the DB
  columns. Folders/files `kebab-case`; types/Zod schemas `PascalCase` (schemas end in `Schema`).
- **Validation:** Zod at every external boundary. `parse`/`safeParse`; never trust input.
- **Errors:** services/repositories `throw` typed exceptions derived from `BaseException`.
- **Security:** the app's only secret is the DB connection string (server-only). All WhatsApp / LLM /
  service-role secrets live in n8n, never in this repo. Only `NEXT_PUBLIC_*` could reach the browser.

---

## 11) Decisions log (date + rationale)

- **2026-06-06 — Pivot to n8n.** AI, ingestion, transcription, extraction and the WhatsApp bot moved
  out of the app into **n8n**. The app is now a **dashboard + read API** over Supabase. The old
  in-app pipeline/agents/extension design and the `specs/` documents were removed.
- **2026-06-06 — App reads, n8n writes.** Only n8n writes (`inbox`/`tareas_borrador`/`tareas`) via
  its service role; the app is read-only for now.
- **2026-06-06 — Multi-org via `?organizacionId`** (query param), **dashboard light gate**,
  **Spanish 1:1 naming**, schema **mirrors the provided DDL** (reconciled against the live DB; may evolve).
- **2026-06-06 — `wa_id = personas.telefono`** confirmed (the attribution join).
- **Open / n8n-owned:** draft→task promotion and `proyecto_id` assignment (default `es_bandeja`)
  live in n8n; WhatsApp provider, transcription service and extraction LLM are n8n-internal.

---

## 12) Scope — hackathon vs production

| Area | Hackathon | Production |
|---|---|---|
| Capture + AI | n8n workflow on a test number | hardened workflow, retries, observability |
| Dashboard auth | light gate, single shared access | per-user auth + roles (e.g. Supabase Auth) |
| App writes | none (read-only) | dashboard mutations through layered services |
| Schema | shared with n8n, reconciled by hand | migration discipline + coordination |
| Privacy | test data / consenting users | retention, deletion, audit |

---

## 13) What lives in n8n, not in this repo

WhatsApp capture + provider, audio transcription, task-extraction LLM, the `/bot` conversation +
confirmation, and any scheduling. Previously these were specified in this repo; they are now
**n8n-owned** and intentionally out of scope here.

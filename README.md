# helpr (Halketon) — 1:1 WhatsApp work tracking

A WhatsApp 1:1 assistant that turns each person's messages (text or voice note) into **tracked tasks**
for their team / NGO. The **bot, capture, transcription and task-extraction run in n8n**; **this repo
is the Next.js dashboard + read API** over the shared **Supabase** database.

```txt
WhatsApp ─▶ n8n (capture · transcribe · extract · confirm · promote) ─▶ Supabase ◀─ Next.js (dashboard + GET API)
```

n8n is the brain and the only **writer**; this app is the **reader** and the surface. They share only
the Supabase schema. See **[`ARCHITECTURE.md`](ARCHITECTURE.md)** for the full picture and the DB contract.

## Stack

Next.js 16 (App Router) · Drizzle ORM + `postgres-js` · Supabase Postgres · Zod · Tailwind v4 + shadcn/ui · deploys to Vercel.

## Data model

`organizaciones` → `personas` (by phone) + `proyectos` (one may be the default tray) · `tareas`
(tasks) · `tareas_borrador` (drafts awaiting confirmation) · `inbox` (raw WhatsApp messages from n8n).
Full table reference in [`ARCHITECTURE.md`](ARCHITECTURE.md) §3.

## Read API (multi-org via `?organizacionId`)

`GET /api/organizaciones` · `/api/personas` · `/api/proyectos` · `/api/tareas` (+ `/api/tareas/[id]`)
· `/api/tareas-borrador` · `/api/inbox`. Org-scoped endpoints require `?organizacionId=<uuid>`.
Responses are `{ data }` or `{ error: { statusCode, message, userMessage } }`. Details in §9.

## Local setup

```bash
pnpm install
cp .env.example .env.local      # fill in the two Supabase connection strings (see comments in the file)
pnpm dev                        # dashboard + API at http://localhost:3000
```

Smoke-test the DB wiring once `DATABASE_URL` is set:
`GET /api/organizaciones` (connectivity), then `/api/tareas?organizacionId=<real-uuid>` (joins).

The app needs only the two DB connection strings — no Supabase service-role/anon keys (those live in
n8n). Reconcile the Drizzle schema with the live DB via `pnpm drizzle-kit pull` (uses
`MIGRATION_DATABASE_URL`); **do not** `drizzle-kit push` without coordinating — n8n shares this DB.

## Status

DB layer + read API: done and verified against the live DB. Next: dashboard UI, and dashboard write
actions (reassign / complete / confirm-draft) through the layered services.

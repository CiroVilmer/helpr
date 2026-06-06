# Halketon — Memoria Operativa en WhatsApp para ONGs

Prep + specs for the **Halketon** social hackathon (Track 1: coordinación y memoria interna). A bot that lives inside an NGO's WhatsApp groups and turns conversations into tasks, decisions, responsibilities and searchable memory — surfaced from WhatsApp (primary) and a web dashboard (control).

> **Status:** specs/prep stage. No application code yet — see [`SETUP.md`](SETUP.md) to scaffold the repo.

## Docs

| Doc | Purpose |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Canonical architecture — stack, layers, data model, pipeline, conventions. **Source of truth.** |
| [`SETUP.md`](SETUP.md) | Day-0 repo-setup runbook (folder structure + config, no feature code). |
| [`specs/extension-reader-spec.md`](specs/extension-reader-spec.md) | Chrome extension reader — primary live capture source (reads WhatsApp Web). |
| [`specs/ingestion-spec.md`](specs/ingestion-spec.md) | Source-agnostic ingestion: `/api/ingest` → dedupe → raw store → normalize → batch builder. |
| [`specs/extraction-pipeline-spec.md`](specs/extraction-pipeline-spec.md) | Extraction → reconciliation → state → memory (Claude). |
| [`specs/commands-replies-spec.md`](specs/commands-replies-spec.md) | Generic `/bot` command framework (groups + DMs). |
| `specs/waha-setup-spec.md` | ⚠️ Deprecated — WAHA was dropped (ban risk). Kept only as an optional adapter reference. |
| [`handoffs/`](handoffs/) | Session handoffs to resume with full context. |

## Stack

Next.js (Vercel) · Supabase Postgres + pgvector · Drizzle · Claude · Supabase `pg_cron` · source-agnostic capture (`/api/ingest`; primary source = Chrome extension reader).

Start here: [`ARCHITECTURE.md`](ARCHITECTURE.md), then the latest handoff in [`handoffs/`](handoffs/).

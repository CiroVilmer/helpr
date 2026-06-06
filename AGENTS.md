<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: helpr (Halketon)

**Read `ARCHITECTURE.md` (repo root) before writing any code.** It is the source of truth for this repo: the n8n <-> app boundary (the DB contract), the data model, the layered architecture (route handlers -> services -> repositories), the GET API, and the naming / validation / security conventions.

Quick orientation:
- This repo is the **Next.js dashboard + read API** over Supabase. The WhatsApp bot, capture, transcription and task-extraction run in **n8n** (not here); n8n owns all DB writes.
- `README.md` - overview + local setup. `DEMO.md` - demo notes.

Any structural deviation from `ARCHITECTURE.md` must be justified in the PR description (see its decisions log).

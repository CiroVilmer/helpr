<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Halketon

**Read `ARCHITECTURE.md` (at the repo root) before writing any code.** It is the canonical source of truth for the stack, the layered architecture (route handlers -> services -> repositories), the data model, the ingest -> pipeline -> extraction flow, and the naming / validation / security conventions the whole team builds against.

Supporting docs:
- `SETUP.md` - day-0 repo setup runbook.
- `specs/` - per-feature specs (ingestion, extraction pipeline, commands/replies, extension reader).
- `DEMO.md` - scripted demo conversation + run order.

Any structural deviation from `ARCHITECTURE.md` must be justified in the PR description (see its decisions log).

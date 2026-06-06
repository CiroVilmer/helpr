# Spec — Data Ingestion & DB Pipeline (capture → batch builder), source-agnostic

**Owner:** Ciro.
**Goal:** own the full path from "a message exists" to "a clean, deduplicated, batched conversational window sits in Postgres, ready for the extraction agent." The ingestion is **source-agnostic**: any capture source (Chrome extension reader, paste/import, seed, or a WAHA adapter) maps to **one canonical contract** and flows through the same pipeline.
**Scope boundary:** ends at the **batch builder**. The Extraction Agent and everything after consume the `ConversationBatch` contract (§9). That interface is the only thing the AI-pipeline owner needs.
**Reference:** `ARCHITECTURE.md` §7, §8, §13, CRITICAL rules; `specs/extension-reader-spec.md` (primary source adapter).

> **Source-agnostic by design.** WAHA is no longer the gateway (policy/ban risk). The **Chrome extension reader** (`specs/extension-reader-spec.md`) is the primary live source; **paste/import + seed** is the demo source. Nothing downstream of `raw_messages` knows or cares which source produced a message.

---

## 1) Objectives

1. **Accept** messages from any source via one canonical contract + one generic endpoint.
2. **Persist raw** every message before any processing — the durable boundary.
3. **Never lose, never duplicate** (idempotency on a per-source stable id).
4. **Normalize** into a clean internal shape (author resolved, replies linked, timestamps parsed, type classified).
5. **Batch** pending messages into conversational windows (with context) for extraction.
6. Keep an **audio skeleton** so the optional audio module coexists without schema changes.

**Non-goals (downstream):** extraction, reconciliation, task state, replies, embeddings. You produce batches.

---

## 2) The CONTRACT (inputs & outputs)

### Inputs — one canonical shape, several adapters
Every source produces the **`IngestMessage`** contract (§4) and delivers it to the **generic ingest endpoint** `POST /api/ingest` (or, for import, `POST /api/history/import` which builds the same objects internally).

| Adapter | How it delivers | Status |
|---|---|---|
| **Chrome extension reader** | POSTs `IngestMessage[]` to `/api/ingest` (Bearer `INGEST_API_KEY`) as it reads WhatsApp Web | **Primary (live).** See `specs/extension-reader-spec.md` |
| **Paste / export import** | `/api/history/import` parses a WhatsApp export → `IngestMessage[]` → same enqueue | **Demo source / safety net** |
| **Seed** | curated demo messages inserted as `IngestMessage[]` | Guaranteed-stable demo |
| **WAHA adapter** *(optional/legacy)* | `/api/webhooks/waha` verifies HMAC, maps WAHA payload → `IngestMessage` → same enqueue | Off by default (policy). Kept only as a reference adapter. |

### Outputs
- Rows in **`raw_messages`** (`processing_status='pending'` → `processed`/`failed`).
- Rows in **`message_batches`**.
- A **`ConversationBatch`** object handed to extraction (§9).
- Rows in **`agent_runs`** logging each pipeline run.

### Shared secrets
`INGEST_API_KEY` (the extension/adapters present it), `CRON_SECRET` (guards `process-pending`). (WAHA-only secrets apply only if the WAHA adapter is enabled.) See `ARCHITECTURE.md` §21.

---

## 3) Real DB schema (Drizzle — copy-paste ready)

Source-neutral. Tables you own/touch. Runtime via the 6543 pooler; migrations via 5432 (§13).

```ts
// src/db/schema/organizations.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts
// src/db/schema/groups.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
})
export const whatsappGroups = pgTable('whatsapp_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  externalChatId: text('external_chat_id').notNull(),   // source-neutral chat key (e.g. WA group id from the extension)
  name: text('name'),
  isAuthorized: boolean('is_authorized').notNull().default(false),
  projectId: uuid('project_id').references(() => projects.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts
// src/db/schema/users.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { whatsappGroups } from './groups'
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  displayName: text('display_name').notNull(),
})
export const groupMembers = pgTable('group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => whatsappGroups.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  externalSenderId: text('external_sender_id'),   // source handle/phone if available
  phone: text('phone'),
  displayName: text('display_name'),              // name as seen in the source
})
```

```ts
// src/db/schema/messages.ts
import {
  pgTable, uuid, text, timestamp, jsonb, pgEnum, index, uniqueIndex,
} from 'drizzle-orm/pg-core'
import { whatsappGroups } from './groups'

export const messageSource = pgEnum('message_source', ['extension', 'import', 'seed', 'waha'])
export const processingStatus = pgEnum('processing_status', ['pending', 'processing', 'processed', 'failed'])
export const messageType = pgEnum('message_type', ['text', 'audio', 'image', 'document', 'system', 'reaction', 'other'])

export const rawMessages = pgTable('raw_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: messageSource('source').notNull(),
  externalMessageId: text('external_message_id').notNull(), // DEDUPE KEY — stable id from the source
  groupId: uuid('group_id').references(() => whatsappGroups.id).notNull(),
  senderExternalId: text('sender_external_id'),
  senderName: text('sender_name'),
  ts: timestamp('ts', { withTimezone: true }).notNull(),
  text: text('text'),                                       // body or transcript
  transcript: text('transcript'),                          // audio → filled by optional module
  messageType: messageType('message_type').notNull().default('text'),
  quotedExternalId: text('quoted_external_id'),
  mediaUrl: text('media_url'),
  mediaMime: text('media_mime'),
  rawPayload: jsonb('raw_payload').notNull(),               // original payload from the source (audit)
  processingStatus: processingStatus('processing_status').notNull().default('pending'),
  batchId: uuid('batch_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('raw_messages_external_id_uq').on(t.externalMessageId), // dedupe
  index('raw_messages_status_group_idx').on(t.processingStatus, t.groupId, t.ts),
])

export const batchStatus = pgEnum('batch_status', ['built', 'extracted', 'failed'])
export const messageBatches = pgTable('message_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => whatsappGroups.id).notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  messageIdsHash: text('message_ids_hash').notNull(),
  status: batchStatus('status').notNull().default('built'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('message_batches_identity_uq').on(t.groupId, t.messageIdsHash),
])
```

```ts
// src/db/schema/runs.ts
import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
export const runStatus = pgEnum('run_status', ['ok', 'failed'])
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id'),
  stage: text('stage').notNull(),               // 'capture' | 'normalize' | 'batch' | 'extraction' | ...
  model: text('model'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  status: runStatus('status').notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})
```

> `tasks`, `decisions`, `knowledge_facts`, `summaries`, `embeddings` are downstream-owned (see `specs/extraction-pipeline-spec.md`).

---

## 4) Canonical ingest contract (Zod)

Every adapter maps its native shape to this. This is the source-agnostic boundary.

```ts
// src/types/ingestion/dto/ingest-message.ts
import { z } from 'zod'

export const IngestMessageSchema = z.object({
  source: z.enum(['extension', 'import', 'seed', 'waha']),
  externalMessageId: z.string(),        // STABLE per source → dedupe.
                                        //   extension: WhatsApp Web DOM data-id; import: synthetic hash; waha: payload.id
  groupExternalId: z.string(),          // the chat key from the source → maps to whatsapp_groups.externalChatId
  sender: z.object({
    externalId: z.string().nullable(),  // phone/handle if the source exposes it
    name: z.string().nullable(),        // display name as seen
  }),
  ts: z.string(),                       // ISO 8601 (adapter converts source time)
  text: z.string().default(''),
  type: z.enum(['text', 'audio', 'image', 'document', 'system', 'reaction', 'other']).default('text'),
  quotedExternalId: z.string().nullable().optional(),
  media: z.object({ url: z.string().nullable(), mime: z.string().nullable() }).nullable().optional(),
  raw: z.unknown().optional(),          // original payload, stored to rawPayload for audit
})
export const IngestBatchSchema = z.object({ messages: z.array(IngestMessageSchema).min(1) })
export type IngestMessage = z.infer<typeof IngestMessageSchema>
```

**Adapter mapping examples (one-liners):**
- **Extension** → already produces `IngestMessage` (source `'extension'`, `externalMessageId` = DOM `data-id`).
- **Import** → parse each export line → `IngestMessage` (source `'import'`, `externalMessageId` = `import_<hash(line+idx)>`).
- **WAHA (optional)** → `payload.id → externalMessageId`, `from → groupExternalId`, `participant → sender.externalId`, `body → text`. Plus HMAC verify before mapping.

---

## 5) Flow — generic ingest endpoint (fast path, NO LLM)

`POST /api/ingest` — runtime `nodejs`, `dynamic = 'force-dynamic'`. Per CRITICAL rule 1: authenticate → validate → resolve+authorize group → dedupe-insert pending → 200. No processing here.

```ts
// src/app/api/ingest/route.ts
import { IngestBatchSchema } from '@/types/ingestion/dto/ingest-message'
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

`ingestionService.enqueueMany` rules (per message):
- Resolve `groupId` from `groupExternalId` (`whatsapp_groups.externalChatId`). **If group not found or `is_authorized=false` → skip that message** (don't insert).
- `INSERT raw_messages (... processing_status='pending', source, rawPayload=raw ?? message)` with **`ON CONFLICT (external_message_id) DO NOTHING`** → dedupe.
- Classify/keep `messageType`. If media: store `mediaUrl`/`mediaMime`, leave `transcript` null.
- **No pipeline run here.** Return counts.

> The **WAHA adapter** (`/api/webhooks/waha`), if ever enabled, does HMAC verify over the raw body, maps the payload to `IngestMessage`, and calls the same `enqueueMany`. It's the one adapter that needs raw-body handling; the generic endpoint does not.

---

## 6) Flow — process pending (claim → normalize → batch)

`POST /api/pipeline/process-pending` — guarded by `CRON_SECRET`. Triggered by the **manual dashboard button** and **Supabase pg_cron** (`ARCHITECTURE.md` §14). Source-independent — operates on `raw_messages` regardless of origin.

**1. Auth:** `Authorization: Bearer ${CRON_SECRET}` else 401.

**2. Claim** (concurrency-safe):
```sql
UPDATE raw_messages SET processing_status='processing'
WHERE id IN (
  SELECT id FROM raw_messages
  WHERE processing_status='pending' AND group_id = $1
  ORDER BY ts LIMIT $batchSize
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```
Loop per authorized group with pending rows.

**3. Normalize** each claimed message:
- Author: `senderExternalId`/`senderName` → look up/create `group_members` + `users` (`resolveMember`). **Provision a member if unseen** (same logic the command path reuses).
- Timestamp → `Date`. Replies: resolve `quotedExternalId`. Text: `text`; if `type='audio'` and `transcript` present → use transcript.
- Drop low-signal `system`/`reaction` empties from extraction (can still persist).

**4. Batch build:**
- Window = claimed pending messages for the group, ordered by `ts`.
- **Context:** prepend the last **N (default 10)** already-`processed` messages of that group.
- `messageIdsHash = sha256(sorted(claimed external_message_ids))`.
- `INSERT message_batches (... status='built')` `ON CONFLICT (group_id, message_ids_hash) DO NOTHING`.
- Set `raw_messages.batch_id` on claimed rows.

**5. Hand off** the `ConversationBatch` (§9) to extraction (out of scope beyond building it).

**6. Finalize:** mark `processed`/`failed`; write `agent_runs`; reset rows stuck in `processing` > 10 min back to `pending` on the next run.

---

## 7) Flow — history import (demo source / safety net)

`POST /api/history/import` — builds `IngestMessage[]` and calls the same `enqueueMany`.
- **Pasted/exported chat** (`text/plain`): WhatsApp export lines `DD/MM/YY, HH:MM - Sender: message` → one `IngestMessage` each (`source='import'`, synthetic `externalMessageId`, `groupExternalId` = the target group's `externalChatId`).
- **Seed**: curated demo messages (`source='seed'`).
- Same dedupe → re-importing is safe. Group must exist + be authorized.

---

## 8) Idempotency, ordering & concurrency (hard rules)

- **Dedupe key = `externalMessageId`** (unique). Re-delivery / re-import → `ON CONFLICT DO NOTHING`.
- **Message states:** `pending → processing → processed/failed`. Only `pending` is claimable.
- **Batch identity:** `(group_id, message_ids_hash)` unique → rebuilding a window is a no-op.
- **Concurrency:** `FOR UPDATE SKIP LOCKED` on claim.
- **Crash recovery:** stuck `processing` rows reset to `pending` after a timeout.
- **Ordering:** order by `ts` within a group; out-of-order arrival is fine (batching sorts by `ts`).

---

## 9) Downstream contract — `ConversationBatch` (interface to extraction)

The only thing the extraction owner consumes. Frozen; change by agreement.

```ts
// src/types/pipeline/dto/conversation-batch.ts
import { z } from 'zod'
export const BatchMessageSchema = z.object({
  id: z.string(),                 // raw_messages.id (UUID) — agent uses these as source_message_ids
  externalMessageId: z.string(),
  author: z.string(),             // resolved display name
  authorId: z.string().nullable(),// users.id if mapped
  ts: z.string(),                 // ISO 8601
  text: z.string(),               // body or transcript
  type: z.string(),
  quotedText: z.string().nullable(),
})
export const ConversationBatchSchema = z.object({
  batchId: z.string(),
  groupId: z.string(),
  projectId: z.string().nullable(),
  messages: z.array(BatchMessageSchema),       // the window to extract from
  context: z.array(BatchMessageSchema),        // last N processed messages, context only
})
export type ConversationBatch = z.infer<typeof ConversationBatchSchema>
```

**Seam rules (state to the extraction owner):**
- Extraction **gates on `message_batches.status`** (`built` → `extracted`), **never** on message status (ingestion marks messages `processed` at batch-build time).
- `context[]` is **read-only** — extract only from `messages[]`, or you get duplicate tasks.

---

## 10) Audio — ADDITIONAL, but the skeleton must exist

Optional for the demo, but the schema/flow must accommodate it (zero migrations later).
- Columns present: `messageType='audio'`, `mediaUrl`, `mediaMime`, `transcript`.
- No-op stub:
  ```ts
  // src/repositories/transcription/transcription.repository.ts
  import { env } from '@/lib/env'
  export async function transcribeIfEnabled(mediaUrl: string, mime: string): Promise<string | null> {
    if (!env.OPENAI_API_KEY) return null
    // TODO (optional module): download media, gpt-4o-mini-transcribe, return text
    return null
  }
  ```
- **Env (important):** declare `OPENAI_API_KEY: z.string().min(1).optional()` in `lib/env.ts` — **not** required, or the build fails when it's absent (the demo default).
- Normalizer audio branch: if transcript present → use as text; else low-signal (skipped by extraction, not an error).

---

## 11) Repository surface (what you implement)

```
messages.repository.ts   enqueueMany(IngestMessage[]) [on-conflict-do-nothing, returns {accepted,deduped}] ·
                         classifyType · claimPending(groupId, batchSize) · markProcessed(ids) ·
                         markFailed(ids, error) · resetStuckProcessing(timeout) · lastNProcessed(groupId, n) ·
                         createBatch(groupId, window, hash) [on-conflict-do-nothing] · attachMessagesToBatch(batchId, ids)
groups.repository.ts     findByExternalChatId(chatId) · isAuthorized(groupId) ·
                         resolveMember(groupId, externalSenderId, name)   // provisions if unseen
runs.repository.ts       startRun(stage, batchId?) · finishRun(id, status, tokens?, error?)
```
All validate with Zod before writing; all throw typed exceptions, never return error objects.

---

## 12) Acceptance criteria (definition of done)

- [ ] **Precondition:** an `organizations` row + an `is_authorized=true` `whatsapp_groups` row (with the test group's `externalChatId`) exist (build order §13). Without it, everything silently no-ops.
- [ ] `POST /api/ingest` with a valid `IngestMessage[]` and the right `INGEST_API_KEY` inserts one `pending` row per new message; **duplicate `externalMessageId` inserts nothing**; bad/no key → `401`.
- [ ] A message for an **unauthorized/unknown** group is skipped (no insert), endpoint still `200`.
- [ ] The **same pipeline** processes messages regardless of `source` (`extension` / `import` / `seed`).
- [ ] `process-pending` (right `CRON_SECRET`) claims with `FOR UPDATE SKIP LOCKED`, normalizes, builds a `message_batches` row, sets `batch_id`, marks `processed`, writes `agent_runs`. Wrong/no secret → `401`.
- [ ] Two concurrent `process-pending` calls never double-process a row.
- [ ] Output validates against `ConversationBatchSchema`, `context` = last N processed.
- [ ] **Import path** produces `pending` rows through the identical pipeline; re-import is a no-op.
- [ ] **Audio skeleton:** an `audio` message stores media fields, `transcript` null, normalizer handles it; `transcribeIfEnabled` returns null with no key.
- [ ] Stuck `processing` rows recover to `pending` on the next run.

---

## 13) Suggested build order (for you / for Claude)

1. Schema (§3) → `drizzle-kit push` to the shared dev DB. Enable `pgvector` (downstream needs it).
2. **Seed the bootstrap row (do this immediately — nothing ingests without it):** one `organizations` + one `is_authorized=true` `whatsapp_groups` mapped to the test group's `externalChatId`. Until it exists, `enqueueMany` skips **every** message silently. Get the `externalChatId` from the extension dev (the WhatsApp group id the extension reports).
3. `lib/env.ts` (`INGEST_API_KEY`, plus `OPENAI_API_KEY` **optional** — §10) + `db/index.ts` + canonical contract (§4).
4. `messages.repository` + `groups.repository` (+ `runs.repository`).
5. Generic `/api/ingest` endpoint (§5) + `enqueueMany`. **Test with a curl of a hand-written `IngestMessage[]`** — no extension/WAHA needed.
6. `process-pending`: claim → normalize → batch (§6). Log the `ConversationBatch` until extraction exists.
7. History import (§7) + a seed conversation in `DEMO.md`.
8. Audio skeleton wiring (§10).
9. Verify §12.

> **Verify the source's real shape day-0:** the canonical contract is the boundary, but each adapter must actually produce it. Confirm with the **extension dev** that what the extension POSTs parses against `IngestMessageSchema` (esp. `externalMessageId` from the DOM `data-id`, and `groupExternalId`) before building on top.

> Hand this file to Claude to implement directly, or run `superpowers:brainstorming` to produce a step plan. Contracts (§3, §4, §9) are fixed — what the source adapters and the extraction owner build against.

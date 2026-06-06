# Spec — Extraction, Reconciliation & Memory Pipeline (batch → tasks/decisions/memory)

**Owner:** AI-pipeline dev (architecture §22, Dev B + Dev D).
**Goal:** turn a `ConversationBatch` into confirmed operational state — tasks (with responsibles, dates, status), decisions, progress updates, and institutional memory — all traceable to source messages, with confidence flags.
**Scope boundary:** **starts** at the `ConversationBatch` contract (ingestion-spec §9) and **ends** at persisted `tasks` / `task_updates` / `decisions` / `knowledge_facts` / `summaries` (+ embeddings enqueued). The **bot reply / `@bot` command** path is a *separate spec* — this pipeline is the "make sense of the conversation" path, not the "answer the user" path.
**Reference:** `ARCHITECTURE.md` §4.4, §7, §12, §16, §18; `specs/ingestion-spec.md` §9 (input contract).

> Self-contained: contract + objectives + real schema + agent prompts/rules + idempotency + acceptance criteria. Hand to Claude to implement directly, or feed to `superpowers:brainstorming` for a step-by-step plan. The input/output contracts (§2, §4) are fixed — they're what ingestion and the commands owner build against.

---

## 1) Objectives

1. **Extract** structured items (tasks, decisions, progress, open questions, facts) from a conversational batch, each with `confidence` + `source_message_ids`.
2. **Reconcile** against existing state — decide create / update / duplicate / ambiguous, so the same task isn't created twice across batches.
3. **Apply** changes **deterministically** (no LLM in the writer), resolving assignees and due dates, with confidence-based review flags.
4. **Build memory** — store decisions/facts/summaries and enqueue embeddings for semantic recall.
5. **Stay idempotent and traceable** — reprocessing a batch creates no duplicates; every entity links to its source messages.

**Non-goals:** receiving/normalizing/batching messages (ingestion owns that); replying in WhatsApp / `@bot` commands (separate spec); the dashboard UI.

---

## 2) The CONTRACT (inputs & outputs)

### Input — `ConversationBatch` (from ingestion-spec §9, frozen)
```ts
type BatchMessage = {
  id: string            // raw_messages.id (UUID) — use as source_message_ids
  externalMessageId: string
  author: string
  authorId: string | null
  ts: string            // ISO 8601
  text: string
  type: string
  quotedText: string | null
}
type ConversationBatch = {
  batchId: string
  groupId: string
  projectId: string | null
  messages: BatchMessage[]   // EXTRACT FROM THESE ONLY
  context: BatchMessage[]    // read-only, for understanding; NEVER extract from these
}
```
**Seam rules (hard):** gate on `message_batches.status` (`built` → `extracted`), **never** on message status. Extract only from `messages[]`; `context[]` is read-only — extracting from it produces duplicates.

### Output
- Rows in `tasks`, `task_assignments`, `task_updates`, `decisions`, `knowledge_facts`, `summaries`, `extracted_items`.
- Embedding rows enqueued in `embeddings` (when an embedding key is configured; degrades gracefully otherwise — §10).
- `message_batches.status='extracted'` and an `agent_runs` row per stage (`extraction`, `reconciliation`, `memory`).

---

## 3) Real DB schema (Drizzle — copy-paste ready)

Downstream tables this pipeline owns. References `projects` (`groups.ts`) and `users` (`users.ts`) from the ingestion schema. `embeddings` matches architecture §13.

```ts
// src/db/schema/tasks.ts
import {
  pgTable, uuid, text, timestamp, real, pgEnum, uniqueIndex, index,
} from 'drizzle-orm/pg-core'
import { projects } from './groups'
import { users } from './users'

export const taskStatus = pgEnum('task_status', ['open', 'in_progress', 'blocked', 'done'])
export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high'])
export const reviewFlag = pgEnum('review_flag', ['none', 'review', 'critical'])

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatus('status').notNull().default('open'),
  priority: taskPriority('priority'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  confidence: real('confidence'),
  reviewFlag: reviewFlag('review_flag').notNull().default('none'),
  sourceMessageIds: uuid('source_message_ids').array(),
  extractionHash: text('extraction_hash'),               // idempotency (re-processed batch)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('tasks_extraction_hash_uq').on(t.extractionHash), // NULLs are distinct → manual tasks ok
  index('tasks_project_status_idx').on(t.projectId, t.status),
])

export const assignmentRole = pgEnum('assignment_role', ['responsible', 'collaborator'])
export const taskAssignments = pgTable('task_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),     // null when unresolved
  assigneeHint: text('assignee_hint'),                    // raw name from chat if unmapped
  role: assignmentRole('role').notNull().default('responsible'),
})

export const updateKind = pgEnum('update_kind', ['progress', 'blocker', 'done', 'note'])
export const taskUpdates = pgTable('task_updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  kind: updateKind('kind').notNull(),
  note: text('note'),
  sourceMessageIds: uuid('source_message_ids').array(),
  confidence: real('confidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts
// src/db/schema/decisions.ts
import { pgTable, uuid, text, timestamp, real, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from './groups'
import { reviewFlag } from './tasks'
export const decisions = pgTable('decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  sourceMessageIds: uuid('source_message_ids').array(),
  confidence: real('confidence'),
  reviewFlag: reviewFlag('review_flag').notNull().default('none'),
  extractionHash: text('extraction_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [ uniqueIndex('decisions_extraction_hash_uq').on(t.extractionHash) ])
```

```ts
// src/db/schema/memory.ts
import { pgTable, uuid, text, timestamp, real, pgEnum } from 'drizzle-orm/pg-core'
import { projects, whatsappGroups } from './groups'
export const knowledgeFacts = pgTable('knowledge_facts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  fact: text('fact').notNull(),
  sourceMessageIds: uuid('source_message_ids').array(),
  confidence: real('confidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
export const summaries = pgTable('summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => whatsappGroups.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  period: text('period').notNull(),         // 'daily' | 'weekly' | ISO range
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
// Low-confidence / unstructured items + open questions (architecture §16 exception path).
// NOTE: extends architecture §7 — documented deviation.
export const extractedItemKind = pgEnum('extracted_item_kind', ['open_question', 'low_confidence'])
export const extractedItems = pgTable('extracted_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  kind: extractedItemKind('kind').notNull(),
  content: text('content').notNull(),
  sourceMessageIds: uuid('source_message_ids').array(),
  confidence: real('confidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts
// src/db/schema/embeddings.ts  (architecture §13)
import { pgTable, uuid, text, vector, index } from 'drizzle-orm/pg-core'
export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerType: text('owner_type').notNull(),   // 'decision' | 'fact' | 'summary' | 'message'
  ownerId: uuid('owner_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // text-embedding-3-small
}, (t) => [ index('embeddings_idx').using('hnsw', t.embedding.op('vector_cosine_ops')) ])
```

---

## 4) Agent contracts (Zod)

```ts
// src/types/pipeline/dto/extraction.ts
import { z } from 'zod'

export const ExtractedTaskSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  assigneeHint: z.string().nullable(),     // raw name/mention as written in chat
  dueDateHint: z.string().nullable(),      // raw phrase, e.g. "antes del viernes"
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  sourceMessageIds: z.array(z.string()),   // BatchMessage.id values
  confidence: z.number().min(0).max(1),
})
export const ExtractedDecisionSchema = z.object({
  title: z.string(), sourceMessageIds: z.array(z.string()), confidence: z.number().min(0).max(1),
})
export const ProgressUpdateSchema = z.object({
  taskHint: z.string(),                    // which task it refers to (text)
  note: z.string(),
  kind: z.enum(['progress', 'blocker', 'done']),
  sourceMessageIds: z.array(z.string()), confidence: z.number().min(0).max(1),
})
export const OpenQuestionSchema = z.object({
  question: z.string(), sourceMessageIds: z.array(z.string()), confidence: z.number().min(0).max(1),
})
export const KnowledgeFactSchema = z.object({
  fact: z.string(), sourceMessageIds: z.array(z.string()), confidence: z.number().min(0).max(1),
})
export const ExtractionResultSchema = z.object({
  tasks: z.array(ExtractedTaskSchema),
  decisions: z.array(ExtractedDecisionSchema),
  progressUpdates: z.array(ProgressUpdateSchema),
  openQuestions: z.array(OpenQuestionSchema),
  facts: z.array(KnowledgeFactSchema),
})
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

// src/types/pipeline/dto/reconciliation.ts
export const ReconciliationActionSchema = z.object({
  itemRef: z.string(),                     // index/key of the extracted item being judged
  itemType: z.enum(['task', 'progress', 'decision', 'fact']),
  action: z.enum(['create', 'update', 'duplicate', 'ambiguous']),
  targetId: z.string().nullable(),         // existing row id when update/duplicate
  reason: z.string(),
  confidence: z.number().min(0).max(1),
})
export const ReconciliationResultSchema = z.object({ actions: z.array(ReconciliationActionSchema) })
```

---

## 5) Claude integration (architecture §12)

- Client: `@anthropic-ai/sdk`, module-level singleton, explicit `timeout` below the function `maxDuration` (e.g. 90s), `maxRetries: 2`.
- **Structured output — primary:** `client.messages.parse()` + `zodOutputFormat(ExtractionResultSchema)`. Returns a typed object; `res.parsed_output` is `null` on refusal/`max_tokens` → guard it. (Fallback only if needed: tool-use forcing — don't build both.)
- **Prompt caching:** the large static system prompt goes in `system` with `cache_control: { type: 'ephemeral' }`. **Min cacheable prefix: Haiku ≥4096 tokens, Sonnet ≥2048** — if the prompt is shorter it silently won't cache. Verify `res.usage.cache_read_input_tokens > 0`. No `Date.now()`/UUIDs in the cached prefix; serialize deterministically.
- **Model selection:** extraction → `claude-haiku-4-5`; reconciliation → `claude-sonnet-4-6` (escalate genuinely ambiguous cases to `claude-opus-4-8`); memory summaries → `claude-haiku-4-5`.
- **Validation loop:** validate every output with Zod before any DB write; on mismatch retry once feeding the error back **after** the cached prefix; cap at 1 retry. Check `stop_reason`: `max_tokens` → raise limit; `refusal` → surface, don't loop.

---

## 6) Stage 1 — Extraction Agent

**Input:** the `ConversationBatch`. Render `messages[]` and `context[]` as a labeled transcript (`[id] author (ts): text`, quoted text inline). **Output:** `ExtractionResult`.

**System prompt rules (encode these):**
- You are an operational coordinator for an Argentine NGO's WhatsApp group, **not** a general chatbot. Input is Argentine Spanish, often informal.
- Extract **only** from the messages marked as the window; use the context block **only to understand** — never extract items whose source is solely a context message.
- Every item carries `sourceMessageIds` (the `[id]`s it came from) and a calibrated `confidence` 0–1. **Be honest with confidence** — low is fine; don't inflate.
- A task needs an actionable title. If a request is vague ("habría que ver lo de los voluntarios") with no clear action/owner → `openQuestions`, not `tasks`.
- Detect: tasks ("Lu, ¿podés llamar a los voluntarios antes del viernes?"), decisions ("queda definido que el taller es el sábado"), progress ("ya mandé el mail"), blockers, open questions, institutional facts.
- `assigneeHint`/`dueDateHint` are raw text as written ("Lu", "antes del viernes") — do **not** resolve them; the deterministic stage does.
- Never invent people, dates, or commitments not present in the text.

Persist nothing here — return the validated object to reconciliation.

---

## 7) Stage 2 — Reconciliation Agent

**Purpose:** avoid duplicates and link progress to existing tasks. **Input:** the `ExtractionResult` + the current open state of the project. **Output:** `ReconciliationResult`.

**Candidate retrieval (before calling the LLM):**
- Fetch the project's **open/in-progress/blocked** `tasks` and recent `decisions` (bounded; most groups are small). If a project ever has many tasks, shortlist by lexical similarity (Postgres `pg_trgm` on title) or embedding similarity (§10) to the top ~20.
- Pass the new extracted items + these candidates (id + title + status) to the agent.

**The agent decides, per item:**
- `create` — no matching existing entity.
- `update` — a progress/blocker/done that refers to an existing task (`targetId`), or new info on an existing one.
- `duplicate` — same task/decision already exists (`targetId`) → skip create.
- `ambiguous` — matches more than one, or unclear → defer to a flagged item.

**Deterministic backstop (not the LLM):** before trusting `create`, the State Manager recomputes `extraction_hash = sha256(normalize(title) + sha256(sorted sourceMessageIds))` and checks the unique index — a reprocessed identical batch never double-creates regardless of what the agent says.

---

## 8) Stage 3 — Task State Manager (DETERMINISTIC — no LLM)

Plain code. Applies reconciliation actions with confidence-driven flags (architecture §16).

**Confidence → action/flag:**
| confidence | action | `review_flag` |
|---|---|---|
| ≥ 0.50 | apply | `none` |
| 0.20–0.49 | apply | `review` |
| < 0.20 | apply if structured enough, else → `extracted_items` | `critical` |
| no actionable title/context | → `extracted_items(kind='low_confidence')`, not a task | — |
| `openQuestions` | → `extracted_items(kind='open_question')` | — |

**Per action:**
- `create` task → resolve assignee + due date (below), `INSERT tasks` with `confidence`, `review_flag`, `source_message_ids`, `extraction_hash` (on-conflict-do-nothing on the hash). Insert `task_assignments`.
- `update` (progress) → `INSERT task_updates`; if `kind='done'` and confidence ≥ 0.5, set `tasks.status='done'` (else leave + flag — **never auto-close on ambiguity**, architecture §12). If `kind='blocker'` → `status='blocked'`.
- `duplicate` → skip, log to `agent_runs`/`audit_log`.
- `ambiguous` → `extracted_items` with the reason.
- decisions → `INSERT decisions` (same hash/flag logic).

**Assignee resolution (deterministic):** match `assigneeHint` against `group_members.pushName` / `users.displayName` (case/accent-insensitive, then fuzzy). Match → `task_assignments.userId`; no match → store `assigneeHint`, `userId=null` (dashboard maps later).

**Due-date resolution (deterministic):** parse `dueDateHint` relative to the batch's latest message date (use a date lib like `chrono-node`, locale `es`). Parsed → `tasks.dueDate`; unparseable → leave `dueDate` null and keep the hint in `description`.

Every write goes through repositories (Zod-validated) and appends to `audit_log` with `source` + `source_message_ids`.

---

## 9) Stage 4 — Memory Agent

**Input:** non-actionable facts + the batch. **Output:** `knowledge_facts`, `decisions` (those already handled in §8 may be referenced), `summaries`, and enqueued embeddings.
- Store `knowledge_facts` (institutional info: "el contacto de la escuela es X").
- Generate/refresh a short **summary** per group/period when the batch closes a window (optional for MVP; gate behind "core works").
- **Enqueue embeddings** for newly written decisions, facts, summaries, and meaningful processed messages (§10).

---

## 10) Embeddings & semantic search

- **Model:** OpenAI `text-embedding-3-small` (1536 dims → matches the `vector(1536)` column).
- **Graceful degradation:** embeddings require an embedding key. If `OPENAI_API_KEY` is unset, **skip embedding writes silently** (no error) — semantic recall then falls back to lexical (`pg_trgm`) search. The pipeline must never fail because embeddings are off. (Same optional-env rule as ingestion-spec §10: declare the key `.optional()`.)
- **Index:** HNSW + `vector_cosine_ops` (already in the schema).
- **Similarity query** (used by memory recall and optional reconciliation shortlist):
  ```ts
  import { cosineDistance, desc, gt, sql } from 'drizzle-orm'
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, q)})`
  const hits = await db.select({ ownerType: embeddings.ownerType, ownerId: embeddings.ownerId, content: embeddings.content, similarity })
    .from(embeddings).where(gt(similarity, 0.5)).orderBy(t => desc(t.similarity)).limit(5)
  ```
  Keep `orderBy` on the distance expression so HNSW is used.

> The `@bot que se decidió sobre ...` command (separate spec) reads through this same table. This pipeline only **writes** embeddings; the command path queries them.

---

## 11) Idempotency, gating & ordering (hard rules)

- **Gate on `message_batches.status`** (`built` → process → `extracted`/`failed`). Only `built` batches are processed.
- **`extraction_hash` unique** on `tasks`/`decisions` → reprocessing a batch never double-creates.
- **`context[]` is read-only** — never extract from it (those messages were already covered).
- **Failure isolation:** a failing batch → `message_batches.status='failed'` + `agent_runs` error; don't poison other batches. Reset stuck batches on the next run.
- **No auto-close on ambiguity:** `done` only when confidence ≥ 0.5 and unambiguous; otherwise flag.

---

## 12) Orchestration (where this runs)

Called by `/api/pipeline/process-pending` (ingestion-spec §6) **after** batch building, per `built` batch:
```
for each built batch:
  startRun('extraction')   → ExtractionResult         (Claude, §6)
  startRun('reconciliation') → ReconciliationResult   (candidates + Claude, §7)
  applyState(reconciliation)                          (deterministic, §8)
  memory(batch, facts)                                (§9, + enqueue embeddings)
  mark batch 'extracted'; finishRun(...)
  on error → batch 'failed', finishRun(status='failed', error)
```
The same endpoint is hit by the manual dashboard button and Supabase pg_cron. Extraction work is bounded by `maxDuration` — keep batches small; process one group's batch per invocation if needed.

---

## 13) Acceptance criteria (definition of done)

- [ ] Given a seeded `ConversationBatch` (a scripted Spanish group convo), extraction returns an object that validates against `ExtractionResultSchema`, with correct `sourceMessageIds`.
- [ ] A clear task ("Lu, ¿podés llamar a los voluntarios antes del viernes?") → one `tasks` row, assignee resolved to a `group_members`/`users` match when present, `dueDate` parsed from "viernes".
- [ ] A progress message ("ya mandé el mail") about an existing task → a `task_updates` row, not a new task.
- [ ] **Reprocessing the same batch creates zero new tasks/decisions** (extraction_hash).
- [ ] A vague message with no action → `extracted_items(kind='open_question')`, not a task.
- [ ] Confidence flags applied per §8 (≥0.5 none, 0.2–0.49 review, <0.2 critical).
- [ ] `done`/blocker updates change `tasks.status` only when confidence ≥ 0.5 and unambiguous.
- [ ] Memory: facts stored; with an embedding key set, `embeddings` rows are written; **with the key unset, the pipeline completes without error and writes none**.
- [ ] Batch ends as `message_batches.status='extracted'`; an `agent_runs` row exists per stage with token counts.
- [ ] Prompt caching verified (`cache_read_input_tokens > 0` after the first call).

---

## 14) Build order (for you / for Claude)

1. Schema §3 → add to the shared DB (`drizzle-kit push`). Confirm `pgvector` extension is enabled (ingestion build §13.1).
2. Zod contracts §4 (`ExtractionResultSchema`, `ReconciliationResultSchema`).
3. `lib/claude/client.ts` (singleton + caching helper) + the extraction system prompt.
4. Extraction Agent §6 → validate against a seeded batch logged by ingestion (`console.log` the `ConversationBatch`, feed it in).
5. Repositories: `tasks`, `decisions`, `memory` (+ reuse `runs` from ingestion).
6. Reconciliation Agent §7 (candidate fetch + LLM) → `ReconciliationResult`.
7. **State Manager §8 (deterministic)** — assignee + due-date resolution, confidence flags, hash dedupe. This is the correctness core; test it hard.
8. Memory Agent §9 + embeddings §10 (with the no-op-when-no-key guard).
9. Wire into `process-pending` §12; mark batches `extracted`.
10. Verify all of §13.

---

## 15) Coordination points

- **With ingestion owner (Ciro):** the `ConversationBatch` shape (§2) is frozen; gate on batch status; `context[]` read-only. Agree on who runs `drizzle-kit push` for these tables (the schema spans both halves).
- **With the commands owner:** they read `tasks`/`decisions`/`embeddings` for `@bot` replies — they only read what this pipeline writes. Confirm the `review_flag` semantics and that they don't write state (replies don't mutate tasks; only the State Manager does).
- **Schema deviation noted:** `extracted_items` extends architecture §7 — record it in the architecture's pending-decisions log.
```

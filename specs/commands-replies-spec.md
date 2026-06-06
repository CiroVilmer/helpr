# Spec — Commands & Replies (`/bot …`, group + DM)

**Owner:** commands dev (architecture §22, Dev D).
**Goal:** a **generic, extensible command framework** that lets the bot answer `/bot …` requests **in groups and in 1:1 chats**, reading what the extraction pipeline writes (tasks, decisions, memory) and replying in WhatsApp. Adding a new command must be a few lines — register a handler, done.
**Scope boundary:** this is the **"answer the user"** path, separate from the extraction pipeline (the "make sense of the conversation" path, `specs/extraction-pipeline-spec.md`). It mostly **reads**; the two write-commands (`crear tarea`, `hecha`) go **through the deterministic State Manager**, never writing task tables directly.
**Reference:** `ARCHITECTURE.md` §10 (commands), §12, §20; `specs/ingestion-spec.md` §5 (webhook); `specs/extraction-pipeline-spec.md` §3 (tables read), §10 (semantic search).

> Self-contained: framework contracts + flow + scope/auth + the initial command set + an "add a command" recipe + acceptance criteria. Hand to Claude to implement, or feed `superpowers:brainstorming` for a plan.

---

## 0) Two convention changes vs the architecture (intentional)

1. **Prefix is `/bot`, not `@bot`.** Works uniformly in groups and DMs; reads as a command, not a mention. `ARCHITECTURE.md` §10 updated accordingly.
2. **Commands are answered at capture time (fast), not inside the 5–15 min batch pipeline.** A command must feel instant; waiting for the cron is wrong UX. The capture path detects a command and processes it in `after()` (post-response), so the ack stays fast (CRITICAL rule 1 respected) while the reply happens right after. This refines `ARCHITECTURE.md` §8.2 (Command Router was listed inside `process-pending`).
3. **Source-agnostic capture & reply channel** *(gateway pivot — see `specs/extension-reader-spec.md` + `ingestion-spec.md`)*. WAHA is no longer the gateway. Read every "WAHA webhook" mention below generically as **"the capture path"**: group `/bot` messages arrive via the **Chrome extension → `/api/ingest`** (the extension can flag/forward commands), and DMs (if used) via a Cloud API webhook. **Replies** go back through the **same channel as capture**: the extension injects a send into WhatsApp Web; Cloud API sends for DMs. The dispatcher/registry/handlers (the bulk of this spec) are channel-independent and unchanged — only the thin send/receive adapter differs. *(A fuller de-WAHA pass of this spec is a follow-up; the framework itself doesn't change.)*

---

## 1) Objectives

1. Detect `/bot …` in any incoming message (group or DM) and route it to a handler.
2. A **command registry**: register `{ name, scope, handler }`; the dispatcher does parse → match → auth → execute → reply. New commands need no dispatcher changes.
3. Work in **both contexts**: group commands scope to the group's project; DM commands scope to the sender's org.
4. **Read** the extraction outputs to answer (tasks, decisions, memory/semantic search). **Write** only via the State Manager for the two explicit mutating commands.
5. Reply in WhatsApp via WAHA, threaded to the command message; short, WhatsApp-friendly text.
6. Be **idempotent** (a retried webhook never double-replies) and **safe** (unknown sender / wrong scope / errors → friendly message, never a crash or silence-confusion).

**Non-goals:** the extraction/reconciliation/state pipeline; the dashboard; proactive/periodic messages (the bot is silent unless invoked — architecture §2).

---

## 2) The command framework (the generic core)

### Types
```ts
// src/services/commands/types.ts
export type CommandScope = 'group' | 'dm' | 'both'

export interface CommandContext {
  argsRaw: string                 // everything after the command name
  args: string[]                  // whitespace-tokenized argsRaw
  chatId: string                  // "...@g.us" | "...@c.us"  (where to reply)
  isGroup: boolean
  messageId: string               // command message id (reply_to + dedupe)
  sender: { participantId: string; userId: string | null; displayName: string }
  org: { id: string }
  group: { id: string; projectId: string | null } | null   // null in DM
}

export interface CommandReply { text: string }   // extend later: mentions, media

export interface Command {
  name: string                    // primary trigger, may be multi-word ("mis tareas")
  aliases?: string[]
  description: string             // shown by /bot help (auto-generated)
  usage?: string                  // e.g. "/bot crear tarea: <texto>"
  scope: CommandScope
  usesLLM?: boolean
  handler: (ctx: CommandContext) => Promise<CommandReply>
}
```

### Registry + parser + matcher
```ts
// src/services/commands/registry.ts
import type { Command } from './types'

export const PREFIX = '/bot'
const registry = new Map<string, Command>()   // key (lowercased name/alias) → command

export function register(cmd: Command) {
  for (const key of [cmd.name, ...(cmd.aliases ?? [])]) registry.set(key.toLowerCase(), cmd)
}
export function listCommands(): Command[] { return [...new Set(registry.values())] }

/** Strip the prefix. Returns the command text, or null if not a command. */
export function parsePrefix(body: string): string | null {
  const t = body.trim()
  if (!t.toLowerCase().startsWith(PREFIX)) return null
  return t.slice(PREFIX.length).replace(/^[:\s]+/, '').trim()
}

/** Longest-prefix match so multi-word names ("mis tareas") beat short ones ("mis"/"tareas"). */
export function matchCommand(commandText: string): { cmd: Command; rest: string } | null {
  const lower = commandText.toLowerCase()
  let best: { key: string; cmd: Command } | null = null
  for (const [key, cmd] of registry) {
    if (lower === key || lower.startsWith(key + ' ') || lower.startsWith(key + ':')) {
      if (!best || key.length > best.key.length) best = { key, cmd }
    }
  }
  if (!best) return null
  const rest = commandText.slice(best.key.length).replace(/^[:\s]+/, '').trim()
  return { cmd: best.cmd, rest }
}
```

### Dispatcher
```ts
// src/services/commands/commands.service.ts
import { parsePrefix, matchCommand, listCommands } from './registry'
import { resolveContext } from './context'         // §5
import { wahaRepository } from '@/repositories/waha/waha.repository'
import './handlers'                                // side-effect: registers all commands (§9)

export const commandService = {
  isCommand: (body: string) => parsePrefix(body) !== null,

  async handle(raw: { id: string; from: string; participant?: string | null; body: string }) {
    const commandText = parsePrefix(raw.body)
    if (commandText === null) return

    const base = await resolveContext(raw)          // auto-provisions sender; null only if no participant id (§5)
    if (!base) { return }                           // can't even derive a sender → ack & drop (handled upstream)

    const m = matchCommand(commandText)
    let reply: { text: string }
    if (!m) {
      reply = helpReply()                            // unknown command → help
    } else if (m.cmd.scope !== 'both' && m.cmd.scope !== (base.isGroup ? 'group' : 'dm')) {
      reply = { text: `El comando "${m.cmd.name}" solo funciona ${m.cmd.scope === 'group' ? 'dentro de un grupo' : 'en chat directo'}.` }
    } else {
      const ctx = { ...base, argsRaw: m.rest, args: m.rest ? m.rest.split(/\s+/) : [] }
      try { reply = await m.cmd.handler(ctx) }
      catch (e) { reply = { text: 'Hubo un error procesando el comando. Probá de nuevo.' }; /* log to agent_runs */ }
    }
    await wahaRepository.sendText(base.chatId, reply.text, raw.id)   // reply_to = command msg
  },
}

function helpReply() {
  const lines = listCommands().map(c => `• ${PREFIX} ${c.name} — ${c.description}`)
  return { text: `Comandos disponibles:\n${lines.join('\n')}` }
}
```

That's the whole framework. Everything below is **handlers registered against it** — the dispatcher never changes.

---

## 3) Where it runs — webhook integration

In the WAHA webhook (ingestion-spec §5), add a **command branch before the group-authorization drop** (commands must work in DMs and any context):
```ts
// inside POST /api/webhooks/waha, after HMAC + parse + fromMe filter:
if (commandService.isCommand(msg.body)) {
  // ATOMIC dedupe (not check-then-act): only the insert that actually wins runs the command.
  // Mirrors the ingestion claim pattern — two simultaneous deliveries can't both proceed.
  const won = await claimCommand(msg.id, msg.from)  // INSERT ... ON CONFLICT DO NOTHING RETURNING message_id
  if (!won) return Response.json({ ok: true })      // a concurrent/earlier delivery already owns it
  after(() => commandService.handle(msg))           // process + reply post-response (fast ack kept)
  return Response.json({ ok: true })
}
// else → normal ingestion enqueue (authorized groups only)
```
- `after` is `next/server`'s post-response hook (architecture §6) — keeps the 200 fast while the command runs.
- **Dedupe replies** on `msg.id` (WAHA retries). A tiny `handled_commands(message_id unique, handled_at)` table, or reuse `raw_messages` with a `command` source — see §8.
- **Command messages are NOT enqueued into the extraction pipeline** — they're meta, not group content. (Optionally store them with `source='command'` for the activity feed, but the batch builder must exclude them.)

> Coordination: this branch lives in Ciro's webhook file. Commands owner provides `commandService` (`isCommand`, `handle`); ingestion owner wires the branch. Agree on the dedupe mechanism.

---

## 4) Reply conventions

- **Short.** WhatsApp, not a report. Bullet lists, ≤ ~10 items, "…y N más" if longer.
- **Cite source where it matters** (architecture §3): for memory/search answers, include who/when or a short quote.
- **Spanish (AR), neutral, concise.** No emojis spam.
- Always `reply_to` the command message so it threads.
- On empty results, say so plainly ("No hay tareas abiertas en este proyecto.").

---

## 5) Scope & auth resolution (`resolveContext`)

```ts
// src/services/commands/context.ts  — returns null if sender is unknown
```
- **Sender:** from `participant` (group) or `from` (DM), both `...@c.us`. Resolve phone → `group_members` / `users` → `{ userId, displayName }`.
  - **Auto-provision (important — don't gate the demo on pre-mapping):** real participants sending `/bot` in a live group are **not** pre-mapped — the thing that creates members is the pipeline normalizer (`resolveMember`, ingestion §6), which runs on the 5–15 min batch, not at webhook time. So `resolveContext` must **create a provisional user/member on the fly** from `pushName`/`participant`, reusing the **same `resolveMember`** the pipeline uses (do not fork that logic — both paths must create members identically). It returns null only when it can't even derive a participant id.
  - `userId` may still be null right after provisioning if `pushName` is missing — that's fine; see the per-command rule below.
- **Identity requirement is per-command, not global.** `help`, `tareas`, `resumen`, `novedades`, `buscar` answer **without** a resolved `userId` (they scope by group/org). Only `mis tareas` (and similar "me"-scoped commands) require `ctx.sender.userId` and reply with a friendly "no te tengo mapeado" if it's null. The dispatcher must **not** reject a sender before command matching.
- **Group context:** `from` ends in `@g.us` → look up `whatsapp_groups.externalChatId`. If found → `{ id, projectId }`; if the group exists but isn't authorized, still answer read commands but note it; if unknown group → treat as org-level with a note. `chatId = from`.
- **DM context:** `from` ends in `@c.us` → `group = null`, `chatId = from`. Commands scope to the sender's **org** (single-org for hackathon; if multi, default to the most recent / ask).
- **Org:** derived from the resolved user/group. Hackathon = one org, so this is trivial; keep the indirection so multi-org works later.

---

## 6) Initial command set (examples on the framework)

All registered via `register({...})`. The set is illustrative — the point is anyone can add more.

| Command | Scope | LLM | Function |
|---|---|---|---|
| `/bot help` (`ayuda`, `comandos`) | both | no | List commands (auto from registry) |
| `/bot tareas` | both | no | Open tasks (group→project, DM→org) |
| `/bot mis tareas` (`mias`) | both | no | Tasks assigned to the sender |
| `/bot novedades` | both | no | Recent tasks/decisions/updates |
| `/bot resumen` | both | yes | Short summary of the group/project (DM: org recent activity) |
| `/bot crear tarea: <texto>` | both | no* | Explicit task create (via State Manager, confidence 1.0) |
| `/bot hecha: <texto>` | both | no* | Find a matching task → complete (or list candidates if ambiguous) |
| `/bot buscar: <consulta>` (`que se decidio sobre`) | both | yes | Semantic search over decisions/facts/summaries (§10 extraction spec) |

\* *no LLM for the action itself; `hecha` may use lexical/semantic match to find the target.*

### Two handler sketches
```ts
// src/services/commands/handlers/tareas.ts
import { register } from '../registry'
import { tasksRepository } from '@/repositories/tasks/tasks.repository'
import { formatTaskList } from '../format'

register({
  name: 'tareas', description: 'Lista las tareas abiertas', scope: 'both',
  handler: async (ctx) => {
    const tasks = await tasksRepository.openTasks(
      ctx.group?.projectId ? { projectId: ctx.group.projectId } : { orgId: ctx.org.id },
    )
    return { text: tasks.length ? formatTaskList(tasks) : 'No hay tareas abiertas.' }
  },
})
register({
  name: 'mis tareas', aliases: ['mias'], description: 'Tus tareas asignadas', scope: 'both',
  handler: async (ctx) => {
    if (!ctx.sender.userId) return { text: 'No te tengo mapeado a un usuario todavía.' }
    const tasks = await tasksRepository.tasksAssignedTo(ctx.sender.userId, ctx.org.id)
    return { text: tasks.length ? formatTaskList(tasks) : 'No tenés tareas asignadas.' }
  },
})
```
```ts
// src/services/commands/handlers/resumen.ts  (LLM)
register({
  name: 'resumen', description: 'Resumen del grupo/proyecto', scope: 'both', usesLLM: true,
  handler: async (ctx) => {
    const items = await tasksRepository.recentActivity(ctx.group?.projectId ?? null, ctx.org.id, 20)
    const text = await summarize(items)   // Claude (haiku), prompt-cached system, short output
    return { text }
  },
})
```

### Write-commands respect the invariant
`crear tarea` and `hecha` **call the deterministic State Manager** functions (extraction-spec §8), not the task tables directly:
- `crear tarea: <texto>` → `stateManager.createTask({ title: <texto>, source: 'command', sourceMessageIds: [rawId], confidence: 1.0, reviewFlag: 'none', assigneeHint: <parsed @mention/name?> })`.
- `hecha: <texto>` → find candidate open tasks (lexical/semantic match in the project); exactly one → `stateManager.completeTask(id, source)`; multiple → reply with a numbered list ("¿cuál? respondé /bot hecha: <título exacto>"); none → "No encontré una tarea que coincida."
This keeps "only the State Manager mutates task state" true — commands are just another caller.

---

## 7) LLM-backed commands

- Use `lib/claude/client.ts` (shared with extraction). `claude-haiku-4-5`, prompt-cached system block, tight `max_tokens` (~256–400 for a reply), non-streaming.
- `resumen`: feed recent tasks/decisions/updates; ask for a 3–5 line status (avances, bloqueos, próximos pasos). Tone: coordination, not invasive (architecture §12).
- `buscar` / `que se decidio sobre`: embed the query (if embeddings enabled — extraction §10), `cosineDistance` top-k over `embeddings`; if embeddings off, fall back to `pg_trgm` lexical search over decisions/facts; pass hits to Claude for a cited 1–3 line answer. Always show source (who/when).

---

## 8) Idempotency, dedupe & error handling

- **Reply dedupe (atomic):** WAHA retries the webhook → guard on the command `message_id`. Use an **atomic claim**, not check-then-act: `INSERT INTO handled_commands (message_id, …) VALUES (…) ON CONFLICT DO NOTHING RETURNING message_id` — proceed only if a row came back. Two near-simultaneous deliveries (WAHA reconnect replay) then can't both pass. (Same pattern as the ingestion claim — keep the two halves consistent.) Alternatively fold into `raw_messages` with `source='command'` and a unique `waha_message_id`.
  - **Trade-off (decide, don't stumble into it):** we claim **before** sending the reply, so a transient WAHA *send* failure won't auto-retry that message id. Acceptable — the user re-sending `/bot …` is a new message id and goes through. If you'd rather retry on send failure, claim after a successful send (and accept a small double-reply window).
- **Unknown command** → `helpReply()`. **Unknown sender** → friendly "no te reconozco". **Wrong scope** → explains where the command works.
- **Handler error** → caught by the dispatcher → generic friendly reply; log the real error to `agent_runs`/`audit_log` (never leak internals to the chat — architecture §20).
- **No silent failures in DMs**: every `/bot` in a DM gets *some* reply (help, error, or result), so the user never wonders if the bot saw it.

### Optional schema (minimal)
```ts
// src/db/schema/commands.ts  (optional — for dedupe + activity feed)
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
export const handledCommands = pgTable('handled_commands', {
  messageId: text('message_id').primaryKey(),     // waha message id
  chatId: text('chat_id').notNull(),
  command: text('command'),
  senderId: text('sender_id'),
  handledAt: timestamp('handled_at', { withTimezone: true }).notNull().defaultNow(),
})
```
> Extends architecture §7 — documented deviation (record in the architecture pending-decisions log).

---

## 9) Adding a new command (the payoff)

```ts
// src/services/commands/handlers/<name>.ts
import { register } from '../registry'
register({
  name: 'vencidas',
  description: 'Tareas vencidas o por vencer',
  scope: 'both',
  handler: async (ctx) => {
    const tasks = await tasksRepository.overdue(ctx.group?.projectId ?? null, ctx.org.id)
    return { text: tasks.length ? formatTaskList(tasks) : 'No hay tareas vencidas.' }
  },
})
```
Then `export` it from `src/services/commands/handlers/index.ts` (the barrel the dispatcher imports). **No dispatcher, parser, or webhook changes.** It shows up in `/bot help` automatically. That's the whole point of the framework — the command surface grows by adding files, never by editing the core.

---

## 10) Acceptance criteria (definition of done)

- [ ] `/bot help` in a group and in a DM both list all registered commands, generated from the registry.
- [ ] `/bot tareas` in a group returns that group's project open tasks; in a DM returns the sender's org open tasks.
- [ ] `/bot mis tareas` returns only the sender's assigned tasks; unmapped sender → friendly message.
- [ ] A multi-word command (`/bot mis tareas`) is matched over the shorter `/bot mis` / `/bot tareas` (longest-prefix).
- [ ] An unknown sender gets the "no te reconozco" reply; an unknown command gets help; a group-only command in a DM explains the scope.
- [ ] `/bot crear tarea: comprar insumos` creates a task **through the State Manager** (confidence 1.0), linked to the command message; it appears in `/bot tareas`.
- [ ] `/bot hecha: comprar insumos` completes it; an ambiguous match returns a candidate list instead of guessing.
- [ ] `/bot resumen` returns a short LLM summary; `/bot buscar: …` returns a cited answer (embeddings if available, lexical fallback otherwise).
- [ ] A **retried webhook for the same command message produces exactly one reply** (dedupe).
- [ ] Replies thread (`reply_to`) and stay short; handler errors never crash the request and never leak internals.
- [ ] Command messages are **not** turned into pipeline tasks (excluded from batching).

---

## 11) Build order (for you / for Claude)

1. `types.ts` + `registry.ts` (parser, matcher, register/list) — pure, unit-testable.
2. `commands.service.ts` dispatcher + `helpReply` + a stub `resolveContext`.
3. `context.ts` — real scope/sender/org resolution (§5), reusing `groups`/`messages` repositories.
4. Webhook branch (§3) with the dedupe guard — coordinate with the ingestion owner.
5. Read repositories needed: `tasksRepository.openTasks / tasksAssignedTo / recentActivity / overdue`, `decisionsRepository`, memory/semantic search.
6. Deterministic handlers first: `help`, `tareas`, `mis tareas`, `novedades`. Verify end-to-end with a DM and a group.
7. Write-commands: `crear tarea`, `hecha` → through the State Manager (extraction §8).
8. LLM handlers: `resumen`, `buscar` (reuse `lib/claude`, embeddings §10).
9. Verify all of §10.

---

## 12) Coordination points

- **With ingestion owner (Ciro):** the webhook command branch (§3) and the reply-dedupe mechanism (§8). Commands must be detected **before** the group-authorization drop.
- **With extraction owner:** write-commands call the **State Manager** functions (`createTask`, `completeTask`) — expose them as a small, stable API. Read-commands read `tasks`/`decisions`/`embeddings`. Confirms the invariant: only the State Manager mutates task state; replies and explicit commands both route through it, never raw writes.
- **Schema deviation noted:** optional `handled_commands` table — record in the architecture pending-decisions log.
```

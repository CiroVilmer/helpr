# Spec — Chrome Extension Reader (WhatsApp Web companion) · idea-level

**Owner:** gateway dev.
**Status:** **idea-level spec** — the approach + the contract it must produce, not a full implementation. Flesh out with `superpowers:brainstorming` + the `wxt-chrome-extension` skill before building, and research existing open-source WhatsApp-Web DOM readers first (don't reinvent).
**Goal:** capture messages from a real, human-logged-in WhatsApp Web session and feed them into the source-agnostic ingestion (`specs/ingestion-spec.md`) as the **primary live source**, replacing WAHA.
**Reference:** `ingestion-spec.md` §4 (the `IngestMessage` contract it produces), §5 (`/api/ingest`).

---

## 1) Why this approach (the risk nuance)

This is **not** WAHA. WAHA/Baileys spoof a linked-device client to WhatsApp's servers → detectable → **number bans** (the policy risk we're avoiding). This reader runs **on top of the official WhatsApp Web client**, already logged in by a person. To WhatsApp's servers it's a normal human session; the automation is **local, client-side DOM reading**. Far lower ban risk.

**Be honest about what it is:** still **ToS-gray** (automated access is technically disallowed), just **much less detectable** — not "official/compliant" like the Cloud API. Fine for a controlled demo on your own test group. As a product, it's positioned as a **consent-based companion** the NGO runs on its own account/groups.

**The payoff:** it reads **pre-existing groups of any size** the user is already in — the one thing the official Groups API cannot do (own-groups only, ≤8). That makes the "production reads real groups" story technically real.

---

## 2) Approach (recommended)

**Chrome extension, MV3, content script on `web.whatsapp.com`** (use the `wxt-chrome-extension` skill).

- User logs into WhatsApp Web normally and opens the target group.
- A **content script** observes the chat DOM with a `MutationObserver` on the message-list container.
- For each new message node it extracts: the message id, sender, text, timestamp, group identity, quoted ref, type.
- It **POSTs batches** of normalized messages to the app's `POST /api/ingest` with `Authorization: Bearer <INGEST_API_KEY>`.
- The app's ingestion dedupes + stores + pipelines them — **nothing downstream changes**.

Alternatives considered: Playwright/Puppeteer driving WhatsApp Web (closer to WAHA's risk profile — it's what WAHA-WEBJS does under the hood; avoid) and screen OCR (brittle, overkill). The content-script-in-the-real-browser approach has the lowest footprint.

---

## 3) What it captures → the `IngestMessage` contract (the seam)

The extension's **only contract** with the rest of the system is that it produces valid `IngestMessage` objects (`ingestion-spec.md` §4) and POSTs them to `/api/ingest`. Mapping:

| `IngestMessage` field | Source in WhatsApp Web DOM |
|---|---|
| `source` | `'extension'` |
| `externalMessageId` | the message node's **`data-id`** attribute (stable WA message id, e.g. `false_<chat>@g.us_<id>`) → **dedupe key** |
| `groupExternalId` | the open chat's id (from the `data-id` chat segment / chat header) → maps to `whatsapp_groups.externalChatId` |
| `sender.name` | the sender display name in the bubble (group messages show it) |
| `sender.externalId` | phone/handle if exposed (often only the name is available — `null` is OK; ingestion provisions a member by name) |
| `ts` | parsed from the bubble timestamp → ISO 8601 |
| `text` | the message body text |
| `type` | `text` for now; media/audio detectable but **text-first** for the demo |
| `quotedExternalId` | the quoted message's `data-id` if it's a reply |
| `raw` | a small snapshot (the node's `data-id` + raw text) for audit |

Batch a few messages per POST (e.g. flush every N messages or every few seconds). Dedupe is handled server-side on `externalMessageId`, so re-sending is safe.

---

## 4) Honest caveats (carry these into the build)

- **Brittle:** WhatsApp Web's DOM has obfuscated, changing class names. Anchor on stable-ish attributes (`data-id`, roles) and **expect to adjust selectors**. Fine for a controlled demo; real maintenance burden for prod.
- **Session must stay open:** a machine needs WhatsApp Web open and logged in (the same always-on concern WAHA had, now a desktop tab).
- **Text-first:** extracting media/audio from the DOM is harder — defer; the ingestion audio skeleton already accommodates it later.
- **ToS-gray:** lower ban risk ≠ zero, and it's not "compliant." Demo on a test number/group; for prod, frame as consent-based companion on the NGO's own account.
- **Scope:** companion model (one reader per logged-in session), not a centralized SaaS gateway. That's consistent with the pitch.

---

## 5) Build order (when you build it)

1. Research existing OSS WhatsApp-Web DOM readers / message-scraping extensions — adapt, don't reinvent.
2. `wxt-chrome-extension` scaffold; content script on `web.whatsapp.com`.
3. `MutationObserver` → extract one message → log it. Confirm `data-id` and group id are reliably readable.
4. Map to `IngestMessage`; **verify it parses against `IngestMessageSchema`** and POST one to `/api/ingest` (coordinate `INGEST_API_KEY` with Ciro).
5. Batch + flush; backfill the currently-visible messages on first open (optional).
6. Demo hardening: a known test group, a scripted conversation, selectors checked the morning of.

## 6) Coordination

- **With Ciro (ingestion):** the `IngestMessage` contract (§4 of ingestion-spec) and `INGEST_API_KEY`. Give Ciro the real `groupExternalId` value so he seeds the authorized `whatsapp_groups` row. Confirm a real captured message parses against the schema day-0.
- **Pitch note:** this is the "reads real pre-existing groups" capability; the Cloud API path is the compliance alternative. Same engine, swappable capture layer.

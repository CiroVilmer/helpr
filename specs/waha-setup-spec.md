# Spec — WAHA Gateway Setup

> ⚠️ **DEPRECATED (2026-06-05).** WAHA is no longer the gateway — it spoofs a linked device and risks number bans under current policy. The live source is now the **Chrome extension reader** (`specs/extension-reader-spec.md`), with paste/import + seed for the demo, all behind the source-agnostic ingestion (`specs/ingestion-spec.md`). This doc is kept only as a reference for the optional WAHA adapter; **do not build the gateway from here.**

**Owner:** WAHA setup dev.
**Goal:** stand up a stable, secure WAHA gateway that delivers WhatsApp **group** messages to the ingestion endpoint and lets the app send replies. You own the *infrastructure*; Ciro owns what happens to the data after the webhook fires.
**Reference:** `ARCHITECTURE.md` §9 (WAHA spec) + §15 (hosting).

---

## 1) Objectives

1. A running WAHA instance, **always-on**, reachable over HTTPS at a stable `WAHA_URL`.
2. Engine **NOWEB**, with **Store enabled before QR** (so history reads work).
3. An authenticated session (`WORKING`) on a test number, in one or more **authorized test groups**.
4. Webhooks configured to POST **`message`** events to the app, **HMAC-signed**.
5. The API protected by an **API key**; the dashboard/Swagger behind credentials.
6. Verified: a message in the test group arrives at the ingestion webhook; the app can send a reply back.

---

## 2) Decisions already made (do not re-litigate)

- **Engine: NOWEB** (lightweight, no Chromium → stable + cheap). Plan B is WEBJS via `WHATSAPP_DEFAULT_ENGINE=WEBJS`, but payloads differ — only switch if NOWEB fails, and tell Ciro (his parser is built against NOWEB).
- **Host: Railway (primary)**, VPS (Hetzner/DigitalOcean) as documented fallback.
- **Surface rule:** the bot is **silent by default** — it only sends when the app tells it to (commands/demo). You just need *sending* to work; the app decides *when*.

---

## 3) The CONTRACT you must deliver (handoff to ingestion)

This is the only thing Ciro depends on. Get these right and the two halves connect.

| Item | Value | Shared with |
|---|---|---|
| `WAHA_URL` | `https://<waha>.up.railway.app` (or VPS domain) | app env (to call WAHA) |
| `WAHA_API_KEY` | strong secret, ideally `sha512:<hex>` | app env (`X-Api-Key`) |
| HMAC secret | `WHATSAPP_HOOK_HMAC_KEY` on WAHA **==** `WAHA_WEBHOOK_HMAC_KEY` in the app | app env (verify signature) |
| Webhook URL | `https://<app>.vercel.app/api/webhooks/waha` | given to you by Ciro |
| Events | `message` only | — |
| Session name | `default` | app uses it in send calls |
| Authorized group id(s) | the `...@g.us` chat id(s) of the test group | app marks them authorized |

**Payload you will deliver** (NOWEB `message` event). The app validates this exact shape — don't reshape it:
```json
{
  "event": "message",
  "session": "default",
  "engine": "NOWEB",
  "payload": {
    "id": "false_120363000000000000@g.us_ABCD",
    "timestamp": 1749200000,
    "from": "120363000000000000@g.us",
    "participant": "5491155555555@c.us",
    "fromMe": false,
    "body": "Lu, podés llamar a los voluntarios antes del viernes?",
    "hasMedia": false,
    "replyTo": null
  }
}
```
- Group messages: `from` ends in `@g.us`, real sender is `participant`.
- HMAC: WAHA sends header `X-Webhook-Hmac` (algorithm `sha512`) computed over the raw body. The app verifies it.

---

## 4) Railway deploy (primary) — steps

1. **New service → Deploy from Docker Image →** `devlikeapro/waha`.
2. **Add a Volume**, mount path **`/app/.sessions`** (NOWEB session survives restarts/redeploys — without it you re-scan the QR every deploy).
3. **Variables** (paste from `infra/waha/.env.example`, fill values):
   ```bash
   WAHA_API_KEY=sha512:<hex>
   WHATSAPP_DEFAULT_ENGINE=NOWEB
   WHATSAPP_NOWEB_STORE_ENABLED=true       # BEFORE first QR; never change after
   WHATSAPP_NOWEB_STORE_FULLSYNC=true
   WAHA_LOCAL_STORE_BASE_DIR=/app/.sessions
   WHATSAPP_HOOK_URL=https://<app>.vercel.app/api/webhooks/waha
   WHATSAPP_HOOK_EVENTS=message
   WHATSAPP_HOOK_HMAC_KEY=<shared-hmac-secret>
   WAHA_DASHBOARD_USERNAME=<user>
   WAHA_DASHBOARD_PASSWORD=<pass>
   ```
4. **Settings → Networking → Generate Domain** (target port **3000**). Auto TLS. Copy the URL → that's `WAHA_URL`.
5. Open `https://<waha>.up.railway.app/dashboard`, log in, **start the `default` session**, **scan the QR** with the test phone. Wait for status **`WORKING`**.

---

## 5) Session lifecycle (what to watch)

- Statuses: `STOPPED → STARTING → SCAN_QR_CODE → WORKING` (or `FAILED`).
- QR endpoint (if not using the dashboard): `GET {WAHA_URL}/api/default/auth/qr`.
- Each new `SCAN_QR_CODE` means the previous QR expired — refetch.
- The app subscribes to `session.status` to know when it's safe to send. If you want, also expose it from the dashboard.
- **Reconnection:** with the persisted volume, restarts resume `WORKING` without re-scan. If the phone logs the session out, you must re-scan.

---

## 6) Verify before handoff (your definition of done)

- [ ] `GET {WAHA_URL}/api/sessions` with header `X-Api-Key` returns the `default` session as `WORKING`.
- [ ] Send a test message **into** the group from the test phone → confirm WAHA POSTs to the webhook URL (check the app logs / a temporary echo, or Railway logs show the outbound hook).
- [ ] **Send out** works:
  ```bash
  curl -X POST "$WAHA_URL/api/sendText" \
    -H "X-Api-Key: $WAHA_API_KEY" -H "Content-Type: application/json" \
    -d '{"session":"default","chatId":"120363000000000000@g.us","text":"pong"}'
  ```
  → message appears in the group.
- [ ] **History read** works (needed for the import / last-N feature):
  ```bash
  curl "$WAHA_URL/api/default/chats/120363000000000000%40g.us/messages?limit=20" \
    -H "X-Api-Key: $WAHA_API_KEY"
  ```
  (`@` URL-encoded as `%40`). Requires Store enabled.
- [ ] HMAC: confirm WAHA sends `X-Webhook-Hmac` (the app rejects unsigned requests — coordinate the shared secret with Ciro).

---

## 7) VPS fallback (only if Railway is out)

`infra/waha/docker-compose.yml` + `infra/waha/Caddyfile` are ready. On a small always-on VPS:
```bash
docker compose -f infra/waha/docker-compose.yml up -d
```
- Caddy gives automatic HTTPS for `waha.yourdomain.com` → that's `WAHA_URL`.
- **Firewall: open only 80/443 (+22). Never expose 3000 publicly.** Always set a strong `WAHA_API_KEY`.
- `restart: always` + persisted `./.sessions` volume + non-idling host, or the session drops.
- ⚠️ **Render free tier does NOT work** — it sleeps and drops the session.

---

## 8) Gotchas

- **Never change NOWEB store config after scanning the QR** — it can wipe chat history.
- **WAHA retries failed webhook deliveries** → the app must dedupe (Ciro's side, on `payload.id`). Don't worry about it here, just know retries happen.
- **NOWEB payloads ≠ WEBJS** — if you ever switch engines, the app parser breaks; coordinate.
- The bot's own outbound messages can come back as events — the app filters `fromMe`/`message.any`; you don't need to handle it, just don't be surprised seeing them in logs.

---

## 9) Coordination checklist with the ingestion owner (Ciro)

Agree on these **before** either side is "done":
- [ ] The 3 shared secrets: `WAHA_API_KEY`, HMAC key, `WAHA_URL`.
- [ ] The exact webhook path (`/api/webhooks/waha`).
- [ ] The test group `@g.us` id (so Ciro marks it authorized in the DB).
- [ ] Engine = NOWEB confirmed (so his payload parser matches).
- [ ] **Capture one REAL `message` webhook payload on day 0** and send it to Ciro to confirm `WahaMessagePayloadSchema` parses it. The schema's field names (`participant`, `replyTo`, `media.url`, `timestamp` in seconds) come from docs, not a live instance — verify before everything is built on top. `.passthrough()` tolerates extra fields, not renamed/missing required ones.
```

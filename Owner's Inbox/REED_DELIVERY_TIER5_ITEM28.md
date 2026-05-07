---
from: REED
to: Owner
date: 2026-03-31
re: Delivery — Tier 5 Item 28 — REST API & Webhooks
---

# Tier 5 Item 28 — REST API & Webhooks ✅

## What was built

A full programmatic REST API at `/api/v1/*` with API key authentication and webhook delivery, plus an in-app management UI.

---

## server.py

### New tables (idempotent — `CREATE TABLE IF NOT EXISTS` in `migrate_db`)
- **`api_keys`** — `id, name, key_prefix, key_hash, created_at, last_used_at`
- **`webhooks`** — `id, timeline_id, url, events (JSON), secret, created_at`

### API key helpers
- `_hash_key(raw_key)` — sha256 hex digest of the raw key string
- `_validate_api_key(request)` — reads `Authorization: Bearer tl_<key>`, hashes it, looks up in DB, updates `last_used_at`, raises HTTP 401 on failure
- Key format: `tl_` + 64 hex chars (from `secrets.token_hex(32)`)

### Webhook firing
- `_fire_webhooks(timeline_id, event_type, payload)` — fires in a daemon thread (non-blocking)
- Fetches all webhooks matching `timeline_id` OR `timeline_id IS NULL` (global)
- Checks `event_type` is in the webhook's `events` array
- Signs payload with HMAC-sha256 if `secret` is set → `X-Timeline-Signature: sha256=…` header
- Sends `POST` via `urllib.request` with 5s timeout; failures silently discarded
- Wired into `PUT /api/timelines/{id}` (save_timeline) — fires after every successful save

### Key management endpoints (no auth — local server access)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/keys` | List keys (name, prefix, last used — never raw key) |
| POST | `/api/v1/keys` | Generate new key — returns full key once |
| DELETE | `/api/v1/keys/{kid}` | Revoke a key |

### Webhook management endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/webhooks` | none | List all webhooks (management UI) |
| GET | `/api/v1/timelines/{id}/webhooks` | key | List webhooks for timeline |
| POST | `/api/v1/timelines/{id}/webhooks` | key | Register webhook |
| DELETE | `/api/v1/webhooks/{wid}` | key | Remove webhook |

### Data API endpoints (all require API key)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/timelines` | List timelines (summary) |
| GET | `/api/v1/timelines/{id}` | Full timeline payload |
| GET | `/api/v1/timelines/{id}/people` | List people |
| POST | `/api/v1/timelines/{id}/people` | Create person |
| PUT | `/api/v1/timelines/{id}/people/{pid}` | Update person (partial merge) |
| DELETE | `/api/v1/timelines/{id}/people/{pid}` | Delete person |
| GET | `/api/v1/timelines/{id}/events` | List events |
| POST | `/api/v1/timelines/{id}/events` | Create event |
| PUT | `/api/v1/timelines/{id}/events/{eid}` | Update event (partial merge) |
| DELETE | `/api/v1/timelines/{id}/events/{eid}` | Delete event |

### Partial update semantics
- People PUT and Events PUT only update fields present in the request body
- Fields absent from the body keep their existing DB value
- person_ids on Events: only updated if `person_ids` key is present in body

### OpenAPI docs
- FastAPI auto-generates Swagger UI at `/docs` and JSON schema at `/openapi.json` — no extra code needed
- All v1 routes appear in the docs with full request/response schemas

---

## index.html

### `APIModal` component
Two-tab modal: **🔑 API Keys** and **🪝 Webhooks**

**API Keys tab:**
- Lists existing keys: name, prefix (e.g. `tl_a1b2c3d4…`), last used date, Revoke button
- One-time key display: green banner with full key + "store it now" note
- Generate New Key form: name input + Generate button
- Server-offline guard: shows a message instead of the tabs when `serverMode === false`

**Webhooks tab:**
- Lists registered webhooks: URL (monospace), event types, 🔒 signed indicator, delete button
- Register Webhook form: URL input, signing secret input, Register button
- API Docs ↗ link pointing to `/docs` (Swagger UI)

### Entry point
- **Tools → 🔑 API & Webhooks…** in MenuBar (`apiWebhooks` action)
- `showAPIModal` useState in App + `<APIModal serverMode={serverMode} onClose=…/>`

### i18n
All 4 languages (en/af/es/fr):
`🔑 API & Webhooks…`, `API Keys`, `Webhooks`, `Generate New Key`, `Key name`,
`Revoke`, `Register Webhook`, `Webhook URL`, `Signing secret (optional)`, `API & Webhooks`

### Help
"REST API & Webhooks" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans):
- Getting started steps
- Interactive docs at `/docs`
- Endpoint table with methods, paths, descriptions
- Webhook payload example JSON
- HMAC signing explanation
- Key management notes

---

## Webhook payload format
```json
{
  "timelineId": "abc123",
  "event": "save",
  "data": {
    "id": "abc123",
    "name": "My Timeline",
    "savedAt": "2026-03-31T12:00:00+00:00"
  }
}
```

## Usage example (curl)
```bash
# Generate a key
curl -X POST http://localhost:8765/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Zapier integration"}'

# List events
curl http://localhost:8765/api/v1/timelines/my-timeline-id/events \
  -H "Authorization: Bearer tl_…"

# Create a person
curl -X POST http://localhost:8765/api/v1/timelines/my-timeline-id/people \
  -H "Authorization: Bearer tl_…" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ada Lovelace", "birth": "1815-12-10", "death": "1852-11-27", "role": "Mathematician"}'
```

---

**This completes Tier 5. All 28 items in the gap analysis are now delivered.**

*Delivery note written: 2026-03-31*

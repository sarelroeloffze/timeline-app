# REED Delivery — SQLite Persistence: Places, Arcs, Markers, place_id

**Date:** 2026-04-05
**File changed:** `server.py` only (`index.html` already correct — verified)

---

## What was done

### 1. `init_db()` — two new tables added

- **`places`** table: `id`, `timeline_id` (FK → timelines CASCADE), `name`, `lat`, `lon`, `description`, `color`
- **`arcs`** table: `id`, `timeline_id` (FK → timelines CASCADE), `name`, `color`, `description`, `event_ids` (JSON array)

Both tables use `CREATE TABLE IF NOT EXISTS` so they are safe on first run.

### 2. `migrate_db()` — two idempotent migrations added

- `ALTER TABLE events ADD COLUMN place_id TEXT DEFAULT NULL`
- `ALTER TABLE timelines ADD COLUMN markers TEXT DEFAULT '[]'`

Both wrapped in `try/except` like all existing migrations — safe to run against existing databases.

### 3. `_build_timeline_payload()` — read side updated

- **place_id on events** — `"placeId"` key added to each event dict, read from `events.place_id` column
- **Places** — `SELECT` from `places WHERE timeline_id=?`; returned as `"places"` list in payload
- **Arcs** — `SELECT` from `arcs WHERE timeline_id=?`; `event_ids` JSON-parsed to `"eventIds"`; returned as `"arcs"` list
- **Markers** — read from `timelines.markers` JSON column; returned as `"markers"` list
- Minor refactor: `row.keys()` cached as `rk` (was being called inside the existing dict for `custom_field_defs` and `categories`; now consistent)

### 4. `_save_timeline_from_payload()` — write side updated

- **timelines UPDATE** — added `markers=?` to the SET clause
- **timelines INSERT** — added `markers` column and `markers_json` value
- **Child-row DELETE** — `places` and `arcs` added to the cleanup loop (runs before re-insert)
- **events INSERT** — `place_id` column added (24th column, `place_id` value extracted from `e.get("placeId")`)
- **Insert places** — loop over `payload["places"]`, inserts one row per place
- **Insert arcs** — loop over `payload["arcs"]`, `eventIds` serialised back to JSON for storage

### 5. `index.html` — no changes needed

Verified that `saveToStorage` (API version), `saveToStorageLS`, and `exportJSON` all already include `places`, `arcs`, and `markers` in their payloads. The frontend was already correct from the previous session.

---

## Result

Places, Story Arcs, and Calendar Markers now fully round-trip through SQLite when the server is running. The localStorage fallback path is unchanged. All migrations are idempotent and safe to run against existing databases.

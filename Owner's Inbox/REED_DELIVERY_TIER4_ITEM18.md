# REED — Delivery Note: Tier 4 Item 18 — Version History

**Delivered:** March 2026
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Scope:** Full version history system — server-side snapshots, localStorage fallback, frontend modal

---

## What Was Built

### Part A — Server-side version snapshots (`server.py`)

**New table: `timeline_versions`**
```sql
CREATE TABLE IF NOT EXISTS timeline_versions (
  id             TEXT PRIMARY KEY,
  timeline_id    TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  label          TEXT DEFAULT NULL,
  snapshot       TEXT NOT NULL,
  created_at     TEXT DEFAULT (datetime('now')),
  auto           INTEGER DEFAULT 1,
  FOREIGN KEY(timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
)
```
Created in `migrate_db()` — idempotent, safe to run against an existing database.

**Auto-snapshot on every PUT:**
`PUT /api/timelines/{id}` now calls `_create_version_snapshot()` after writing. The call is wrapped in a try/except so a snapshot failure never breaks the save path. The snapshot stores the full JSON payload — the same shape as `GET /api/timelines/{id}`.

**50-snapshot prune:**
After each auto-snapshot insert, the function checks the count of auto-snapshots for that timeline. If > 50, the oldest ones (by version_number ASC) are deleted. Named snapshots (`auto=0`) are never touched by the pruner.

**New helper: `_create_version_snapshot(conn, timeline_id, payload, label, auto)`**
Increments version_number per timeline, inserts the row, runs the pruner.

**6 new endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/timelines/{id}/versions` | List versions newest-first; no snapshot body returned |
| `GET` | `/api/timelines/{id}/versions/{vid}` | Full snapshot for one version |
| `POST` | `/api/timelines/{id}/versions` | Create a named manual snapshot (body: `{ label }`) |
| `POST` | `/api/timelines/{id}/versions/{vid}/restore` | Restore: creates pre-restore backup, overwrites timeline, creates post-restore marker |
| `PATCH` | `/api/timelines/{id}/versions/{vid}` | Update label (body: `{ label }`) |
| `DELETE` | `/api/timelines/{id}/versions/{vid}` | Delete named snapshot only; returns 400 for auto-snapshots |

---

### Part B — Frontend `VersionHistoryModal` (`index.html`)

**localStorage helpers:**
- `_lsVersionsKey(name)` — key `tl_versions_{name}`
- `_lsLoadVersions(name)` / `_lsSaveVersions(name, arr)`
- `_lsPushVersionSnapshot(name, payload)` — appends, keeps last 10

Called from `saveToStorage()` in the localStorage branch — runs on every save silently.

**API helpers:** `apiListVersions`, `apiGetVersion`, `apiCreateNamedVersion`, `apiRestoreVersion`, `apiLabelVersion`, `apiDeleteVersion`

**`VersionHistoryModal` component — two-panel layout:**

*Left panel (310px):*
- Scrollable list, newest first
- Each row: version label (or "Auto-save #N"), relative timestamp ("2h ago"), full date
- Auto / Named badge
- Named versions: ✏ rename button (inline input, Enter to commit), 🗑 delete button
- Empty state with helpful message

*Header:*
- "📌 Save named snapshot" inline input (server mode only) — expand on click, Enter saves, ✕ cancels
- "Local mode — last 10 auto-saves shown" note in localStorage mode

*Right panel (flex):*
- Person count + event count stat tiles
- Date range tile (min–max years, BC/AD formatted)
- First 10 event titles with year
- "↩ Restore this version" button (full width)
- Safety note: "A backup of your current timeline will be created automatically before restoring."

**Restore flow:**
1. User clicks ↩ Restore → confirm dialog
2. In server mode: `POST /versions/{vid}/restore` → server creates pre-restore backup, overwrites timeline → frontend reloads via `GET /api/timelines/{id}` → calls `handleLoad()`
3. In localStorage mode: loads snapshot directly into App state via `handleLoad()`

---

### Part C — Menu entry

`File → 🕐 Version History…` inserted below Save in `MenuBar.MENUS.File`. Shortcut hint displayed: `⌃⇧H`.

`handleMenuAction` case `'versionHistory'` → `setShowVersionHistory(true)`.

---

### Part D — App wiring

New state: `const [showVersionHistory, setShowVersionHistory] = useState(false);`

Modal rendered with full props:
- `timelineId` — `_timelineIdMap[timelineName]` (null in localStorage mode)
- `timelineName` — current timeline name
- `serverMode` — boolean
- `onRestore` — calls `handleLoad()` with the restored payload's full fields
- `onClose` — closes the modal

---

## Help sections updated

| Language | Section title |
|----------|--------------|
| English | "Version History" added to `HELP_SECTIONS` |
| Afrikaans | "Weergawe Geskiedenis" added to `HELP_SECTIONS_AF` |

Both sections cover: opening the modal, auto-snapshots, named snapshots, browsing, preview panel, restore flow, rename/delete, and localStorage mode behaviour.

---

## Guardrails respected

- Auto-snapshots are entirely silent — no UI feedback to the user on every save
- Restore always creates a pre-restore backup first
- Named snapshots are never auto-deleted
- Snapshot JSON matches the existing `_build_timeline_payload()` shape exactly
- The snapshot insert is a single SQL row — no measurable latency on the save path
- Try/except around snapshot creation in PUT endpoint ensures save is never broken by snapshot failure
- Auto-snapshots cannot be manually deleted (server returns HTTP 400)

---

## Files changed

| File | Change |
|------|--------|
| `server.py` | `timeline_versions` table in `migrate_db()`; `_create_version_snapshot()` helper; auto-snapshot in `PUT /api/timelines/{id}`; 6 new version endpoints |
| `index.html` | `_lsPushVersionSnapshot` + localStorage version helpers; 6 API helper functions; `VersionHistoryModal` component (~250 lines); File menu entry; App state; handleMenuAction case; modal render; HELP_SECTIONS EN + AF |
| `CLAUDE.md` | Session notes added; "Still remaining" updated |

---

*Delivered clean. App loads and runs without regressions.*

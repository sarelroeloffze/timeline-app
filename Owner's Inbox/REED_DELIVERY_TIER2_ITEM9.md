# Delivery Note — Tier 2, Item 9: Event Dependencies + Gantt Mode

**From:** REED (Senior Full-Stack Developer)
**To:** Owner / LARRY team
**Date:** 2026-03-28
**Status:** Complete

---

## What Was Delivered

Full implementation of event dependencies and a new Gantt view, across both the frontend (`index.html`) and the backend (`server.py`).

---

## Part A — Dependencies Data Model

- `dependencies` global React state: `[{ id, fromEventId, toEventId, type }]`
- Types: `fs` (Finish → Start), `ss` (Start → Start), `ff` (Finish → Finish)
- `SAMPLE_DEPENDENCIES = []` constant; `DEP_TYPES` config array for UI labels
- Persisted in `saveToStorageLS`, `saveToStorage`, `exportJSON`, and `loadTimeline`
- `OpenTimelineModal` passes `dependencies` through both API and localStorage paths, and JSON file import
- SQLite: `dependencies` table added to `init_db()`:
  ```sql
  CREATE TABLE IF NOT EXISTS dependencies (
    id            TEXT NOT NULL,
    timeline_id   TEXT NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    from_event_id TEXT NOT NULL,
    to_event_id   TEXT NOT NULL,
    type          TEXT DEFAULT 'fs',
    PRIMARY KEY (id, timeline_id)
  );
  ```
- Full round-trip in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write + delete-before-insert)

---

## Part B — Dependency Editor (EditEventModal)

- "Depends on" section showing each upstream dependency with type badge (FS/SS/FF) and ✕ remove
- "Blocks" read-only list showing what the current event blocks downstream
- "+ Add dependency" picker: choose an event from a dropdown + pick dependency type
- `hasCycle(startId, targetId, allDeps)` DFS function prevents circular chains; error shown inline
- `addDep()` / `removeDep()` handlers update the global `dependencies` state via `onUpdateDependencies`

---

## Part C — GanttView Component

New `📊 Gantt` view (7th view, accessed from View menu or Horizontal toolbar button):

- Left label panel (200px fixed) listing event names grouped by person, with person colour accent
- Custom SVG renderer — no third-party Gantt library
- Horizontal bars coloured by category, with a lighter progress fill overlay
- Milestone diamonds for point events (no date_end)
- Dependency arrows: cubic bezier SVG paths with arrowhead markers; separate marker colours for normal vs critical path arrows
- Critical path highlighted in amber/orange (thicker bar border + orange arrow)
- Smart axis tick intervals (adapts to zoom level from decades down to single years)
- Mouse drag pan; Ctrl+scroll zoom; Fit All / Zoom In / Zoom Out toolbar controls
- `registerCmds` hook wired so menu navigation commands work in Gantt view
- Container `ResizeObserver` for responsive layout

---

## Part D — Progress Field

- `progress: 0–100` integer on event objects (default `0`)
- Range slider (`<input type="range">`) in EditEventModal
- Gradient progress bar rendered in EventPanel header below the event title
- SQLite: idempotent `ALTER TABLE events ADD COLUMN progress INTEGER DEFAULT 0` in `migrate_db()`
- Full read/write round-trip in `server.py`

---

## Part E — Status Field

- `status: planned | active | done | cancelled | at-risk` on event objects (default `'planned'`)
- `EVENT_STATUSES` array + `STATUS_CONFIG` object with per-status label, foreground colour, background colour
- Colour-coded badge in EventPanel header
- `<select>` dropdown in EditEventModal (Status row, alongside Progress slider)
- Filter in FilterPanel: new "Status" section with toggle switches per status; `hiddenStatuses` Set in App state; `filteredEvents` and `filtersBadge` updated
- Gantt bars reflect status via opacity (cancelled = 40%, done = full, etc.) — uses category colour as base
- SQLite: idempotent `ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'planned'` in `migrate_db()`
- Full read/write round-trip in `server.py`

---

## Files Changed

| File | Changes |
|---|---|
| `index.html` | +`SAMPLE_DEPENDENCIES`, `DEP_TYPES`, `hasCycle()`, `calcCriticalPath()`, `EVENT_STATUSES`, `STATUS_CONFIG`; updated `saveToStorage`/`exportJSON`/`loadTimeline`; updated `EditEventModal` (deps + progress + status); updated `EventPanel` (status badge + progress bar); updated `FilterPanel` (status filter); added `GanttView` component; updated `MenuBar`, `HorizontalTimeline` toolbar, `App` state + render; updated `OpenTimelineModal`; updated `HELP_SECTIONS` + `HELP_SECTIONS_AF` |
| `server.py` | Added `dependencies` table to `init_db()`; added `progress` + `status` columns to `migrate_db()`; added `dependencies` read in `_build_timeline_payload`; added `progress` + `status` to events read; added `dependencies` write in `_save_timeline_from_payload`; added `progress` + `status` to events write |
| `CLAUDE.md` | Updated session log, updated date stamp |

---

## Testing Checklist

- [ ] Add two events with date ranges; open Edit Event on one; add "Depends on" the other (FS type); verify it appears in "Blocks" on the first event
- [ ] Attempt to create a circular dependency (A → B → A); verify error message and no dep created
- [ ] Set progress to 60 on an event; verify gradient bar in EventPanel
- [ ] Set status to "at-risk"; verify amber badge in EventPanel; filter it out in FilterPanel
- [ ] Switch to Gantt view; verify bars appear with correct colours, dependency arrow drawn, milestone diamond for point event
- [ ] Save timeline; reload; verify dependencies, progress, status all restored
- [ ] With server running (`python server.py`): save a timeline with dependencies; reload via API; verify dependencies round-trip correctly
- [ ] Run `python server.py` against an existing DB (no `dependencies` table, no `progress`/`status` columns); verify `migrate_db()` adds them without errors

---

REED out.

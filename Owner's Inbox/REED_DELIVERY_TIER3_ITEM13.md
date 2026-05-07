# REED Delivery — Tier 3 Item 13: Nested / Hierarchical Events

**Delivered:** March 2026
**Developer:** REED (Senior Full-Stack Developer, LARRY team)
**Ticket:** Tier 3 — Item 13

---

## Summary

Nested / hierarchical events are now fully implemented across the Timeline App. Any event can be designated as a child of another event. The hierarchy is flat-stored (each event has a `parentEventId` field) and computed on the fly for display — the events array in React state remains flat with no structural changes.

---

## What Was Delivered

### Data Model
- `parentEventId: null` added to every event object (safe default — zero regression for existing data).
- `SAMPLE_EVENTS` all initialised with `parentEventId: null`.
- No circular chains possible — `hasAncestorCycle()` enforced at the modal level.

### Tree Utility Functions (inserted before `hasCycle` in `index.html`)
| Function | Description |
|---|---|
| `buildEventTree(events)` | Builds a root-children map from the flat array |
| `getDescendantIds(eventId, events)` | DFS — returns a `Set` of all descendant IDs |
| `getEventDepth(eventId, events)` | Recursive depth count (root = 0) |
| `hasAncestorCycle(eventId, proposedParentId, events)` | Returns true if setting the proposed parent would create a cycle or self-reference |

### Parent Selector in Add/Edit Event Modals
- Searchable dropdown labelled "Part of (parent event)".
- Excludes the event itself and all its descendants (prevents cycles at the UI level).
- Preview line shows selected parent title + date.
- Clear (✕) button resets to no parent.
- `initialParentId` prop in AddEventModal allows pre-selection when launched from EventPanel.
- EditEventModal shows inline error if `hasAncestorCycle` trips on save.

### Vertical Timeline — Collapse/Expand
- Parent events show a `▶ N sub-event(s)` / `▼ N sub-event(s)` toggle button.
- Clicking toggles a local `collapsed` Set (not persisted — resets on view change as specified).
- Collapsed parents hide all descendants (computed via `collapsedDescendants` useMemo).
- Child events are indented 32px per depth level.
- `↳` prefix on child event titles.
- Child count badge on parent cards.

### EventPanel Enhancements
- **"Part of" bar** — blue `↑ PART OF` banner appears when `event.parentEventId` is set; clicking the parent title navigates to the parent event (calls `onSelectEvent`).
- **"Sub-events" section** — lists direct children; each row is clickable (navigates to child); `＋ Add sub-event` button launches AddEventModal pre-filled with `initialParentId`.

### FilterPanel Cascade-Hide
- Hiding a parent now automatically hides all descendants (via `getDescendantIds`).
- Showing a parent does NOT auto-show descendants — each must be re-shown individually.

### DataGrid Parent Column
- Read-only `Parent` column added to Events table.
- Renders "↳ Parent Title" when a parent exists, or "—" when top-level.
- Uses `extraCellProps.allEvents` for lookup — no extra prop drilling.

### App State / Wiring
- `showAddEvent` extended to accept `true` OR `{ initialParentId }` — existing `showAddEvent && <AddEventModal>` guard works without changes.
- `onSelectEvent`, `onAddSubEvent`, `allEvents` added to EventPanel call site.
- `allEvents` and `initialParentId` added to AddEventModal call site.

### SQLite (server.py)
- Idempotent migration: `ALTER TABLE events ADD COLUMN parent_event_id TEXT DEFAULT NULL`.
- `_build_timeline_payload` reads `parent_event_id` → `parentEventId`.
- `_save_timeline_from_payload` writes `parent_event_id`; INSERT parameter count updated from 22 to 23.

### Help Sections
- **English** (`HELP_SECTIONS`): new "Sub-events & Hierarchy" section appended.
- **Afrikaans** (`HELP_SECTIONS_AF`): new "Sub-gebeure & Hiërargie" section appended.
- Both cover: creating sub-events, parent selector, Vertical timeline collapse/expand, EventPanel navigation, FilterPanel cascade-hide, DataGrid Parent column.

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | +369 lines — tree utilities, modal parent selectors, VerticalTimeline collapse, EventPanel sub-events, FilterPanel cascade, DataGrid Parent column, Help sections |
| `server.py` | `migrate_db()` idempotent migration; `_build_timeline_payload` + `_save_timeline_from_payload` updated |
| `CLAUDE.md` | Build progress table and session notes updated |

---

## Testing Checklist

- [ ] Add a top-level event; confirm `parentEventId` is null in DataGrid Parent column ("—")
- [ ] Add a child event via AddEventModal parent selector; confirm it appears indented under parent in Vertical view
- [ ] Open EventPanel for child; confirm "PART OF" bar appears; click it to navigate to parent
- [ ] Open EventPanel for parent; confirm "Sub-events" section lists child; click "＋ Add sub-event" — AddEventModal opens pre-filled with correct parent
- [ ] Edit child event; attempt to set its own child as parent — confirm cycle error shown
- [ ] In FilterPanel, hide parent event — confirm all descendants disappear
- [ ] Show parent in FilterPanel — confirm descendants remain hidden
- [ ] In VerticalTimeline, click collapse button on parent — confirm children hidden; click again to expand
- [ ] Export JSON; reload — confirm `parentEventId` round-trips correctly
- [ ] With server running: save; reload page — confirm `parent_event_id` persists via SQLite

---

REED — LARRY team

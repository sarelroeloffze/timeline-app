# REED — Delivery Note: Tier 1, Item 3
## Source/Citation System on Events

**Delivered:** 2026-03-28
**Engineer:** REED (Senior Full-Stack Developer, LARRY team)
**Files changed:** `index.html`, `server.py`, `CLAUDE.md`, `Owner's Inbox/REED_DELIVERY_TIER1_ITEM3.md`

---

## What was built

### Data model
- `sources: []` added as a default field on every event object throughout the codebase — SAMPLE_EVENTS, csvRowToEvent, DataView addEvent row, AddEventModal, EditEventModal.
- A source object contains: `id`, `title` (required), `url`, `author`, `year`, `type` (Book / Article / Website / Document / Archive / Interview / Other), `confidence` (Primary source / Secondary source / Unverified).
- Sources are stored as a JSON array. In localStorage the field travels with the event object. In SQLite a new `sources TEXT DEFAULT '[]'` column was added to the `events` table.

### SQLite migration (server.py)
- New `migrate_db()` function runs after `init_db()` on every startup.
- Executes `ALTER TABLE events ADD COLUMN sources TEXT DEFAULT '[]'` wrapped in a `try/except` so it is fully idempotent — silently ignored on all subsequent startups.
- `_build_timeline_payload` now reads `sources` from the DB row and includes it in the event dict sent to the frontend.
- `_save_timeline_from_payload` now writes `json.dumps(e.get("sources", []))` into the INSERT statement.

### SourcesEditor component (index.html)
- New `SourcesEditor` React component inserted before `AddEventModal`.
- Inline expand pattern — no new modal. "+ Add Source" button expands a form row within the parent modal.
- Form fields: Title (required, with Enter-to-save / Escape-to-cancel keyboard support), URL, Author, Year (number input), Type select, Confidence select.
- Existing sources listed as read-only rows with colour-coded type and confidence badges, ✏ (inline edit) and ✕ (delete) buttons.
- Cancel / Add / Save buttons within the inline form.
- Helper constants: `SOURCE_TYPES`, `SOURCE_CONFIDENCE`, `SRC_TYPE_COLOR`, `SRC_CONF_COLOR`.

### AddEventModal
- Added `sources` state (initialised `[]`).
- `SourcesEditor` rendered below the people chips section, above the action buttons, separated by a border-top divider.
- `onAdd(...)` call now includes `sources`.

### EditEventModal
- Added `sources` state (initialised from `event.sources || []`).
- Added `sourcesRef` + `useEffect` to scroll the sources section into view when `event._scrollToSources` is truthy (used by the DataGrid Sources column click).
- `SourcesEditor` rendered below the people chips section, above the action buttons.
- `onSave(...)` call now includes `sources`.

### EventPanel (event detail slide-in)
- New read-only "Sources" section inserted between Description and People.
- Each source card: title (linked `<a>` if URL present, plain `<span>` otherwise), author + year in muted text, type badge, confidence badge — all colour-coded.
- "No sources cited." italic placeholder when the array is empty.

### DataGrid — Sources column
- `EVENT_COLS` extended with `{ key:'sources', label:'Sources', type:'sources', width:80 }`.
- `renderCell` in `DataGrid` handles `col.type === 'sources'` before the standard editing/display block.
- Renders a count badge ("2 sources" or "—"); badge also shows a green ✓ (all-primary) or red ? (any-unverified) indicator derived from `srcIndicator()`.
- Clicking the badge calls `extraCellProps.onEditEvent({ ...row, _scrollToSources: true })`.
- `DataView` accepts a new `onEditEvent` prop and passes it into `extraCellProps`.
- App passes `onEditEvent={ev => setEditEventTarget(ev)}` to `DataView`.

### Horizontal timeline confidence indicator
- `srcIndicator(sources)` helper function returns `''`, `'?'`, or `'✓'` depending on confidence state.
- Item content string now appends `<sup>` badge (green ✓ or red ?) when there is a definitive confidence state.
- Tooltip title extended to include "N sources" line.
- All-primary → `#4ade80` green; any-unverified → `#f87171` red; mixed/no-badge → no indicator.

### Help modal (HELP_SECTIONS + HELP_SECTIONS_AF)
- New "Sources & Citations" section added to both English and Afrikaans arrays, positioned just before the "Claude AI" entry.
- English section covers: what sources are, step-by-step adding, field descriptions, viewing in EventPanel, DataGrid badge mechanics, confidence indicator on the horizontal timeline.
- Afrikaans section mirrors the same structure in Afrikaans.

---

## Architecture decisions
- **Inline form, not a new modal** — keeps the interaction inside the event modals without adding another modal layer. The parent modal's scroll container handles overflow.
- **JSON array on the event row** — no separate table needed at this stage; avoids join complexity while staying compatible with the future SQLite migration (can be normalised later when a dedicated `event_sources` table is warranted).
- **Idempotent migration** — `try/except` around `ALTER TABLE` is the standard SQLite migration pattern used throughout this codebase.
- **`_scrollToSources` flag** — passed as a transient property on the event object to the EditEventModal, which handles it in a `useEffect`. This avoids adding new state or props to the modal stack.

---

## Testing checklist
- [ ] Open app fresh — all sample events load with `sources: []` (no console errors).
- [ ] Add Event modal — click "+ Add Source", fill fields, click Add — source appears in list below. Save event — re-open via ✏ — sources persist.
- [ ] Edit Event modal — sources pre-populated. Edit a source inline (✏), save. Delete a source (✕). Save Changes.
- [ ] Event detail panel — sources section visible below description; title links work; "No sources cited." shows for events with no sources.
- [ ] Data view — Sources column shows "—" for events with no sources. Add sources to an event, switch to Data view — badge updates. Click badge — Edit Event modal opens scrolled to Sources.
- [ ] Confidence indicator — add a source with "Unverified" confidence to an event; the ? superscript appears on the horizontal timeline bar. Change to "Primary source"; ✓ appears.
- [ ] Save + reload — sources survive a save/open cycle in both localStorage and server (SQLite) modes.
- [ ] JSON export/import — sources array present in exported file, restored on import.
- [ ] Help → "Sources & Citations" — section appears in both English and Afrikaans.
- [ ] SQLite server mode — `python server.py` starts without errors even on a pre-existing `timeline.db` that lacks the `sources` column.

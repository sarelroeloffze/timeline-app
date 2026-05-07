# REED — Delivery Note: Tier 1, Item 4
## Tags + Custom Metadata Fields

**Delivered:** 2026-03-28
**Files changed:** `index.html`, `server.py`, `CLAUDE.md`

---

## What Was Built

### Part A — Tags (on both people AND events)

**Data model**
- `tags: []` array added to every person and event object
- Defaults added to SAMPLE_PEOPLE, SAMPLE_EVENTS, DataGrid add-row helpers, and csvRowToPerson / csvRowToEvent
- SQLite: `ALTER TABLE events ADD COLUMN tags TEXT DEFAULT '[]'` and `ALTER TABLE people ADD COLUMN tags TEXT DEFAULT '[]'` — both idempotent in `migrate_db()`

**TagInput component** (`const TagInput` in index.html)
- Reusable chip input — type a tag, press Enter or comma to add
- Backspace removes the last chip
- Auto-suggest dropdown shows tags already used in the timeline (people + events combined), filtered by current input, max 8 suggestions
- Colours: deterministic hash of tag text → one of 12 palette colours (`TAG_PALETTE` + `tagColor()` helper) — same tag is always the same colour everywhere

**Where tags appear**
- Add/Edit Person modal — Tags field with TagInput, allTags passed from App
- Add/Edit Event modal — Tags section below Sources, allTags + fieldDefs from App
- EventPanel — coloured chips below Description when event has any tags
- FilterPanel — new Tags section (see below)

**Tag filtering in FilterPanel**
- New "🏷 Tags" collapsible section in FilterPanel
- Lists every unique tag from people + events combined (derived via `allTags` useMemo)
- Toggle per tag with All on / All off controls
- Each row shows the count of events (`Ne`) and people (`Np`) carrying that tag
- `hiddenTags` Set in App state; tag filter applied in `filteredEvents` (AND logic — any event whose tags contain a hidden tag is excluded)
- `filtersBadge` count includes hiddenTags.size

---

### Part B — Custom Metadata Fields (on events)

**Data model**
- `customFields: []` on each event — array of `{ key: string, value: string }`
- `customFieldDefs: []` on timeline — array of `{ name: string, type: 'text'|'number'|'boolean'|'url' }`
- SQLite: `events.custom_fields TEXT DEFAULT '[]'` and `timelines.custom_field_defs TEXT DEFAULT '[]'` — both idempotent in `migrate_db()`

**CustomFieldsEditor component** (`const CustomFieldsEditor`)
- Shows defined field templates as labelled type-aware inputs (text/number/boolean checkbox/url)
- Shows freeform rows (key + value inputs) for fields not in the template
- "+ Add field" button for freeform rows; ✕ to remove any row
- "Manage fields…" link opens FieldDefsModal (only shown when onManageDefs prop is passed)

**FieldDefsModal component** (`const FieldDefsModal`)
- Small modal to define/delete named field templates
- Each definition has a name and type (text/number/boolean/url)
- "Add" button or Enter to add a definition; ✕ per row to delete
- Saves directly to App's `customFieldDefs` state via `onManageDefs` prop
- Templates are per-timeline and persist to save/load/export

**Where custom fields appear**
- Add/Edit Event modals — CustomFieldsEditor section below Tags section
- EventPanel — read-only key:value list below Tags; URL values are clickable links

---

### SQLite round-trip

All four new columns are read and written in server.py:

| Column | Table | Read in | Written in |
|--------|-------|---------|------------|
| `tags` | events | `_build_timeline_payload` | `_save_timeline_from_payload` |
| `custom_fields` | events | `_build_timeline_payload` | `_save_timeline_from_payload` |
| `tags` | people | `_build_timeline_payload` | `_save_timeline_from_payload` |
| `custom_field_defs` | timelines | `_build_timeline_payload` | `_save_timeline_from_payload` |

---

### Save / Load / Export

`customFieldDefs` added to:
- `saveToStorageLS` and `saveToStorage` (localStorage and API paths)
- `exportJSON` (JSON download)
- `loadTimeline` callback + `handleLoad` (API load, localStorage open, JSON file import)
- `loadTimeline` resets `hiddenTags` to empty Set on timeline switch

---

### Help Updated

Both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans) now include:
- **Tags** section — explaining TagInput usage, auto-suggest, colours, filtering
- **Custom Fields** section — explaining freeform fields, field templates, EventPanel display

---

## Guardrails observed

- TagInput is a standalone reusable component — no duplication between person and event modals
- Existing modals are not redesigned — Tags and Custom Fields sections added at the bottom
- Tag filter in FilterPanel uses AND logic with existing people/category/event filters
- All new columns in SQLite use `try/except` in `migrate_db()` for idempotency
- `tags: []` and `customFields: []` defaults are present in all initialisers so loading old data is safe

---

*REED, Senior Full-Stack Developer — LARRY team*

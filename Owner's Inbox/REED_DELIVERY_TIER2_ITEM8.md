# REED — Delivery Note: Tier 2, Item 8 — Recurring / Repeating Events

**Date:** 2026-03-28
**Agent:** REED, Senior Full-Stack Developer
**Status:** Complete

---

## What was delivered

### 1. Data model

Added `recurrence` field to the event object (persisted through all existing save/load paths):

```js
recurrence: null  // no recurrence (default)
// or:
recurrence: {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: 1,
  endType: 'never' | 'after' | 'on',
  count: null,          // used when endType='after'
  endDate: null,        // used when endType='on'
  daysOfWeek: [],       // weekly: [0–6] where 0=Sun
}
```

### 2. Pure expansion function — `expandRecurringEvents(events)`

Located just before the GEDCOM helpers section. Converts master events into occurrence copies at render time. Each occurrence:
- ID: `${masterId}_occ_${n}` (string)
- Extra fields: `_masterId`, `_occIdx`
- Inherits all master fields; date_start/date_end adjusted per occurrence
- Cap: 500 occurrences total (safety limit)
- Handles both integer-year and ISO-string dates

Sub-year frequencies (daily/weekly/monthly) on integer-year events are allowed with a warning — they approximate to whole years.

### 3. `displayEvents` in App

Added `const displayEvents = useMemo(() => expandRecurringEvents(filteredEvents), [filteredEvents])`.

All views receive `displayEvents` instead of `filteredEvents`:
- HorizontalTimeline, VerticalTimeline, CanvasView, FlowView, ThreadTimeline

DataView still receives raw `events` state (master events only — correct for editing).

`liveEvent` resolves from `displayEvents` first (catches occurrence IDs), then falls back to `events`.

### 4. Recurrence UI — `RecurrenceEditor` component

Inline widget added to both Add Event and Edit Event modals, placed after the people-chips section. Features:
- Toggle: "+ Add recurrence" / "↻ Repeating"
- Frequency: Daily / Weekly / Monthly / Yearly with interval input
- Day-of-week checkboxes (weekly only, Su Mo Tu We Th Fr Sa)
- End condition: Never / After N occurrences / On date (with DateInput)
- Integer-year warning shown for sub-year frequencies
- Plain-English preview: "Repeats every 2 weeks on Mon, Wed • ends after 10 occurrences"

### 5. Edit occurrence choice (Edit Event modal only)

When opening an occurrence (id contains `_occ_`), a scope banner appears:
- **Edit this occurrence only** → detaches as a standalone event (new uid, `recurrence: null`)
- **Edit all occurrences** → edits the master event (default)
- The RecurrenceEditor only shows in "edit all" mode

### 6. Visual ↻ badge

Added to all views:
- **HorizontalTimeline** (main view) — small `↻` prefix in item content HTML
- **CanvasView** (artboard view) — same pattern
- **VerticalTimeline** — `↻` span before title in card header
- **ThreadTimeline** — `↻` span before title in card
- **EventPanel** — `↻` in event title + expanded recurrence info block showing human-readable summary

### 7. Delete confirmation for recurring events

In DataView (`deleteEvent`), before deleting a master event that has `recurrence`, a confirm dialog shows:
> "Delete all N occurrences of 'Event Title'? This will remove the recurring event master and all its generated occurrences."

### 8. iCalendar helper — `eventToICS(event)`

Pure function near the recurrence helpers. Produces iCal VEVENT text with correct RRULE syntax (FREQ, INTERVAL, BYDAY, COUNT/UNTIL). Handles both integer-year and ISO-date events.

In EventPanel: a small `📅` button appears next to the edit pencil when the event has recurrence. Clicking it copies the VEVENT block to the clipboard (with fallback prompt if clipboard API unavailable).

### 9. SQLite migration — `server.py`

Added idempotent migration in `migrate_db()`:
```python
conn.execute("ALTER TABLE events ADD COLUMN recurrence TEXT DEFAULT NULL")
```

Also updated `_build_timeline_payload` to read `recurrence` from DB and `_save_timeline_from_payload` to write it. Full round-trip through the API is complete.

### 10. Documentation

- **Help modal** (English): new "Recurring Events" section with full feature coverage
- **Help modal** (Afrikaans): matching "Herhalende Gebeure" section translated
- **CLAUDE.md**: updated with session notes

---

## Design decisions / guardrails honoured

- **Master events never modified by expansion** — `expandRecurringEvents` is a pure function; no state mutation
- **500-occurrence cap** — prevents runaway expansion on "repeat daily, never ends" rules
- **Integer-year events** — sub-year frequencies produce a yellow warning and approximate to whole years; the system does not crash or block the user
- **Occurrence IDs** are strings (`"21_occ_0"`) which are distinct from master IDs (integers or short strings)
- **server.py** touched only in `migrate_db()`, `_build_timeline_payload`, and `_save_timeline_from_payload` — no route changes
- **JSON export/import** round-trips recurrence automatically (events array passes through as-is)

---

## Files changed

| File | Change |
|------|--------|
| `index.html` | All frontend logic, UI, helpers |
| `server.py` | SQLite migration + serialization |

---

## Known gaps / future work (Item 27)

- Full `.ics` file export (header + multiple events + VCALENDAR envelope) — use `eventToICS()` as building block
- Exception dates (EXDATE) for skipping specific occurrences without detaching
- Claude AI awareness of recurrence (system prompt does not currently explain the recurrence model)

---
from: REED
to: Owner
date: 2026-03-31
re: Delivery — Tier 5 Item 27 — Calendar sync (.ics export)
---

# Tier 5 Item 27 — Calendar Sync (.ics Export) ✅

## What was built

Full iCalendar (.ics) export of timeline events — compatible with Google Calendar, Apple Calendar, Microsoft Outlook, and any app that supports the iCalendar RFC 5545 standard.

### `buildICSCalendar()` function
- RFC 5545-compliant calendar file builder
- Line folding at 75-octet boundary (`foldICSLine`)
- Proper TEXT property escaping (`escICS`)
- Supports all event date types: integer year (BC/AD) and ISO date strings
- DTSTART/DTEND as `VALUE=DATE` (all-day events)
- RRULE support: maps recurrence rules (daily/weekly/monthly/yearly + BYDAY/COUNT/UNTIL)
- LOCATION + GEO fields from event location data
- CATEGORIES field from event category
- STATUS mapping: planned→TENTATIVE, active/done→CONFIRMED, cancelled→CANCELLED, at-risk→TENTATIVE
- ATTENDEE lines from associated people
- DTSTAMP from current UTC time
- Graceful BC date handling (iCal does not support BC — clamped to year 1 AD with note)

### `ICSExportModal` component
- Filter: All events or Date range (from year / to year)
- Options checkboxes: Include recurrence rules, Include locations, Include people as attendees, Include description
- Event count preview ("N events will be exported")
- ⬇ Download .ics — triggers blob download with correct MIME type `text/calendar;charset=utf-8`
- 📋 Copy to clipboard — copies raw iCal text with "Copied!" flash feedback
- Format info note listing supported calendar apps

### Single-event 📅 button (EventPanel)
- The `eventToICS()` helper (pre-existing) converts a single event to a VEVENT text block with RRULE
- 📅 button in EventPanel copies to clipboard or shows prompt fallback

### Entry points
- **File → 📅 Export to Calendar (.ics)…** in MenuBar
- `showICSExport` App state + `ICSExportModal` render

### i18n
All 4 languages (en/af/es/fr) have translations for:
`Export to Calendar (.ics)…`, `📅 Export to Calendar (.ics)…`, `Download .ics`,
`Include recurrence rules`, `Include locations`, `Include people as attendees`,
`All events`, `Date range`

### Help
"Calendar Export (.ics) 📅" section in both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans)

---

*Delivery note written: 2026-03-31*

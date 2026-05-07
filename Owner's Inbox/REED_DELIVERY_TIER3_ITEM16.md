# REED — Delivery Note
## Tier 3, Item 16: Table / Chronology Report View (Print-Ready)

**Delivered:** March 2026
**Status:** COMPLETE — Tier 3 fully complete

---

## What was built

A new **📋 Report** view — the 10th view in the Timeline app. It is a read-optimised, paginated, print-ready chronological table of all visible events. Distinct from the DataGrid (edit-oriented); the Report view is for reading, sharing, and printing.

---

## Component: `ReportView`

Located immediately before `const App` in `index.html`. ~300 lines. Receives:
- `events` — the `filteredEvents` array from App (respects all current filters)
- `people` — full people array (for name/colour lookup)
- `timelineName` — shown in toolbar label and print page header
- `setOrientation` — view-switcher buttons

---

## Columns (9 total)

| Column | Details |
|---|---|
| Date | `fmtDate` with current context; start + optional end date |
| Title | Bold; sub-events show `↳` prefix |
| People | Avatar-style initials chips with person colour |
| Category | Coloured badge from CatCtx |
| Location | 📍 prefix; shown only when `location.name` is set |
| Description | 2-line truncate with Show more/less; full text in print |
| Sources | Count badge; click to expand inline footnote list |
| Tags | Coloured chips from TAG_PALETTE hash |
| Status | Colour-coded badge from STATUS_CONFIG |

All columns individually togglable via pill buttons in the toolbar.

---

## Toolbar

- View-switcher quick buttons: Horiz / Vert / Data
- "📋 Report" label + timeline name
- Column visibility toggles (9 pill buttons)
- Sort: Date ↑ / Date ↓ / Title A–Z
- Group by: None / Category / Person / Year / Decade / Century
- Local search box (independent of global search)
- Event count
- ⬇ CSV button
- 🖨 Print button

---

## Grouping

When Group by is active:
- Full-width coloured header rows between groups
- Shows group name + event count
- Click header to collapse/expand that group
- Category grouping uses category colour; others use indigo

---

## Print

- `handlePrint()` sets `data-printing='1'` on root div, calls `window.print()`, clears after 1 s
- `@media print` CSS: hides toolbar; full-width table; no truncation; description shown in full
- `data-title` attribute on root div used for `::before` content (page header)
- `@page { margin: 15mm }` rule included

---

## CSV Export

- `handleCsvExport()` builds CSV from visible rows using only visible columns
- Uses existing `buildCSV` + `downloadText` helpers
- Filename: `{timelineName}-report-{date}.csv`

---

## Entry Points

1. `📋 Report` button in HorizontalTimeline toolbar
2. `📋 Report` button in VerticalTimeline toolbar
3. View menu → `📋 Report` (MenuBar)
4. `case 'viewReport'` wired in App `handleMenuAction`

---

## Other changes

- `HELP_SECTIONS` — new "Report View" section (English)
- `HELP_SECTIONS_AF` — new "Verslag-aansig" section (Afrikaans)
- `AF` dictionary — `'📋 Report':'📋 Verslag'`
- `@media print` — Report-specific rules added alongside existing Canvas print rules
- `CLAUDE.md` — session notes added; Tier 3 marked complete

---

## Tier 3 Summary

All 16 items delivered:

| Item | Feature |
|---|---|
| 11 | Location field + Map view |
| 12 | Date uncertainty / confidence flags |
| 13 | Nested / hierarchical events |
| 14 | Drag-to-reschedule (Horizontal) |
| 15 | Bulk edit operations |
| 16 | Table / chronology Report view |

— REED, Senior Full-Stack Developer

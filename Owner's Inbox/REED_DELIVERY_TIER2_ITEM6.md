# REED — Delivery Note: Tier 2 Item 6 — PowerPoint (.pptx) Export

**Date:** 2026-03-28
**Developer:** REED (Senior Full-Stack)
**Milestone:** Export — PNG, PDF, PowerPoint (.pptx) → now fully ✅ Done

---

## What Was Built

Full PowerPoint export capability added to `index.html`, running entirely in the browser via **PptxGenJS 3.12.0** (CDN). No server changes were needed or made.

### Two Export Modes

**Mode 1 — Timeline Slide** (single slide)
- Captures the current view using the existing html2canvas pipeline (same as PNG export)
- Inserts the captured image as a full-slide background (10 × 6.9 in)
- Adds a semi-transparent title bar at the top with the timeline name
- Adds a "Generated [date]" footer
- Slide size: Widescreen 16:9 (`LAYOUT_WIDE`)

**Mode 2 — Story Slides** (one slide per event)
- Title slide: timeline name (44pt), event count, date range, generation date
- One slide per event, in chronological order
- Each event slide contains:
  - Left edge accent bar in the event's category colour
  - Category label chip (uppercase, colour-matched background)
  - Date subtitle (start – end)
  - Event title (24pt bold)
  - Description body text
  - Tags as `#hashtag` chips (indigo)
  - Associated people listed at bottom
  - Sources as footnotes (up to 3 citations in italic muted text)
  - First event image on the right half of the slide (if available and enabled)
- Slide number in bottom-right corner

### Options Available in the Modal
- **Mode selector**: Timeline Slide / Story Slides (with event count shown)
- **Slide theme**: Match timeline background / Dark / Light (luminance-detected for text colour)
- **Include event images** checkbox
- **Include sources as footnotes** checkbox
- **Filename** field (defaults to timeline name + date)
- Export button with spinner during generation

### Graceful Handling
- PptxGenJS CDN not loaded → clear red error banner before the export button is even clickable
- Zero visible events → amber warning message; export blocked
- Server-hosted image URLs (`/images/...`) fetched and base64-encoded for embedding — works in both server mode and localStorage mode
- Image fetch/insert failures → silently skipped; the slide continues without the image (no crash)

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | CDN script tag (PptxGenJS); Afrikaans translation key; helper functions (`imgToPptxData`, `bgColorFromSettings`, `catHexForPptx`, `sortEventsByDate`, `personInitialsLabel`, `doExportPptx`); `PptxExportModal` component; `showExportPptx` state; `exportPptx` action case in `handleMenuAction`; `File → Export to PowerPoint…` menu item; `HELP_SECTIONS` EN updated; `HELP_SECTIONS_AF` AF updated |
| `CLAUDE.md` | Milestone 7 marked ✅ Done; session notes added; "Still remaining" list updated |
| `Owner's Inbox/REED_DELIVERY_TIER2_ITEM6.md` | This file |

---

## Where the Code Lives in index.html

- CDN tag: line 16 (immediately after jsPDF)
- Helper functions + `doExportPptx`: ~lines 5344–5604 (after `doExportPDF`, before `EXPORT_PAPER_SIZES`)
- `PptxExportModal`: ~lines 5606–5755 (after `doExportPptx`, before `ExportModal`)
- Menu entry: in `MenuBar` MENUS.File array (after `Export to PDF…`)
- State: `showExportPptx` in App component
- Action: `case 'exportPptx'` in `handleMenuAction`
- Render: after `ExportModal` render in App JSX

---

## How to Test

1. Open the app at `http://localhost:8765` (or directly in browser)
2. Load the sample timeline (or any timeline with events)
3. Click **File → Export to PowerPoint…**
4. Try **Story Slides** mode — verify modal shows event count
5. Click **Export .pptx** — file downloads immediately
6. Open in PowerPoint / Google Slides / Keynote — verify title slide + per-event slides
7. Try **Timeline Slide** mode — verify screenshot capture + title overlay
8. Try with **Include event images** toggled on/off
9. Try with **Light** theme

---

## Design Decisions

- `doExportPptx` is a pure async function (not a React component method) — same pattern as `doExportPNG` / `doExportPDF`
- `PptxExportModal` receives `people`, `events`, `categories`, `bgSettings` as props — no global state access needed
- Slide dimensions are hardcoded to PptxGenJS `LAYOUT_WIDE` (10 × 7.5 inches) — all coordinates are absolute inches, no `'100%'` strings
- `ShapeType.rect` used throughout (no `roundRect`) for maximum compatibility
- Image embedding uses `data:` URLs — works whether images are stored as base64 (localStorage mode) or as server paths (fetched and converted)
- `sorted.indexOf(ev)` for slide numbering is O(n) but acceptable for timeline scales (hundreds of events max)

---

*Delivered clean. No existing PNG/PDF export flow was touched.*

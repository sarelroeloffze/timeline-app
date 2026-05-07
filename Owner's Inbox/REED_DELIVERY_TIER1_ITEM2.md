# REED Delivery Note — Tier 1, Item 2: Visual Export (PNG + PDF)

**Delivered:** 2026-03-28
**Engineer:** REED — Senior Full-Stack Developer, LARRY team
**Gap addressed:** PAX analysis gap 4.1 — Visual export (PNG + PDF)

---

## What was built

### Libraries added
Two CDN-loaded libraries added to the `<head>` of `index.html` (after existing scripts, no build step required):
- **html2canvas 1.4.1** — DOM-to-canvas rasterisation
- **jsPDF 2.5.1 (UMD)** — PDF document generation from canvas data

### Core export functions
Two async helper functions added before the MenuBar component:

| Function | Purpose |
|---|---|
| `getExportTarget(orientation)` | Resolves the correct DOM element for the current view |
| `doExportPNG(orientation, filename, scale)` | Rasterises the target and downloads a `.png` file |
| `doExportPDF(orientation, filename, scale, paperFormat, pdfOrientation)` | Rasterises to JPEG and embeds into a jsPDF document, downloaded as `.pdf` |

### ExportModal component
A full-featured export dialog (`ExportModal`) with:
- **Format selector** — PNG or PDF (large toggle buttons)
- **PDF options** — orientation (Landscape / Portrait) + paper size (A4, A3, Letter, Legal, A2)
- **Render scale** — 1× / 2× / 3× (2× recommended and default)
- **Filename field** — defaults to `<timelineName>-<view>-<date>`; fully editable
- **View-specific hints** — Canvas artboard note; Horizontal/Thread "use Fit All" note
- **Loading spinner** — animated while html2canvas renders (can take a few seconds on large views)
- **Error display** — friendly message on failure
- **Library warning** — shows a clear error if html2canvas/jsPDF fail to load from CDN

### File menu entries
Two new items added to the **File** menu, directly below "Export JSON…":
- `Export to PNG…` → opens ExportModal pre-selecting PNG
- `Export to PDF…` → opens ExportModal pre-selecting PDF

Menu actions `exportPng` and `exportPdf` wired in `handleMenuAction`. `showExport` state added to App.

### Canvas toolbar buttons
Two quick-export buttons added to the Canvas view toolbar, immediately after the existing **🖨 Print** button:
- **⬇ PNG** — exports artboard at 2× scale, no dialog
- **⬇ PDF** — exports artboard at 2× scale, A4 landscape, no dialog

These are for the primary print-oriented view. The existing Print button is unchanged.

### View IDs for capture targeting
Four `id` attributes added to view root divs so `getExportTarget()` can resolve them:
- `id="tl-view-horizontal"` — HorizontalTimeline root div
- `id="tl-view-vertical"` — VerticalTimeline root div
- `id="tl-view-flow"` — FlowView root div
- `id="tl-view-thread"` — ThreadTimeline root div
- Canvas artboard already had `id="timeline-canvas-artboard"`

---

## What gets captured per view

| View | Target element | Notes |
|---|---|---|
| Canvas | `#timeline-canvas-artboard` | Full paper size at full resolution; best export surface |
| Horizontal | `#tl-view-horizontal` | Visible viewport only; use Fit All before exporting |
| Vertical | `#tl-view-vertical` | Full scrollable card list height |
| Flow | `#tl-view-flow` | Full SVG renderer |
| Thread | `#tl-view-thread` | Visible viewport; use Fit All before exporting |
| Data / Genealogy | Falls back to `#root` | Not the primary export targets |

---

## Files modified

| File | Change |
|---|---|
| `index.html` | CDN scripts, view IDs, `doExportPNG`, `doExportPDF`, `getExportTarget`, `ExportModal`, File menu items, Canvas toolbar buttons, `showExport` state, `handleMenuAction` cases, `HELP_SECTIONS`, `HELP_SECTIONS_AF` |
| `CLAUDE.md` | Milestone 7 status updated; session notes added |

---

## Guardrails compliance

- No view layouts or styling were changed
- Existing Print button in Canvas toolbar is untouched — PNG and PDF are added alongside it
- `server.py` was not touched
- App loads and runs cleanly with no build step
- No new files other than this delivery note

---

## Known limitations

- Horizontal and Thread views capture the currently visible window, not the full timeline extent — user should Fit All before exporting for best coverage
- html2canvas cannot cross-origin-capture images served from other domains without `useCORS: true` on the server — images served by the Python backend at `/images/…` should capture fine
- Very wide banner-format canvases (e.g. Banner 5 m) may be slow to rasterise at 2× scale; the spinner in the modal communicates this
- PowerPoint (.pptx) export is a separate deliverable (PptxGenJS integration) — not in scope for this item

---
name: LARRY
role: Chief Orchestrator — Personal AI Assistant
type: orchestrator
---

# LARRY — Chief Orchestrator

## Identity

LARRY is the user's personal AI assistant and the team lead. LARRY never executes work directly. LARRY's sole job is to understand what the user needs, identify the right team member (or commission a new one via NOLAN), and delegate the task with clear, precise instructions.

## Core Guardrails

1. **Never do the work yourself.** LARRY orchestrates — always routes every task to the right specialist.
2. **Always confirm the right person for the job.** If no current team member covers the needed expertise, brief NOLAN to hire one (after PAX has researched what that role requires).
3. **Be explicit in delegations.** When handing off to a team member, LARRY provides: the task, the context, the expected output, and any constraints.
4. **One voice to the user.** LARRY is the user's single point of contact. Team members report back to LARRY; LARRY summarises and responds to the user.
5. **Maintain the roster.** After every new hire, LARRY ensures `ROSTER.md` is updated.

## Delegation Protocol

```
User → LARRY → [right team member] → output → LARRY → User
```

If no team member fits:
```
User → LARRY → NOLAN (brief: what role is needed) → PAX (research: what skills this role requires) → NOLAN (build persona) → LARRY (approve + add to roster) → delegate task
```

## Current Team

See `Team/ROSTER.md` for the full team.

---

# Timeline App — Project Notes

## Project Overview

A visual timeline builder with rich media support. The app allows users to manage people and dates on timelines, pull in pictures and graphics, and export highly visual timelines for print, PowerPoint, and other applications. Built with the end goal in mind from day one.

---

## Project Status

**Current stage: Firebase Migration Complete — Cloud-native with automatic sync ✅**
*Last updated: May 18, 2026 (Firebase Phases 1-7 complete — Firestore + Storage + Auth + offline + real-time sync)*

### Build Progress

| # | Milestone | Status | Notes |
|---|---|---|---|
| 1 | Visual timeline component with hardcoded sample data | ✅ Done | `index.html` — opens in browser, no build step |
| 2 | Person and event data entry forms | ✅ Done | Add Person + Add Event modals; Edit Person + Edit Event modals; bidirectional person↔event connections |
| 3 | SQLite via Python backend | ✅ Done | `timeline.db` + REST CRUD + file-system image storage; localStorage fallback when server not running |
| 4 | Filtering and search | ✅ Done | People, categories, text search + FilterPanel with per-event hide toggles |
| 5 | Claude AI integration | ✅ Done | Chat panel, streaming, add-person/add-event from suggestions |
| 6 | Image and media attachment | ✅ Done | People photos + multi-image events, lightbox with scroll-zoom+pan, auto-resize; canvas image drag/drop layer |
| 7 | Export — PNG, PDF, PowerPoint (.pptx) | ✅ Done | PNG + PDF (html2canvas + jsPDF via CDN); PPTX via PptxGenJS 3.12.0 CDN — Timeline Slide + Story Slides modes; fully in-browser |
| 8 | Electron packaging | ✅ Done | `dist/Timeline Setup 1.0.0.exe` — NSIS Windows installer (x64); Node.js v24 + electron-builder |
| 9 | Welcome screen + Recent Files | ✅ Done | Blank-slate launch; returning-user recent timelines grid; template gallery strip; File → Open Recent… |
| 10 | Subway view (11th view mode) | ✅ Done | Metro-map SVG; person lines; shared-event converging stops; relationship arcs; era bands; highlight mode |
| 11 | Left sidebar — Places, Arcs, Search, People panels | ✅ Done | 44px icon rail; 4 slide-out panels; Places + Arcs data models; Link to Place on events; arc overlay on Horizontal view |
| 12 | Calendar Markers | ✅ Done | Solid/dashed/dotted date markers; Today marker; full persistence; shown in Horizontal, Vertical, Thread views |
| 13 | Tree View (12th view mode) | ✅ Done | Genealogy family tree; d3-hierarchy layout; top-down/left-right toggle; portrait nodes; spouse lines; multi-parent support |
| 14 | Radial / Wheel View (13th view mode) | ✅ Done | Circular wheel chart; inner=categories, outer=events; click to open EventPanel; zoom/pan; style panel |
| 15 | Horizontal timeline scroll fix | ✅ Done | Native browser scroll; explicit height calculation; no `horizontalScroll` option; dynamic overlay positioning |
| 16 | Firebase migration (Phases 1-7) | ✅ Done | Cloud Firestore database + Firebase Storage images + Authentication (Email + Google OAuth) + offline persistence + real-time sync + My Timelines dashboard; removed server.py + timeline.db |

---

## What's Built So Far

### `index.html` — Stage 1 Prototype
Single-file React app (no build step — open directly in browser). Uses CDN-loaded libraries.

**Libraries in use:**
- React 18 (via CDN + Babel standalone for JSX)
- vis-timeline 7.7.2 — swimlane timeline rendering
- Tailwind CSS (via CDN)

**Features working:**
- vis-timeline swimlane view — one row per person, events as coloured bars/points
- 5 sample people (Jesus of Nazareth, Curie, Churchill, Earhart, Einstein)
- 22 sample events spanning 4 BC – 1965 AD, with point events and date-range bars
- 7 colour-coded categories (Religion, Politics, Science, Aviation, Historical, Award, Personal)
- Ancient/BC date support — integer year system with `makeYear()` / `dateForVis()` / `fmtDate()` helpers; BC dates display as "4 BC", AD as "33 AD"
- Wide date range: timeline spans ~4 BC to 2025 AD (~2000 years); zoomMax set to 2100 years
- Sidebar — toggle people on/off, toggle categories on/off
- Search — filters by event title and description text
- Event detail panel — slides in on click (title, date, description, badge, people)
- Timeline toolbar — Fit All, Zoom In/Out, quick-jump year buttons
- Mouse wheel zoom + drag to pan
- Dark theme throughout
- **New Timeline** — modal to name a new timeline, option to start blank or with sample data; resets all state
- **Open Timeline** — modal listing all timelines saved in localStorage; click to open, ✕ to delete
- **Save** — saves current people + events to localStorage under the timeline name; shows "Saved ✓" flash
- **Export JSON** — downloads current timeline as a `.json` file (for backup or sharing)
- **Import from JSON file** — in the Open modal, pick a previously exported JSON to reload it
- People and events are now React state (not hardcoded constants) — ready for data entry forms in Stage 2
- **Orientation toggle** — ⇕ Vertical / ⇔ Horizontal button in timeline toolbar; switches between vis-timeline swimlane view and custom vertical scroll view; sort order toggle (oldest/newest first) in vertical view
- **People photos** — click any person avatar in the sidebar to upload a photo (JPG, PNG, GIF, WebP, SVG); auto-resized to 300×300 via canvas; photo shown in sidebar, event detail panel, vis-timeline group label, and vertical timeline cards
- **Event images** — "+ Add" button in event detail panel; supports multiple images per event; multiple formats accepted; resized to 800×600 max; displayed as 2-column thumbnail grid with click-to-lightbox; ✕ to remove; thumbnails also shown in vertical timeline cards; 🖼 flag on vis-timeline items that have images
- `resizeImage()` helper — handles JPG, PNG, GIF, WebP, BMP, TIFF, SVG; preserves PNG transparency; fills white background for JPEG output
- **Data view (spreadsheet mode)** — third view alongside Horizontal/Vertical; shows an inline editable DataGrid for People and Events
- **DataGrid component** — inline cell editing with type-aware inputs (text, date, select, color, person multi-select); keyboard navigation (Enter=commit, Tab=move, Esc=cancel); delete row on hover; add row at bottom
- **CSV import** — `ImportCSVModal` with drag-and-drop zone, file picker, preview (first 5 rows), merge or replace mode; separate tabs for People and Events
- **CSV export** — download current people or events as `.csv` file from the Data view
- **CSV templates** — download blank People/Events CSV with correct column headers
- CSV helpers: `parseCSVLine`, `parseCSV`, `buildCSV`, `downloadText`, `peopleToCsvRows`, `eventsToCsvRows`, `csvRowToPerson`, `csvRowToEvent`
- `uid()` helper — generates unique IDs for new rows
- `Btn` shared component — consistent button styling across modals and toolbars
- **Enhanced date parsing** — `parseDate()` accepts `4 BC`, `33 AD`, `4BC`, `25/12/1867`, `25/12/4 BC`, `-4`, `1867`, `1867-11-07`
- **Date display format** — `fmtDate(d, fmt)` with three modes: `bcad` (4 BC · 33 AD · 1867), `signed` (-4 · 33 · 1867), `full` (7 Nov 1867 · 4 BC); format picker dropdown in TopBar; format propagated via `DateFmtCtx` React context + `useFmt()` hook; all components (Sidebar, EventPanel, DataGrid, VerticalTimeline, HorizontalTimeline tooltip/group HTML) respond instantly
- **DateEntryWidget** — floating date-entry panel that appears when clicking a date cell in the DataGrid; two tabs: "Year (BC/AD)" for ancient integer-year dates (year number + AD/BC toggle), and "Full date" for precise ISO dates (native date picker or free-text dd/mm/yyyy); both date types coexist on the same timeline; preview shows what will be stored before committing; panel uses `position: fixed` anchored to the cell's `getBoundingClientRect()` so it floats above `overflow: auto` table containers; Enter=commit, Esc=cancel, outside-click=cancel
- **Background customisation** — 🎨 Background button in TopBar opens `BgSettingsModal`: solid colour, gradient (two colours + 8 directions), or uploaded photo (auto-resized to 1920×1080); live preview swatch; `bgToCss()` helper applies the chosen setting to the main timeline area
- **Background sections (eras)** — 🌈 Sections button in both horizontal and vertical toolbars opens `EraEditorModal` (renamed "Background Sections"); each section/era has its own full background: solid colour, gradient (two colours + 8 directions), or photo (uploaded, resized to 1920×1080); click 🎨 on any section row to expand its background editor with a live preview strip; 5 quick-add presets (Ancient through Modern) each with preset dark bg colours; sections are identified by time range (yearStart, yearEnd); the 🎨 Default BG button sets the fallback background for time outside any section
- **Section rendering — Horizontal view**: per-section background divs rendered as a DOM overlay absolutely positioned behind the vis-timeline content, updated on every pan/zoom via `rangechanged` + `changed` events; era labels shown at bottom-left of each section in the label accent colour with text-shadow
- **Section rendering — Vertical view**: era-section banners (full-width header rows with section background and label) are injected between event cards whenever the era changes; event cards show a subtle tint from their era background; date labels use the era accent colour; `eraForYear()` helper matches events to eras by year; `VerticalTimeline` now accepts `eras` and `onEditEras` props

**Known limitations / not yet built:**
- No "Add Person" / "Add Event" form modals yet — rows can be added via DataGrid or CSV import, but guided forms are still needed (Stage 2)
- ~~No backend — everything is in-memory + localStorage~~ **Done in this session (Stage 3)**
- Section backgrounds visible in both Horizontal and Vertical views; Data view does not show backgrounds

---

## File Structure

**Current (Firebase era — May 2026):**
```
timeline/
  index.html           ← Single-file React app + Firebase SDK (1.4MB)
  main.js, preload.js  ← Electron wrapper
  package.json         ← Electron dependencies
  
  images/              ← (Empty — images now in Firebase Storage)
    people/
    events/
    canvas/
  
  mcp-server/          ← Dev tools
    bridge.js          ← HTTP bridge for dev.html panel (localhost:3131)
    .env               ← API key + project path
  
  dev.html             ← Floating dev assistant panel
  
  CLAUDE.md            ← This file — project notes and status
  FIREBASE_SETUP_GUIDE.md
  BUILD.md
  
  Team/                ← AI team member personas
  Owner's Inbox/       ← Delivery notes (REED_DELIVERY_*.md files)
  biblical-data/       ← Sample timeline data
  Photos/, Photos2/    ← UI reference screenshots
  
  dist/                ← Electron build output (excluded from Dropbox)
    Timeline Setup 1.0.0.exe
```

**Archived (moved to ~/Desktop/Timeline-Archive-20260924/):**
```
  server.py            ← OLD FastAPI backend (replaced by Firebase)
  timeline.db          ← OLD SQLite database (replaced by Firestore)
  requirements.txt     ← OLD Python dependencies
  index-backup-*.html  ← 6 old backups (~8MB)
```

**External (not in project folder):**
```
  ~/Documents/timeline-mcp/  ← MCP server for Claude Desktop
    server.js                 ← Gives Claude Desktop access to project files
    .env                      ← API key + TIMELINE_PATH
    node_modules/
```

## Running the App

**Browser Mode:**
Just open `index.html` in a browser. Firebase handles all backend operations (auth, database, storage).

**Electron Desktop App:**
```bash
npm start
# Or run the built installer: dist/Timeline Setup 1.0.0.exe
```

**No Python server needed** — Firebase replaced the old `server.py` backend.

---

## Next Immediate Step

**Completed this session:**
- DateEntryWidget — dual-tab date entry (Year BC/AD + Full date) in DataGrid date cells ✅
- Background customisation (global default BG — solid/gradient/photo) ✅
- Background sections per time-era (Horizontal + Vertical views) ✅
- Date display format picker (BC/AD · Signed · Full date) — propagated via React context ✅
- Enhanced parseDate() supporting BC/AD, dd/mm/yyyy, ISO, signed integer ✅
- **Claude AI integration** — `server.py` FastAPI backend; `ClaudePanel` streaming chat UI; Claude can propose adding people/events as action cards; user clicks "+ Add to Timeline" to apply; model: `claude-sonnet-4-6` ✅
- **DateEntryWidget position:fixed fix** — widget now uses `getBoundingClientRect()` to float above overflow:auto table containers ✅
- **server.py + requirements.txt** — FastAPI backend created; app now runs via `python server.py` on port 8765 ✅

**Completed previous session:**
- Claude AI integration — server.py FastAPI backend; ClaudePanel streaming chat UI ✅
- DateEntryWidget position:fixed fix ✅

**Completed this session:**
- **Add Person modal** — name, birth/death dates (DateInput widget), role, colour picker with palette + native picker; avatar preview with live initials; `+ Person` button in TopBar and `＋` in sidebar header ✅
- **Add Event modal** — title, start/end dates, category select, description textarea, person association chips ✅
- **Save/load persists eras + bgSettings** — both `saveToStorage` and `exportJSON` now include eras and bgSettings; `OpenTimelineModal` restores them on load ✅
- **Claude enhancements** — edit_person and edit_event action types added; full timeline context (no more 30-item limit); person/event IDs sent so Claude can reference specific entries; max_tokens raised to 4096; `✏ Apply Edit` action cards render in amber ✅

**Completed this session:**
- **Edit Person modal** — pre-filled form with all fields + event checkboxes; ✏ hover button per person in Sidebar ✅
- **Edit Event modal** — pre-filled form with all fields + people chips; ✏ button in EventPanel header ✅
- **Bidirectional person↔event connections** — EventPanel shows all people as toggle chips (click to link/unlink instantly); EditPersonModal shows event checkboxes; EditEventModal shows people chips ✅

**Completed this session:**
- **Scalable media** — three-layer zoom system:
  1. **Lightbox** upgraded: scroll-wheel zoom (up to 10×), drag-to-pan, double-click reset, zoom % indicator ✅
  2. **Vertical timeline zoom control** — `−` / `%` / `+` / Reset buttons in toolbar; CSS `zoom` scales entire card layout (cards, text, images, avatars) proportionally from 40% to 300% ✅
  3. **Horizontal timeline: images in vis-timeline bars** — when zoomed in to < 80 years visible, events with images show their first image inline inside the timeline bar; threshold-based rebuild avoids per-pan re-renders ✅
- **Horizontal timeline layout fix** — vis-timeline overwrites container's `position:absolute` → added intermediate absolute wrapper so `height:100%` resolves correctly ✅

**Completed this session:**
- **Help modal** — `?` button in top bar opens a full Help & Feature Guide; left sidebar with 11 sections (Getting Started, People, Events, Connections, Views, Zoom & Navigation, Images & Media, Backgrounds & Eras, Date Formats, Import & Export, Claude AI); content stored in `HELP_SECTIONS` constant for easy updates ✅
- **Canvas / Working Surface** — `📐 Canvas` button in Horizontal/Vertical toolbars; full artboard view showing the timeline on a paper surface; right-click context menu to Add Event, Add Person, or Open Event Details; dual zoom controls (Timeline + Canvas); `🖨 Print` button + `@media print` CSS; sidebar hidden in canvas mode ✅
- **River-of-history visual style** — parchment/📜 Parchment theme toggle (default on): cream background, sepia axis, taller rows, richer event bars (more opaque fill + dark legible text); **lifespan river bands** — each person's birth→death rendered as a full-height tinted background ribbon in their row (the "river of history" look); toggling to 🌙 Dark restores original dark theme; `@media print` targets `#timeline-canvas-artboard` ✅
- **Banner / roll paper sizes** — Banner 1 m (3779×600), Banner 2 m (7559×700), Banner 5 m (18898×800), Poster Tall, Square, Custom (no upper px limit) added to Canvas paper size selector; reference: user's Photos/ folder shows accordion-fold "23 feet long" chart as target visual output ✅

**Completed this session:**
- **Application menu bar** — replaces TopBar; 8 menus: File, Edit, View, Navigation, Item, Sync, Tools, Help; Settings under Tools → "⚙ Settings…"; `MenuBar` component with `S = 'SEP'` / `mi()` / `ck()` helpers; declarative MENUS object built inside render so checkmarks update reactively ✅
- **Slim secondary Toolbar** — timeline name + search box + +Person / +Event / 🤖 Claude buttons; separate from MenuBar ✅
- **Sidebar removed** — people list no longer shown on the left of the timeline; replaced by `PeopleFilterModal` accessible via View → People & Filters… or Item → People & Categories… ✅
- **Slim group labels (42px)** — vis-timeline group label column reduced from 170px to 42px; each row shows colored initials + colored left border (`style: border-left:4px solid ${p.color}`); hover tooltip shows full name + dates; timeline content uses nearly full width ✅
- **Navigation commands wired** — `timelineCmds = useRef({})` in App, populated by active timeline via `registerCmds` prop; Menu → Navigation items call fitAll/zoomIn/zoomOut/goTo on the live vis-timeline instance ✅

**Completed this session:**
- **Canvas image layer** — drag-and-drop or file picker adds photos/artwork directly onto the canvas artboard as freely positionable, resizable image overlays; images saved/loaded with timeline JSON ✅
- **FilterPanel** — right-side collapsible panel (⊟ Filters button in toolbar); People section (search box when >10 people, select-all/none), Categories section, Events section (per-event hide toggle grouped by person); badge shows count of hidden items; `hiddenEvents` Set persisted with save/export ✅
- **Scalability fixes** — `personEventsMap` useMemo (O(1) lookup replaces O(n²) filter); people search in FilterPanel; localStorage quota error handling with friendly alert ✅
- **Canvas scroll fix** — removed flex centering from scroll container; `margin:0 auto` on sizing wrapper so artboard scrolls correctly in all directions ✅
- **Windows Electron build** — `dist/Timeline Setup 1.0.0.exe` (NSIS installer, x64); built with electron-builder 25.1.8 + Electron 33.4.11; Node.js v24.14.0 ✅

**Completed this session:**
- **River / Flow View** — new `〰 Flow` view mode (5th view alongside Horizontal/Vertical/Data/Canvas); custom SVG renderer showing each person as a horizontal ribbon flowing left→right through time; relationship connections rendered between parent→child (line/curve/river styles), spouse (dashed bracket), influenced (dashed arrow); 4 style presets: Lines, Bars, River (parchment), Family; fully customisable style panel: connection type (line/curve/river), ribbon style (line/bar/thick), ribbon height slider, row spacing slider, show/hide events/portraits/labels, dark/parchment theme; topological sort auto-layout puts parents above children; zoom in/out/fit controls; event dots clickable on ribbons; portrait circles with clipPath SVG masking; year axis with smart tick intervals; info bar at bottom ✅
- **Relationships data model** — global `relationships` state `[{ id, fromId, toId, type }]`; types: 'parent', 'spouse', 'influenced'; persisted in save/export JSON and restored on load; `SAMPLE_RELATIONSHIPS = []` constant ✅
- **Relationship editor in Edit Person modal** — "Relationships (Flow View)" section with Add button; type selector (Parent of / Spouse of / Influenced) + person picker dropdown; displays current relationships with delete button; duplicate detection; label shows direction correctly (Parent of vs Child of depending on direction) ✅

**Completed this session:**
- **Flow View Extras style column** — Font family (sans/serif/mono), label position (inside/above/below), connection dash (none/dash/dot), ribbon border slider, show birth/death dates checkbox, background colour override with reset; added as 5th column in the Flow style panel ✅
- **StyleTemplateBar in Flow View** — `<StyleTemplateBar view="flow" ...>` rendered below the style panel when panel is open ✅
- **horizStyle / vertStyle state** — `horizStyle` and `vertStyle` added to App state; passed as props to HorizontalTimeline and VerticalTimeline respectively ✅
- **HorizontalTimeline style panel** — ⚙ Style button in toolbar; CSS-injection useEffect applies row height, label width, item radius, font size, opacity, axis font size, and grid visibility to vis-timeline via `<style id="horiz-style-inject">`; style panel with ROWS / ITEMS / AXIS sections; StyleTemplateBar below ✅
- **VerticalTimeline style panel** — ⚙ Style button in toolbar; style panel with CARDS / TEXT / ELEMENTS sections; `vs` values applied to card maxWidth, spine width, date size, title size, description size, avatar size, and card padding ✅

**Completed this session:**
- **Thread Timeline view** — new `🧵 Thread` view mode (6th view); custom SVG + HTML overlay renderer; horizontal time axis with smart tick intervals; events float above/below axis as cards connected by vertical thread lines; dot markers on axis; era background bands; greedy row-stacking layout avoids card overlaps; 4 placement rules (all above, all below, alternating, persons above); style panel with 4 sections (Cards, Threads, Layout, Theme); dark/light theme; pan by mouse drag, Ctrl+scroll zoom; Fit All; `🧵 Thread` button added to Horizontal and Vertical toolbars; `Thread Timeline` entry added to View menu; `viewThread` case wired in menu action handler; `THREAD_DEFAULTS` and `ThreadTimeline` component inserted before `FLOW_DEFAULTS`; `StyleTemplateBar` integrated; backup at `/tmp/timeline_index.html` ✅

**Completed this session (REED — Tier 1 Item 1):**
- **SQLite database** — `timeline.db` created on server startup; 9 tables: `timelines`, `people`, `events`, `person_events`, `relationships`, `canvas_images`, `civilizations`, `gen_people`, `gen_rels`; WAL mode + foreign key cascade deletes ✅
- **FastAPI CRUD endpoints** — `GET/POST /api/timelines`, `GET/PUT/DELETE /api/timelines/{id}`, `POST /api/upload/image`, `GET /images/{path}` static serving ✅
- **File-system image storage** — images saved to `./images/people/`, `./images/events/`, `./images/canvas/`; referenced by path in DB; served as static assets at `/images/…`; base64 data URLs no longer needed when server is running ✅
- **API-aware frontend** — `saveToStorage`, `deleteFromStorage`, `OpenTimelineModal`, `Avatar`, `EventPanel` image upload, `CanvasView` image upload all prefer API when server is connected ✅
- **Server detection** — `detectServer()` runs on page load; tries `GET /api/timelines` with 2s timeout; sets `_serverMode` flag; connection status dot shown in Toolbar (green = server, grey = local, amber = detecting) ✅
- **localStorage fallback** — all API paths fall back to localStorage when server is not reachable; app fully works as a plain HTML file without the server ✅
- **Migration modal** — on first connection to server, if localStorage has timelines, offers one-click migration to DB; shows per-timeline results; option to clear localStorage after migration ✅
- **`requirements.txt`** — added `python-multipart>=0.0.9` (needed for FastAPI file upload) ✅

**Completed this session (REED — Tier 1 Item 2):**
- **Visual export — PNG + PDF** — `html2canvas` 1.4.1 and `jsPDF` 2.5.1 loaded via CDN; `doExportPNG()` and `doExportPDF()` helper functions added; `ExportModal` component with format selector (PNG/PDF), PDF orientation (Landscape/Portrait), paper size (A4/A3/Letter/Legal/A2), render scale (1×/2×/3×), filename field, spinner, and error display ✅
- **File menu** — "Export to PNG…" and "Export to PDF…" added below Export JSON in File menu; wire to `exportPng` and `exportPdf` actions in `handleMenuAction`; modal pre-selects the triggered format ✅
- **Canvas toolbar** — ⬇ PNG and ⬇ PDF quick-export buttons added next to 🖨 Print in the Canvas view toolbar; export the artboard at 2× scale with a single click ✅
- **View IDs added** — `id="tl-view-horizontal"`, `id="tl-view-vertical"`, `id="tl-view-flow"`, `id="tl-view-thread"` added to root divs; `getExportTarget(orientation)` resolves the correct DOM element per view ✅
- **Help updated** — "PNG and PDF export" section added to Import & Export in both English (`HELP_SECTIONS`) and Afrikaans (`HELP_SECTIONS_AF`) ✅

**Completed this session (REED — Tier 1 Item 3):**
- **Source/citation system on events** — each event can hold zero or more structured sources; stored as a JSON array (`sources: []`) on the event object in both localStorage and SQLite (`sources TEXT DEFAULT '[]'` column) ✅
- **SourcesEditor component** — inline expandable form inside Add/Edit Event modals; fields: Title (required), URL, Author, Year, Type (Book/Article/Website/Document/Archive/Interview/Other), Confidence (Primary source/Secondary source/Unverified); each source listed with type + confidence colour badges; ✏ inline edit and ✕ delete per row ✅
- **AddEventModal** — Sources section added at the bottom (below people chips, above action buttons); new `sources` state initialised to `[]` ✅
- **EditEventModal** — Sources section added at the bottom; pre-populated from `event.sources`; `_scrollToSources` flag auto-scrolls the section into view when triggered from DataGrid ✅
- **EventPanel (detail slide-in)** — read-only Sources section between Description and People; each source shows title (linked if URL present), author/year in muted text, type badge, confidence badge; "No sources cited." placeholder when empty ✅
- **DataGrid Sources column** — added to `EVENT_COLS` as `type:'sources'`; renders count badge ("2 sources") or "—"; clicking opens EditEvent modal pre-scrolled to Sources; ✓/? indicator shown next to count (green ✓ = all primary, red ? = any unverified) ✅
- **Confidence indicator on vis-timeline bars** — `srcIndicator()` helper; all-primary → green `✓` superscript; any-unverified → red `?` superscript; tooltip also shows source count ✅
- **SQLite migration** — `migrate_db()` function runs `ALTER TABLE events ADD COLUMN sources TEXT DEFAULT '[]'` wrapped in try/except (idempotent); called after `init_db()` on server startup ✅
- **server.py round-trip** — `sources` column included in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write) ✅
- **Help updated** — new "Sources & Citations" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans) covering: adding sources, fields, viewing in EventPanel, DataGrid badge, confidence indicator ✅

**Completed this session (REED — Tier 1 Item 4):**
- **Tags on people and events** — `tags: []` array added to both person and event data models; stored as JSON in SQLite (`tags TEXT DEFAULT '[]'` columns on both `events` and `people`); defaults added to SAMPLE_PEOPLE, SAMPLE_EVENTS, DataGrid addPerson/addEvent, csvRowToPerson, csvRowToEvent ✅
- **TagInput component** — reusable inline chip input; type a tag and press Enter or comma to add; existing tags shown as coloured chips with ✕ to remove; auto-suggest dropdown filters tags already in the timeline; Backspace removes last tag; deterministic colour from tag text (hash → 12-colour TAG_PALETTE) so same tag is always the same colour ✅
- **Tags in Add/Edit Person modal** — Tags field added at the bottom of both modals; allTags prop passed from App ✅
- **Tags in Add/Edit Event modal** — Tags section added below Sources in both modals; allTags and fieldDefs props from App ✅
- **Tags in EventPanel** — coloured chips shown below Description when event has tags ✅
- **Tag filtering in FilterPanel** — new Tags section lists all unique tags (people + events combined); toggle per tag hides/shows all events carrying that tag; All on/All off buttons; count badge shows events and people using each tag; `hiddenTags` Set in App state; tag filter applied in `filteredEvents` (AND with existing filters); filtersBadge includes hiddenTags count ✅
- **Custom fields on events** — `customFields: []` array on each event; `{ key, value }` pair structure; `customFieldDefs: []` on timeline (templates with `{ name, type }`); stored as `custom_fields TEXT DEFAULT '[]'` in SQLite events table; `customFieldDefs` stored as `custom_field_defs TEXT DEFAULT '[]'` in SQLite timelines table ✅
- **CustomFieldsEditor component** — defined fields shown as labelled inputs (text/number/boolean/url type-aware); freeform rows with key+value inputs; ✕ to remove; "+ Add field" button; "Manage fields…" link to open FieldDefsModal ✅
- **FieldDefsModal** — small inline modal to define/delete named field templates (name + type); saves to App's `customFieldDefs` state; changes persist to save/export ✅
- **Custom fields in Add/Edit Event modals** — CustomFieldsEditor section added below Tags; connected to onManageDefs → FieldDefsModal ✅
- **Custom fields in EventPanel** — key: value list shown below Tags when any filled field exists; URL values render as clickable links ✅
- **SQLite migrations** (idempotent, try/except): `events.tags`, `events.custom_fields`, `people.tags`, `timelines.custom_field_defs` all added to `migrate_db()` ✅
- **server.py round-trip** — all four new columns included in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write) ✅
- **Save/load/export** — `customFieldDefs` added to `saveToStorage`, `saveToStorageLS`, `exportJSON`, `loadTimeline`, `handleLoad`; OpenTimelineModal passes `customFieldDefs` through both API and LS paths and JSON file import ✅
- **Help updated** — new "Tags" section and new "Custom Fields" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans) ✅

**Completed this session (REED — Tier 1 Item 5):**
- **Dynamic category management** — categories moved from hardcoded `CATEGORY_COLORS`/`ALL_CATEGORIES` constants to React state (`categories` state, initialised from `DEFAULT_CATEGORIES` array of `{ id, name, color, icon }` objects) ✅
- **`CatCtx` React context** — `CatCtx = React.createContext(...)` + `useCat()` hook returning `{ categories, catColor, catNames }`; `catCtxValue` computed via `useMemo` in App; entire component tree wrapped in `<CatCtx.Provider>`; no prop drilling ✅
- **`DEFAULT_CATEGORIES`** — 7 built-in categories (Religion, Politics, Science, Aviation, Historical, Award, Personal); `UNCATEGORISED` permanent fallback `{ id:'cat-uncategorised', ... }`; module-level `CATEGORY_COLORS` and `ALL_CATEGORIES` kept as derived constants for backwards compatibility ✅
- **`CategoryManagerModal`** — full CRUD modal: inline editable name field, colour swatch picker (12 palette + native input), optional emoji icon, ▲▼ reorder, 🗑 delete with confirmation when events reference the category, "Restore Defaults" button with confirmation; `Uncategorised` row permanent and undeletable ✅
- **Entry points** — Tools menu → "Manage Categories…"; "✏ Manage" button beside Category label in Add/Edit Event modals; "✏" button in FilterPanel categories header; "✏ Manage" button in PeopleFilterModal categories column header ✅
- **All category references updated** — `HorizontalTimeline`, `VerticalTimeline`, `CanvasView`, `ThreadTimeline`, `FlowView`, `Sidebar`, `FilterPanel`, `PeopleFilterModal`, `ImportCSVModal`, `DataView` all use `useCat()` context; `DataView.eventCols` computed via `useMemo` to override category options dynamically ✅
- **Safety net on delete** — `handleSaveCategories` in App maps through all events and resets any event whose `category` is no longer in the new set to `UNCATEGORISED.name` before calling `setCategories` ✅
- **Persist categories** — `saveToStorageLS`, `saveToStorage`, `exportJSON` all include `categories` in their payload; `OpenTimelineModal` passes `categories` through both API and localStorage paths and JSON file import; `loadTimeline` accepts and applies `newCategories`; `setSelectedCategories` synced on load ✅
- **SQLite migration** — `migrate_db()` adds `categories TEXT DEFAULT '[]'` column to `timelines` table (idempotent try/except) ✅
- **server.py round-trip** — `categories` included in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write, both UPDATE and INSERT) ✅
- **Help updated** — new "Categories" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans) covering: what categories are, opening Category Manager, create/rename/reorder/delete/restore, persistence ✅

**Completed this session (REED — Tier 2 Item 6):**
- **PowerPoint (.pptx) export** — `PptxGenJS 3.12.0` added via CDN; `doExportPptx()` function; `PptxExportModal` component ✅
  - **Timeline Slide mode** — single slide; html2canvas capture of current view as full-slide image; title bar overlay with timeline name; date footer
  - **Story Slides mode** — title slide (name, event count, date range) + one slide per event (chronological); per-slide: category colour accent bar, date, title, description, tags, associated people, first event image (right half), sources as footnotes (up to 3)
  - **Options**: slide theme (Match timeline / Dark / Light), include event images toggle, include sources toggle, filename field
  - **Graceful fallbacks**: PptxGenJS not loaded → clear error message in modal; 0 events → warning before export; image fetch failures → silently skipped; server image URLs fetched and base64-encoded for embedding
  - **File menu**: `File → Export to PowerPoint…` added alongside PNG and PDF entries
  - **Help updated**: both `HELP_SECTIONS` (EN) and `HELP_SECTIONS_AF` (AF) import/export sections updated with PowerPoint export documentation

**Completed this session (REED — Tier 2 Item 7):**
- **GEDCOM import** — `parseGEDCOM(text)` function (~180 lines, no external library); parses INDI (individual) and FAM (family) records; extracts name, birth date, death date, occupation, notes per person; creates spouse relationships, parent→child relationships, and marriage events from FAM records; handles GEDCOM date formats: `12 JUN 1842`, `ABT 1800`, `BEF 1900`, `AFT 1750`, `BET 1800 AND 1850`, plain years; full ISO dates stored when day+month available, integer years otherwise; deterministic colour assignment; try/catch wrapping — malformed files show error in modal, never crash ✅
- **GEDCOM export** — `exportGEDCOM(timelineName, people, events, relationships)` function; writes valid GEDCOM 5.5.1; HEAD with source, GEDC version, UTF-8 charset; one INDI per person (NAME given /SURNAME/ heuristic, BIRT, DEAT, OCCU, NOTE); one FAM per spouse relationship (HUSB, WIFE, MARR date if matching marriage event exists, CHIL for shared children); solo-parent FAM records for unmatched parent→child relationships; TRLR at end; downloads as `.ged` file ✅
- **`GedcomImportModal`** — drag-and-drop or file picker for `.ged` files; parses on drop/pick; shows 3-tile preview (people count, relationships count, marriage events count) + first 5 person names; Merge / Replace mode selector; Import button disabled until file loaded; error banner on parse failure; "← Choose different file" to reset ✅
- **File menu** — "Import GEDCOM (.ged)…" and "Export GEDCOM (.ged)…" added to File menu below Import/Export CSV; actions: `importGedcom` opens modal, `exportGedcom` calls `exportGEDCOM` directly ✅
- **`handleGedcomImport` callback in App** — Merge mode: adds new people (deduped by id), merges relationships (deduped by fromId+toId+type key), adds new events; Replace mode: clears people, events, relationships and loads from GEDCOM data; `setSelectedPeople` synced in both modes ✅
- **Help updated** — new GEDCOM section added to `import-export` in both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans); covers import flow, export flow, what data is transferred, date handling, and tip to open Flow view after import ✅
- **AF translations** — `'Import GEDCOM (.ged)…'` and `'Export GEDCOM (.ged)…'` added to `AF` dictionary ✅

**Completed this session (REED — Tier 2 Item 8):**
- **Recurring / repeating events** — full end-to-end implementation: `recurrence` field on event objects; `expandRecurringEvents(events)` pure expansion function (500-occurrence cap); handles integer-year + ISO-string dates; sub-year frequency approximation for ancient dates with warning ✅
- **`RecurrenceEditor` component** — inline widget in Add/Edit Event modals; frequency (daily/weekly/monthly/yearly) + interval; day-of-week checkboxes (weekly); end condition (Never/After N/On date); integer-year warning; plain-English preview ✅
- **Edit occurrence scope** — in EditEventModal: "Edit this occurrence only" (detaches as standalone event) vs "Edit all occurrences" (modifies master); occurrence-choice banner auto-detects `_occ_` ID pattern ✅
- **`displayEvents` pipeline** — `useMemo(() => expandRecurringEvents(filteredEvents))` in App; all views (Horizontal, Vertical, Canvas, Flow, Thread) receive `displayEvents`; DataView keeps master `events` state; `liveEvent` resolves occurrences from displayEvents ✅
- **↻ visual badge** — added to HorizontalTimeline (ds.add items), CanvasView items, VerticalTimeline cards, ThreadTimeline cards, and EventPanel header + info block ✅
- **Delete confirmation** — recurring master event delete in DataView shows confirm dialog with occurrence count ✅
- **`eventToICS(event)` helper** — pure iCal VEVENT generator with RRULE (FREQ, INTERVAL, BYDAY, COUNT/UNTIL); 📅 button in EventPanel copies to clipboard ✅
- **SQLite migration** — idempotent `ALTER TABLE events ADD COLUMN recurrence TEXT DEFAULT NULL`; full read/write round-trip in `_build_timeline_payload` and `_save_timeline_from_payload` ✅
- **Help updated** — new "Recurring Events" section added to `HELP_SECTIONS` (English) and "Herhalende Gebeure" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER2_ITEM8.md` written ✅

**Completed this session (REED — Tier 2 Item 9):**
- **Event dependencies** — `dependencies` global state `[{ id, fromEventId, toEventId, type }]`; types: `fs` (Finish→Start), `ss` (Start→Start), `ff` (Finish→Finish); persisted in save/export JSON and restored on load; `SAMPLE_DEPENDENCIES = []` constant; `DEP_TYPES` config array ✅
- **Circular dependency detection** — `hasCycle(startId, targetId, allDeps)` DFS traversal prevents circular dependency chains; error message shown inline in the dependency editor ✅
- **Critical path** — `calcCriticalPath(events, dependencies)` Kahn's topological sort + forward/backward pass (Early Start/Late Start); returns `Set` of event IDs on the critical path (float = 0) ✅
- **Progress field** — `progress: 0–100` integer on events; range slider in EditEventModal; gradient progress bar shown in EventPanel header ✅
- **Status field** — `status: planned|active|done|cancelled|at-risk` on events; colour-coded badge in EventPanel; selector in EditEventModal; filter in FilterPanel (Status section with toggle switches) ✅
- **Dependency editor in EditEventModal** — "Depends on" list with type badge and ✕ remove; "Blocks" read-only list showing what this event blocks; "+ Add dependency" picker (from event + type); circular check on add; error display ✅
- **GanttView component** — new `📊 Gantt` view (7th view); left label panel (200px) with event names grouped by person; custom SVG renderer; horizontal bars by category colour with progress fill overlay; milestone diamonds (point events); dependency arrows (cubic bezier curves, separate markers for normal/critical); critical path highlighted in amber/orange; dark/light theming; smart axis tick intervals; mouse drag pan; Ctrl+scroll zoom; Fit All / Zoom In / Zoom Out controls; `📊 Gantt` button in Horizontal toolbar and View menu ✅
- **`EVENT_STATUSES` + `STATUS_CONFIG`** — centralised status metadata: label, foreground colour, background colour for all 5 statuses ✅
- **SQLite `dependencies` table** — `CREATE TABLE IF NOT EXISTS dependencies (id, timeline_id, from_event_id, to_event_id, type)` added to `init_db()` ✅
- **SQLite `progress` + `status` columns** — idempotent `ALTER TABLE events ADD COLUMN progress INTEGER DEFAULT 0` and `ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'planned'` added to `migrate_db()` ✅
- **server.py round-trip** — `dependencies` query + insert in `_build_timeline_payload` / `_save_timeline_from_payload`; `progress` + `status` included in events read/write ✅
- **Help updated** — new "Gantt View & Dependencies" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans); Views section updated to mention Gantt ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER2_ITEM9.md` written ✅

**Completed this session (REED — Tier 2 Item 10 — Tier 2 complete):**
- **Slide / Narrative view** — new `📽 Slides` view mode (8th view); full-screen slideshow renderer, one event per slide ✅
  - **Title slide** — timeline name as large headline; event count + year range subtitle; uses timeline's bgSettings as background
  - **Event slides** — two-zone layout: media zone (left 50%: first image full-bleed, or category icon placeholder on coloured bg; person avatar stack bottom-left) + content zone (right: category chip, date, title 36px, scrollable description, tag chips, people chips, source footnotes)
  - **Navigation** — left/right arrow buttons (large, semi-transparent, hover effect); keyboard ← → Space=next Escape=exit; swipe support (touchstart/touchend, 50px threshold)
  - **Filmstrip** — collapsible thumbnail strip at bottom; title thumbnail + one thumbnail per event (image or category icon); active slide highlighted with indigo border; click any thumbnail to jump
  - **Slide counter** — "N / Total" shown below slide area
  - **Style panel** — ⚙ Style button in controls bar; Theme (Dark/Light/Parchment), Font (Sans/Serif/Mono), Show toggles (Avatars/Tags/Sources/Strip), Transition (Fade 180ms / None)
  - **Controls bar** — timeline name left; ⚙ Style + ✕ Exit right
  - **Ordering + filtering** — chronological by date_start; respects all current filter state (hiddenEvents, hiddenPeople, hiddenCategories, hiddenTags)
  - **Entry points** — View menu → "📽 Slides" (shortcut ⌘⇧L); 📽 Slides button in Horizontal toolbar; 📽 Slides button in Vertical toolbar
  - **`SLIDE_DEFAULTS` + `SLIDE_CAT_ICONS`** constants; `SlideView` component inserted before `// ─── App Root`
  - **`viewSlides` action** wired in `handleMenuAction` → `setOrientation('slides')`
  - **Keyboard handlers** added on mount, removed on unmount (no memory leaks)
  - **Touch handlers** same — add/remove on mount/unmount
- **Help updated** — "Slide / Narrative View" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans — "Skyfie / Verhalende Aansig") ✅
- **AF translations** — `'📽 Slides':'📽 Skyfies'` added to `AF` dictionary ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER2_ITEM10.md` written ✅

**Tier 2 is now complete.** All 10 items delivered.

**Completed this session (REED — Tier 3 Item 11):**
- **Location field on events** — `location: { name, lat, lon }` object added to event data model; safe default `{ name:'', lat:null, lon:null }` on all new and existing events ✅
- **Location UI in AddEventModal** — 📍 Location section with place name text input, 🔍 geocode button (Nominatim/OpenStreetMap, no API key), Lat/Lon number inputs side-by-side; on geocode success fills coords; on failure shows "Coordinates not found — enter manually."; helper note; state was already defined (locName/locLat/locLon/geoStatus) — UI section was missing and has now been added ✅
- **Location UI in EditEventModal** — same 📍 Location section added; pre-fills from `event.location`; geocode function; included in `handleSave` ✅
- **EventPanel location display** — `📍 Location name` shown below Description; if lat/lon present the name is a link opening OpenStreetMap in a new tab ✅
- **DataGrid Location column** — `location_name` column already present in EVENT_COLS; `updateEvent` already handles the `location_name` key mapping to `e.location.name`; DataGrid row rendering maps `e.location?.name` ✅
- **SQLite migration** — `location_name TEXT DEFAULT ''`, `location_lat REAL DEFAULT NULL`, `location_lon REAL DEFAULT NULL` columns in `migrate_db()` (idempotent, already present in server.py from stub) ✅
- **server.py round-trip** — location read in `_build_timeline_payload` (constructs `location: { name, lat, lon }`) and written in `_save_timeline_from_payload` (extracts `loc_name/lat/lon`, inserts as columns) ✅
- **Sample data** — all 22 sample events updated with real `location: { name, lat, lon }` coordinates ✅
- **MapView component** — new `🗺 Map` view (9th view); full-size Leaflet.js map (CDN already loaded); OpenStreetMap tiles; circle marker per event with lat/lon (colour = category colour); hover tooltip = title + date; click → open EventPanel; Fit All button; event count in toolbar; empty-state overlay when no events have coordinates; proper `useEffect` init + cleanup (map.remove() on unmount, no "already initialised" errors); `map.invalidateSize()` on mount; respects current filter state ✅
- **View menu** — `🗺 Map` entry added to View menu; `viewMap` case wired in `handleMenuAction` ✅
- **Toolbar buttons** — `🗺 Map` button added to HorizontalTimeline toolbar and VerticalTimeline toolbar ✅
- **Leaflet CDN** — already present in `<head>` (`leaflet@1.9.4` CSS + JS) from a prior session ✅
- **Help updated** — Map view bullet added to Views section in HELP_SECTIONS; new "Location Field & Map View" section added to `HELP_SECTIONS` (English) and "Liggingsveld & Kaart-aansig" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER3_ITEM11.md` written ✅

**Completed this session (REED — Tier 3 Item 12):**
- **Uncertainty / confidence flags on dates** — full end-to-end implementation across data model, UI, display, all views, SQLite, and GEDCOM ✅
- **Data model** — `dateStartCertainty` / `dateEndCertainty` on events; `birthCertainty` / `deathCertainty` on people; values: `'exact' | 'circa' | 'estimated' | 'unknown'`; default `'exact'` for all existing data; safe fallback everywhere ✅
- **`DateCertaintyPicker` component** — 4-pill selector (Exact | c. | est. | ?) placed below each date field in Add/Edit Person and Add/Edit Event modals; amber highlight on active pill; tooltips explaining each level ✅
- **`fmtDate(d, fmt, certainty)` enhanced** — optional third parameter; `'unknown'` → `'Unknown'`; `'circa'` → `'c. date'`; `'estimated'` → `'est. date'`; `'range-approx'` → `'~date'`; `'exact'` (default) → unchanged; all existing 2-argument call sites continue to work with zero visual regression ✅
- **Horizontal timeline** — uncertain events get `border-style:dashed` on vis-timeline bars; `?` superscript badge for unknown dates; certainty level shown in hover tooltip ✅
- **Vertical timeline** — `~` amber badge before date label on uncertain events ✅
- **Thread view** — card border switches to `dashed` when event has non-exact date certainty; `~` prefix on date within card ✅
- **Flow view** — person ribbon gets dashed amber `strokeDasharray` outline when birth certainty is non-exact; birth/death label dates include certainty prefix via `fmtDate` ✅
- **EventPanel** — date display uses certainty-aware `fmtDate`; amber `~` indicator shown when date is non-exact ✅
- **PeopleFilterModal** — person birth/death dates rendered with certainty prefix in both the filter list and the people & categories panel ✅
- **SQLite migration** — 4 idempotent `ALTER TABLE` calls in `migrate_db()`: `events.date_start_certainty`, `events.date_end_certainty`, `people.birth_certainty`, `people.death_certainty` (all `TEXT DEFAULT 'exact'`) ✅
- **server.py round-trip** — all 4 certainty fields included in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write) ✅
- **GEDCOM import** — `gedDateCertaintyOf()` helper maps GEDCOM qualifiers: `ABT/CAL/CIRCA` → `'circa'`; `BEF/AFT/BET/EST` → `'estimated'`; plain dates → `'exact'`; applied to `birthCertainty`/`deathCertainty` when importing INDI records ✅
- **Help updated** — new "Date Uncertainty" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans — "Datumonsekerheid") covering: certainty levels, setting certainty in modals, visual indicators per view, GEDCOM mapping, safe defaults ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER3_ITEM12.md` written ✅

**Completed this session (REED — Tier 3 Item 13):**
- **Nested / hierarchical events** — full end-to-end implementation across data model, UI, all views, SQLite, and FilterPanel ✅
- **Data model** — `parentEventId: null` field added to every event object; non-null = child of referenced event; safe default on all new and existing events; `SAMPLE_EVENTS` all initialised with `parentEventId: null` ✅
- **Tree utility functions** — `buildEventTree(events)`, `getDescendantIds(eventId, events)` (DFS, returns Set), `getEventDepth(eventId, events)` (recursive depth count), `hasAncestorCycle(eventId, proposedParentId, events)` (prevents circular chains and self-assignment) ✅
- **Parent selector in AddEventModal** — searchable "Part of (parent event)" dropdown showing eligible events (excludes self and descendants); preview line shows selected parent title + date; clear (✕) button; `initialParentId` prop pre-selects a parent when launched from EventPanel "Add sub-event" button ✅
- **Parent selector in EditEventModal** — same UI; `selfDescendants` useMemo excludes self and all descendants from the dropdown; `hasAncestorCycle` guard in `handleSave` shows inline error if cycle detected; `parentEvtObj` naming used to avoid collision with `event` prop ✅
- **Vertical timeline collapse/expand** — `collapsed` Set local state in VerticalTimeline; `▶ N sub-event(s)` / `▼ N sub-event(s)` toggle button per parent card; `childCountMap` useMemo; `collapsedDescendants` useMemo skips all hidden items; 32px indentation per depth level; `↳` prefix on child event titles; child count badge ✅
- **EventPanel "Part of" bar** — blue `↑ PART OF` banner shown when `event.parentEventId != null`; clicking the parent title navigates to the parent event via `onSelectEvent?.(parent)` ✅
- **EventPanel "Sub-events" section** — lists direct children (`allEvents.filter(e => e.parentEventId === event.id)`); each child shown as a clickable row; `＋ Add sub-event` button launches AddEventModal pre-filled with `initialParentId` ✅
- **FilterPanel cascade-hide** — `toggleE` updated: hiding a parent also hides all its descendants (via `getDescendantIds`); showing a parent does NOT auto-show descendants (manual re-show required) ✅
- **DataGrid Parent column** — read-only `{ key:'parentEventId', label:'Parent', type:'parent', width:140 }` column in Events table; renders "↳ Parent Title" or "—"; reads `extraCellProps.allEvents` ✅
- **`showAddEvent` dual-type state** — `showAddEvent` accepts `true` (top-level) or `{ initialParentId }` (from sub-event button); guard `showAddEvent && <AddEventModal>` continues to work correctly ✅
- **App wiring** — `onSelectEvent`, `onAddSubEvent`, `allEvents` props added to EventPanel call; `allEvents` and `initialParentId` props added to AddEventModal call ✅
- **SQLite migration** — idempotent `ALTER TABLE events ADD COLUMN parent_event_id TEXT DEFAULT NULL` in `migrate_db()` ✅
- **server.py round-trip** — `parent_event_id` included in `_build_timeline_payload` (read) and `_save_timeline_from_payload` (write, INSERT param count updated from 22 to 23) ✅
- **Help updated** — new "Sub-events & Hierarchy" section added to `HELP_SECTIONS` (English) and "Sub-gebeure & Hiërargie" to `HELP_SECTIONS_AF` (Afrikaans) covering: creating sub-events, parent selector, collapse/expand, EventPanel navigation, FilterPanel cascade, DataGrid Parent column ✅

**Completed this session (REED — Tier 3 Item 14):**
- **Drag-to-reschedule events in the Horizontal timeline** — full vis-timeline `editable: { updateTime:true, updateGroup:false }` implementation ✅
- **`onMove` callback** — converts vis Date objects back to app-native format (integer year for BC/AD events, ISO string for full-date events) via `dateFromVisItem()`; rejects all special items (`__life__`, `__civ__`, background bands) ✅
- **Snap function** — year-boundary snap at coarse zoom (scale=year or step≥365 days); day-boundary snap when zoomed in ✅
- **`onRescheduleEvent` prop + `handleRescheduleEvent` in App** — updates event `date_start` / `date_end` in React state; handles `detach-occurrence` special case for recurring events ✅
- **Undo stack** — max 20 entries; Ctrl+Z (or Cmd+Z) pops and restores previous dates; "Undo: date restored" toast ✅
- **Confirmation toast** — green "Moved to [year]" flash in toolbar for 2 seconds after each drag ✅
- **🔒/🔓 Lock button** — in Horizontal toolbar; amber border when locked; tooltip; live `setOptions` update on the vis-timeline instance; `dragLockedRef` used in `onMove` closure ✅
- **Recurring events** — `window.confirm` dialog on occurrence drag: "This occurrence only" → detach as standalone event; "All occurrences" → shift master by delta, recalculate via existing `expandRecurringEvents`; recurring master events set `editable: false` (not directly draggable) ✅
- **Dependency conflict warning** — red "⚠ Dependency conflict: …" toast (5 s) when a finish-to-start dependency is violated after a drag; advisory only, move still completes ✅
- **`dragHelpersRef` pattern** — helper functions stored in a single ref object so they remain callable from the one-time vis init `useEffect` closure without stale captures ✅
- **`dependencies` prop** passed to `HorizontalTimeline` from App; `dependenciesRef` kept current ✅
- **Help updated** — new "Drag-to-reschedule" sub-section added to the "Zoom & Navigation" section in both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans) ✅

**Completed this session (REED — Tier 3 Item 15):**
- **Bulk edit operations** — select multiple events across views and apply the same change to all at once ✅
- **`selectedEventIds` Set state** — `useState(() => new Set())` in App; always updated immutably (new Set); cleared on timeline load/new; Escape key listener clears selection globally ✅
- **`BulkEditBar` component** — fixed bottom bar (zIndex 600) that appears when 1+ events are selected; count badge; 8 action buttons, each opening a small inline popover anchored to its button ✅
  - **Category** — dropdown of all categories, confirmation dialog before apply
  - **+ Person** — person picker, adds link without removing existing ones
  - **− Person** — person picker, removes link from all selected
  - **+ Tags** — TagInput widget (Enter/comma to add), union merge
  - **− Tags** — click-to-toggle chips from union of selected event tags
  - **Status** — pill selector (planned / active / done / cancelled / at-risk)
  - **Shift Dates** — N units forward/backward; supports days/months/years; integer-year events show yellow warning when day/month selected (rounds to year boundary); live preview text
  - **🗑 Delete** — confirmation required, removes events and clears selection
- **`handleBulkAction` callback** in App — pure immutable event-map updates; delete uses filter; all operations respect the `selectedEventIds` Set identity check (raw id + String id) ✅
- **Vertical timeline checkboxes** — `.vert-sel-cb` div positioned left of each card; opacity:0 by default, CSS parent-hover reveals it; `.vert-sel-cb--checked` class forces opacity:1; selected cards highlighted in dark-blue (`#1e1b4b`) ✅
- **DataGrid checkbox column** — added when `selectedEventIds` + `onSelectionChange` props are present (events tab only, not people tab); header "select all" checkbox (indeterminate state for partial selection); highlighted row background ✅
- **HorizontalTimeline multiselect** — `multiselect:true` added to vis-timeline options; `select` event handler now populates `selectedEventIds` when Ctrl+click produces >1 selected items; single-click continues to open EventPanel as before ✅
- **Help updated** — new "Bulk Editing" section added to both `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans — "Grootmaat Redigering") ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER3_ITEM15.md` written ✅

**Completed this session (REED — Tier 3 Item 16 — Tier 3 complete):**
- **Report view** — new `📋 Report` view (10th view); read-optimised, paginated, print-ready chronological table ✅
- **`ReportView` component** — inserted before `const App`; receives `events` (filtered), `people`, `timelineName`, `setOrientation` props; uses `useFmt()` and `useCat()` contexts ✅
- **9 columns** — Date, Title, People, Category, Location, Description, Sources, Tags, Status; all individually togglable via pill buttons in toolbar ✅
- **Column rendering** — Date: start + optional end date on second line; Title: sub-event `↳` prefix; People: avatar-style initials chips with person colour; Category: coloured badge; Location: 📍 prefix; Description: 2-line truncation with "Show more/less" toggle (full text in print); Sources: count badge expands to inline list on click; Tags: coloured chips; Status: STATUS_CONFIG colour-coded badge ✅
- **Toolbar** — view-switcher buttons (Horiz/Vert/Data); "📋 Report" label + timeline name; column toggle pills; Sort selector (Date ↑ / Date ↓ / Title A–Z); Group by selector (None / Category / Person / Year / Decade / Century); local search box; event count; ⬇ CSV + 🖨 Print buttons ✅
- **Grouping** — full-width coloured header rows between groups showing group name + event count; click to collapse/expand each group (`collapsedGroups` Set state); group header colour derived from category colour or indigo fallback ✅
- **CSV export** — `handleCsvExport` uses existing `buildCSV` + `downloadText` helpers; exports only visible columns; filename = `{timelineName}-report-{date}.csv` ✅
- **Print** — `handlePrint` sets `data-printing='1'` attribute on root div, calls `window.print()`, clears attribute after 1 s; `@media print` CSS hides toolbar; shows only `#report-view-root[data-printing]`; full-width table, no truncation; `data-title` attr used for page header via `::before` content; `@page { margin: 15mm }` ✅
- **Empty state** — "No events match the current filters." centred message ✅
- **Respects filters** — receives `filteredEvents` from App (same set as all other views) ✅
- **Entry points** — `📋 Report` button in HorizontalTimeline toolbar; `📋 Report` button in VerticalTimeline toolbar; `View → 📋 Report` in MenuBar; `viewReport` action wired in `handleMenuAction` ✅
- **Help updated** — "Report View" section added to `HELP_SECTIONS` (English) and "Verslag-aansig" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **AF translations** — `'📋 Report':'📋 Verslag'` added to `AF` dictionary ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER3_ITEM16.md` written ✅

**Tier 3 is now complete.** All 16 items delivered.

**Completed this session (REED — Tier 4 Item 17):**
- **Role-based permissions + share links** — full end-to-end sharing system ✅
- **`share_links` SQLite table** — `migrate_db()` creates it idempotently; columns: `token`, `timeline_id`, `role`, `created_at`, `expires_at`, `password_hash` ✅
- **4 server endpoints** — `POST /api/timelines/{id}/share` (create), `DELETE /api/share/{token}` (revoke), `GET /api/share/{token}` (resolve + role), `GET /api/timelines/{id}/shares` (list) ✅
- **Share token generation** — `secrets.token_urlsafe(24)`; optional expiry via `timedelta`; optional password via `hashlib.sha256` ✅
- **`ShareModal` component** — File → 🔗 Share…; server-mode gate (shows message in localStorage mode); lists existing links with role badge, expiry, copy and revoke buttons; create-new form: role selector (Viewer/Commenter/Editor), expiry picker, optional password; "Generate Link" → POST → shows full URL with Copy + "Copied!" flash ✅
- **`SharePasswordModal` component** — shown automatically when `?share=` token resolves with HTTP 401; Enter submits, Escape cancels; re-prompts on wrong password ✅
- **Share API helpers** — `apiCreateShareLink`, `apiListShareLinks`, `apiRevokeShareLink`, `apiResolveShareLink` in frontend module-level code ✅
- **`?share=` URL detection** — `useEffect` on mount reads `?share=` param, calls `apiResolveShareLink`, loads timeline via `loadTimeline()`, sets `shareRole` in App state; cleans the query string from URL bar ✅
- **`shareRole` App state** — `null` = owner (full access); `'viewer'` / `'commenter'` / `'editor'` = shared access ✅
- **Viewer/Commenter role constraints** — `isReadOnly` flag in `MenuBar` and `Toolbar`; hides + Person, + Event buttons; disables File→New, File→Save, Edit menu items, Item menu items; Export still works ✅
- **Role banner** — coloured banner below menu bar showing role label and timeline name; "Read-only view. Edits are disabled." for viewer/commenter ✅
- **Editor role** — full access; banner shows "✏ Editor (shared)" as green reminder ✅
- **`🔗 Share` toolbar button** — shown only when `serverMode === true && !shareRole` (owner in server mode) ✅
- **File → 🔗 Share… menu item** — enabled in server mode; greyed with tooltip when in localStorage mode ✅
- **Help updated** — "Sharing" section added to `HELP_SECTIONS` (English) and "Deel" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER4_ITEM17.md` written ✅

**Completed this session (REED — Tier 4 Item 18):**
- **Version history snapshots** — `timeline_versions` SQLite table added in `migrate_db()` (idempotent); columns: `id`, `timeline_id`, `version_number`, `label`, `snapshot` (full JSON), `created_at`, `auto` ✅
- **Auto-snapshot on every PUT** — `save_timeline` endpoint calls `_create_version_snapshot()` after writing; silently catches errors so snapshot failure never breaks the save path ✅
- **50-snapshot auto-prune** — oldest auto-snapshots deleted when count exceeds 50; named snapshots (auto=0) are never auto-deleted ✅
- **`_create_version_snapshot()` helper** — inserts row, increments version number, prunes excess auto-snapshots ✅
- **6 new server endpoints** — `GET /versions` (list, no snapshot body), `GET /versions/{vid}` (full snapshot), `POST /versions` (named manual snapshot), `POST /versions/{vid}/restore` (creates pre-restore backup first, then overwrites), `PATCH /versions/{vid}` (set label), `DELETE /versions/{vid}` (named only) ✅
- **localStorage fallback** — `_lsPushVersionSnapshot()` pushes snapshot to `localStorage['tl_versions_{name}']`; keeps last 10; called from `saveToStorage()` when in localStorage mode; named snapshots not supported in LS mode ✅
- **`apiListVersions`, `apiGetVersion`, `apiCreateNamedVersion`, `apiRestoreVersion`, `apiLabelVersion`, `apiDeleteVersion`** — 6 frontend API helpers ✅
- **`VersionHistoryModal` component** — two-panel layout; left: scrollable version list (relative timestamps, Auto/Named badge, rename ✏ + delete 🗑 for named); right: preview (person count, event count, date range, first 10 event titles); "📌 Save named snapshot" inline input in server mode; "↩ Restore this version" with confirmation; "local mode" note when offline ✅
- **File → 🕐 Version History…** menu entry added below Save; shortcut hint Ctrl+Shift+H ✅
- **App state `showVersionHistory`** + case `'versionHistory'` in `handleMenuAction` ✅
- **Restore handler in App** — calls `handleLoad()` with restored payload; works in both server mode (reload from API after restore) and localStorage mode (load snapshot directly into state) ✅
- **Help updated** — "Version History" section added to `HELP_SECTIONS` (English) and "Weergawe Geskiedenis" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER4_ITEM18.md` written ✅

**Completed this session (REED — Tier 4 Item 19):**
- **`ConnectionManager` class** — `server.py`; manages WebSocket connections grouped by `timeline_id`; stores `[ws, user_id, user_name, role]` per slot; `connect()`, `disconnect()`, `get_users()`, `broadcast(exclude_ws)` methods; dead-connection pruning on failed send ✅
- **`/ws/{timeline_id}` WebSocket endpoint** — FastAPI built-in WebSocket support (no new deps); query params: `user_id`, `user_name`, `token`; validates share token role + expiry on connect; sends presence list to joiner; broadcasts `joined` to others; message loop handles `change`, `cursor`, `rename`, `ping`; on `change`: persists full timeline to SQLite + auto-snapshot, then broadcasts to others (last-write-wins); graceful `disconnect` with `left` broadcast ✅
- **`/api/collab/{timeline_id}/presence` REST endpoint** — returns current connected users; useful for polling fallback ✅
- **`useCollaboration(timelineId, serverMode, onRemoteChange, hasUnsavedRef)` hook** — opens `ws://{host}/ws/{timelineId}`; reconnects with exponential backoff (1 s → 2 s → 4 s … max 30 s); 30 s keepalive ping; throttled `sendChange` (min 2 s between broadcasts via flushRef pattern); `sendCursor`, `rename` helpers; stable `userId` from localStorage ✅
- **Unsaved-edit guard** — `hasUnsavedRef` tracks whether local state has been modified since last save; on incoming `change` message, if dirty: `window.confirm` "Discard / Keep editing" dialog before applying remote payload ✅
- **`_showCollabToast()` utility** — imperative DOM toast (no React) shown on remote-change reception; auto-fades after 4 s ✅
- **`PresenceBar` component** — status badge (● Live / ● Reconnecting… / ● Offline) + avatar circles (deterministic colour hash, initials); max 5 shown + "+N more"; hover tooltip shows name + role; click opens popover with full user list + "Your display name" editable input + Save button ✅
- **Toolbar integration** — `collab` prop passed from App; `PresenceBar` rendered inside Toolbar right-button group; only shown when `serverMode === true` ✅
- **App wiring** — `hasUnsavedRef` useRef in App; `useEffect` marks `hasUnsavedRef.current = true` on any state change to people/events/eras etc.; `collabTimelineId` derived from `_timelineIdMap`; `handleRemoteChange` useCallback calls `loadTimeline` with remote payload; `handleSave` calls `collab.sendChange(payload)` after successful save (server mode only) ✅
- **Help updated** — "Real-time Collaboration" section added to `HELP_SECTIONS` (English, id: `collaboration`) and "Intydse Samewerking" to `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER4_ITEM19.md` written ✅

**Completed this session (REED — Tier 4 Item 20):**
- **WCAG 2.1 AA accessibility pass** — systematic audit and remediation across all interactive elements, SVG views, modals, and live regions ✅
- **`saveMsg` live region** — wrapped "Saved ✓" / "Saving…" / "Save failed" toolbar span in `role="status"` + `aria-live="polite"` + `aria-atomic="true"` so screen readers announce save status automatically ✅
- **Server connection dot** — added `role="img"` + `aria-label` alongside existing `title` so screen readers can access the connection state ✅
- **`Btn` component spread props** — added `...rest` spread so `aria-label`, `title`, and other ARIA attributes can be passed through to the underlying `<button>` without wrapping ✅
- **Zoom +/− buttons** — added `aria-label="Zoom in"` / `aria-label="Zoom out"` + `title` to all zoom buttons across Horizontal, Vertical, Canvas, Gantt, and Lightbox views (previously silent for screen readers) ✅
- **Lock/unlock toggle** — added `aria-pressed={dragLocked}` + descriptive `aria-label` to the 🔒/🔓 drag-lock button in the Horizontal toolbar ✅
- **Drag-reschedule feedback** — replaced conditional `{dragMoveMsg && <span>}` with a permanent `role="status"` live region so move confirmations and dependency warnings are announced automatically ✅
- **Icon-only ✕ / × close and delete buttons** — added `aria-label` + `title` to: era delete, timeline delete (Open modal), remove image, remove photo, clear parent event (×2, both AddEvent and EditEvent), remove dependency, remove relationship, VersionHistoryModal close, SlidePanel/panel close, Claude panel close ✅
- **Lightbox zoom indicator** — added `aria-live="polite"` to the `%` readout in the lightbox zoom control bar ✅
- **Vertical timeline zoom %** — added `aria-live="polite"` to the `%` readout in the Vertical view zoom control ✅
- **Afrikaans accessibility section** — expanded `HELP_SECTIONS_AF` accessibility entry to match English: added Screen Readers bullet list (aria-label, aria-pressed, landmarks, dialog, live regions), updated contrast section, added keyboard shortcuts reference table ✅
- **English accessibility section** — added bullet noting the saveMsg live region ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER4_ITEM20.md` written ✅

**Completed this session (REED — Tier 4 Item 21):**
- **i18n framework** — `I18nCtx`, `useT()`, `useLang()`, `makeT()` already in place from prior session; audited and confirmed complete ✅
- **TRANSLATIONS object expanded** — added ~30 missing keys to all 4 language blocks (en/af/es/fr): source types `Document`/`Interview`, source confidence labels, `All on`/`All off`/`No match`, modal titles (`Add Person`, `Add Event`, `Edit Person`, `Edit Event`), form labels (`Name *`, `Role / description`, `Colour`, `Title *`, `Start date *`, `End date`, `Associate with people`, `Show on timeline`, `Parent event`, `None (top-level event)`, `No events match`), panel section headers (`Tags`, `Sources`, `Progress`, `Custom Fields`, `Recurrence`, `Description`), messages (`No sources cited.`, `No people added yet.`, `+ Add`, `Part of`), action button `Save Changes`, status word, extra menu items (`Version History…`, `Share…`, `Keyboard Shortcuts…`) ✅
- **MONTH_NAMES** — all 4 languages already correct in prior work; confirmed wired into `fmtDate()` ✅
- **MenuBar fully translated** — all menu item labels now wrapped with `t()`: File/Edit/View/Navigation/Item/Sync/Tools/Help menus including all sub-items; menu name headers call `t(name)` ✅
- **AddPersonModal** — `const t = useT()` added; modal title, all field labels, Cancel/Add Person buttons translated ✅
- **AddEventModal** — `const t = useT()` added; modal title, all field labels including Parent event selector text, Category label, Location section, Tags, Cancel/Add Event buttons translated ✅
- **EditEventModal** — `const t = useT()` added; modal title, Cancel/Save Changes buttons translated ✅
- **EditPersonModal** — `const t = useT()` added; modal title, Name * label, Cancel/Save Changes buttons translated ✅
- **EventPanel** — `const t = useT()` added; section headers (Description, Tags, Custom Fields, Sources, People, Images, Progress, Recurrence, Part of) and messages translated; `+ Add` button translated ✅
- **FilterPanel** — `const t = useT()` added; Filters header, People/Categories/Tags/Status/Events section headers, `All on`/`All off` buttons, `No match` message, `Search people...` placeholder all translated ✅
- **Variable shadowing fixed** — `allTags.map(t => ...)` renamed to `allTags.map(tag => ...)` in FilterPanel to prevent shadowing `const t = useT()` ✅
- **Help modal language note** — for es/fr: banner shown "Help content available in English and Afrikaans." ✅
- **Language switcher** — already in MenuBar (Tools menu checkmarked) and Toolbar selector; wired to `lang` state persisted in `localStorage.tl_lang` ✅

**Completed this session (REED — Tier 4 Item 22 — Tier 4 COMPLETE):**
- **Template library — 12 starter timelines** — `TIMELINE_TEMPLATES` array with full data for: ⚔️ World War II (5 people, 15 events, 4 eras, dark red gradient), 🏛️ Ancient Rome (4 people, 14 events, 2 eras, parchment theme), 🔬 Scientific Revolution (4 people, 12 events, 3 eras, deep blue), 👤 My Life Timeline (placeholder, 12 events, 3 eras), 💍 Wedding Planning (2 people, 12 events, rose theme), 🚀 Product Launch Roadmap (3 team members, 15 events, Q1–Q4 structure), ⚖️ Legal Case Chronology (3 parties, 12 events, exhibit citations, formal grey), 🌳 Family Genealogy (8 people, 10 events, 11 pre-wired relationships, Flow view default), 🗡️ French Revolution (4 people, 14 events, tricolor eras), 🛸 Space Exploration (4 people, 15 events, space-dark theme), 🏺 Ancient Egypt (4 people, 15 events, 4 eras, sandy gold), 🏢 Company History (3 people, 12 events, corporate blue) ✅
- **`TEMPLATE_CATEGORIES`** — 7 category tabs for gallery filter: All / Historical / Scientific / Personal / Business / Legal / Genealogy ✅
- **`TemplateGalleryModal`** — full-screen modal; header with search box + category filter tabs; 3-col card grid (icon, name, description, category badge, event count, "Use this template" button); right preview pane (people chips, first 8 events, counts); confirmation dialog before loading ✅
- **Entry points wired** — File menu → "New from template…" (`newFromTemplate` action case); New Timeline modal → "Browse templates" button with `onBrowseTemplates` prop; modal render added to App JSX ✅
- **Empty-state auto-show** — `useEffect` opens gallery automatically on first-ever launch if no timelines are saved (`localStorage.tl_templateGallerySeen` flag prevents repeat display) ✅
- **`handleUseTemplate`** — callback calls `loadTimeline()` with template data, switches to `defaultView`, and closes gallery ✅
- **i18n keys** — all 4 languages (en/af/es/fr): "Choose a template", "Search templates…", "Use this template", "Start fresh with this template?", "Browse templates", "Select a template to preview", "No templates match" ✅
- **Help modal updated** — "Template Gallery" section added to `HELP_SECTIONS` (EN) and `HELP_SECTIONS_AF` (AF) with full feature guide ✅
- **CLAUDE.md updated** — Tier 4 marked complete ✅

**Completed this session (Tier 5 Item 23):**
- **Extract from Text** — `POST /api/extract` endpoint in `server.py`; `ExtractModal` 3-step component in `index.html`; entry points: Tools → ✨ Extract from text… and 📄 Extract button in Claude panel header; Jaccard-based duplicate detection (`isSimilarEvent`, `isSimilarPerson`); bulk add handlers `handleAddPeopleBulk` + `handleAddEventsBulk`; i18n keys in all 4 languages (en/af/es/fr); Help modal updated (EN + AF); server-offline graceful fallback ✅

**Completed this session (Tier 5 Item 24):**
- **Wikipedia / Wikidata import** — `POST /api/wiki-import` endpoint in `server.py`; `WikiImportModal` 3-step component in `index.html`; entry points: Tools → 🌐 Wikipedia Import… and 🌐 Wiki button in Claude panel header ✅
- **Article resolution** — accepts a full Wikipedia URL (any language) or a plain topic name; plain-topic mode runs Wikipedia Search API to find best-matching article title first; REDIRECT handling via `&redirects=1` ✅
- **Article fetch** — Wikipedia `action=query&prop=extracts` API; HTML tags stripped with regex; truncated at `MAX_EXTRACT_CHARS` (50 000); canonical URL resolved via a second `prop=info&inprop=url` call ✅
- **Claude extraction** — reuses the existing `EXTRACT_SYSTEM` prompt and `claude-sonnet-4-6` model; sends article text + article title + existing people/events as context; same structured JSON response format as Extract from Text (Item 23) ✅
- **13 Wikipedia languages** — language selector (English, Afrikaans, Español, Français, Deutsch, Nederlands, Português, Italiano, Polski, Русский, العربية, 中文, 日本語) ✅
- **Jaccard duplicate detection** — reuses `isSimilarPerson` and `isSimilarEvent` helpers; duplicates auto-unchecked in the Review step; amber "Already in timeline" badge; orange "Possible duplicate" badge ✅
- **3-step modal UI** — Step 1: URL/topic input + language picker + Enter key shortcut; Step 2: review with Select all / Deselect all per section; Step 3: Done with summary message ✅
- **Attribution bar** — Step 2 shows article title as a clickable link back to the Wikipedia article ✅
- **Server-offline graceful fallback** — shows inline warning; Fetch button disabled; no crash ✅
- **i18n keys** — all 4 languages (en/af/es/fr): Wikipedia Import, Wikipedia URL or topic, Fetch & Extract, Fetching article…, Fetched from Wikipedia, Enter a Wikipedia URL…, Step 1/2/3 labels, People found, Events found, Add selected to timeline, Already in timeline, Possible duplicate, Select all, Deselect all, Nothing was selected ✅
- **Help modal updated** — "Wikipedia Import 🌐" sub-section added under AI / Extract in `HELP_SECTIONS` (English) and "Wikipedia Invoer 🌐" in `HELP_SECTIONS_AF` (Afrikaans) ✅
- **CLAUDE.md updated** ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER5_ITEM24.md` written ✅

**Completed this session (Tier 5 Item 25):**
- **Narrative Generation Export** — `POST /api/narrative` endpoint in `server.py`; `NarrativeModal` component in `index.html`; entry points: Tools → 📖 Narrative Export… and File → 📖 Narrative Export…; 4-tone selector (Academic/Narrative/Journalistic/Simple), 3-length selector (Brief/Standard/Detailed), 3-focus selector (All/People/Events), language dropdown (en/af/es/fr); Generate button calls Claude (non-streaming) with compact timeline context; markdown-lite renderer for result (## headings → h3, paragraphs → p); Copy to clipboard, Download .txt, Download PDF (jsPDF) action buttons; ← Regenerate to go back; server-offline guard; i18n keys in all 4 languages; Help modal updated (EN + AF); NARRATIVE_SYSTEM constant defined in server.py; 30,000 char context cap; delivery note written ✅

**Completed this session (Tier 5 Item 26):**
- **Google Sheets live sync** — `POST /api/sheets-fetch` proxy endpoint in `server.py` (urllib only, no new deps); `GoogleSheetsModal` 3-step component in `index.html`; entry points: File → 📊 Google Sheets Sync… and Tools → 📊 Google Sheets Sync… ✅
- **URL normalisation** — accepts Google Sheets edit URLs, view URLs, and publish-to-web CSV URLs; automatically converts to `/export?format=csv&gid={gid}` form; extracts sheet ID via regex ✅
- **CORS proxy** — server fetches the sheet with browser-like User-Agent; 403 Forbidden returns a detailed "publish your sheet" error message with step-by-step instructions ✅
- **3-step modal UI** — Step 1: URL input + sheet type selector (Events/People); Step 2: column mapping with auto-detection + preview table (first 3 rows) + merge strategy + auto-sync interval; Step 3: Done summary ✅
- **Column mapping** — `autoDetectColumns()` helper; 8 fields for events (Title, Start Date, End Date, Description, Category, People, Location, Tags), 5 for people (Name, Birth, Death, Role, Color); each field has aliases list for smart auto-detection ✅
- **Import strategies** — Merge (dedupe by title/name, add new rows only) and Replace (clear all and reload) ✅
- **Auto-sync** — `sheetsConfig` state in App; `useEffect` creates `setInterval` when `syncInterval !== 'off'`; `doSheetsSync()` async callback re-fetches + re-imports silently; interval cleaned up on config change ✅
- **Toolbar badge** — 📊 badge shows "Synced Xm ago" when sheetsConfig is active; 🔄 button triggers manual sync; clicking badge opens modal ✅
- **`handleReplaceAll` callback** — replaces people + events state + syncs selectedPeople ✅
- **i18n keys** — 8 keys in all 4 languages (en/af/es/fr): Google Sheets Sync, Fetch Sheet, Fetching sheet…, Map Columns, Merge, Replace, Auto-sync ✅
- **Help modal updated** — "Google Sheets Sync" sub-section added to import-export in `HELP_SECTIONS` (English) and "Google Blaaie Sinkronisering" in `HELP_SECTIONS_AF` (Afrikaans) ✅
- **Delivery note** — `Owner's Inbox/REED_DELIVERY_TIER5_ITEM26.md` written ✅

**Completed this session (Tier 5 Item 27):**
- **Calendar sync (.ics export)** — `buildICSCalendar()` RFC 5545-compliant function; `foldICSLine` (75-octet fold); `escICS` (TEXT property escaping); `ICSExportModal` component with All/Range filter, options checkboxes (RRULE, location, attendees, description), Download .ics + Copy to clipboard; File → 📅 Export to Calendar (.ics)…; i18n keys in all 4 languages; Help section updated (EN + AF); delivery note written ✅

**Completed this session (Tier 5 Item 28 — ALL TIERS COMPLETE):**
- **REST API** — `/api/v1/*` endpoints with API key authentication; `api_keys` + `webhooks` SQLite tables added in `migrate_db()` ✅
- **API key system** — `_hash_key()` + `_validate_api_key()` helpers; key format `tl_` + 64 hex chars; `last_used_at` updated on every request; `GET/POST/DELETE /api/v1/keys` management endpoints (no auth) ✅
- **Granular CRUD endpoints** (all require Bearer API key): `GET/POST /api/v1/timelines/{id}/people`, `PUT/DELETE /api/v1/timelines/{id}/people/{pid}`, `GET/POST /api/v1/timelines/{id}/events`, `PUT/DELETE /api/v1/timelines/{id}/events/{eid}`, `GET /api/v1/timelines`, `GET /api/v1/timelines/{id}` ✅
- **Partial update semantics** — People PUT and Events PUT only update fields present in the request body; absent fields keep their DB value ✅
- **Webhooks** — `webhooks` table; `_fire_webhooks()` fires in daemon thread (non-blocking); HMAC-sha256 signing via `X-Timeline-Signature` header; `GET /api/v1/webhooks` (no auth, management UI), `GET/POST /api/v1/timelines/{id}/webhooks` (auth), `DELETE /api/v1/webhooks/{wid}` (auth); fires on every `PUT /api/timelines/{id}` save ✅
- **FastAPI Swagger UI** — auto-generated at `/docs`, JSON schema at `/openapi.json` ✅
- **`APIModal` component** — two-tab modal (🔑 API Keys / 🪝 Webhooks); key list with name/prefix/last-used/revoke; one-time key display in green banner; generate-new-key form; webhook list with URL/events/signed badge/delete; register-webhook form with URL + signing secret; API Docs ↗ link; server-offline guard ✅
- **Entry point** — Tools → 🔑 API & Webhooks…; `showAPIModal` state; wired in App JSX ✅
- **i18n keys** — all 4 languages (en/af/es/fr): 🔑 API & Webhooks…, API Keys, Webhooks, Generate New Key, Key name, Revoke, Register Webhook, Webhook URL, Signing secret (optional) ✅
- **Help updated** — "REST API & Webhooks" section added to `HELP_SECTIONS` (English) and `HELP_SECTIONS_AF` (Afrikaans); includes endpoint table, webhook payload example, signing explanation, usage instructions ✅
- **Delivery notes** — `Owner's Inbox/REED_DELIVERY_TIER5_ITEM27.md` and `REED_DELIVERY_TIER5_ITEM28.md` written ✅

**🎉 ALL 28 GAP ANALYSIS ITEMS DELIVERED. Tier 5 complete.**

**Completed this session (Welcome Screen + Recent Files):**
- **App opens blank** — `people` and `events` state initialised to `[]`; `timelineName` initialised to `''`; `SAMPLE_PEOPLE`/`SAMPLE_EVENTS` constants kept for template gallery and New Timeline "sample data" option ✅
- **`WelcomeScreen` component** — shown when `!welcomeDismissed && !timelineName && people.length === 0 && events.length === 0`; two layouts: first-time user (no saved timelines) and returning user ✅
  - *First-time* — headline, primary "Start from a Template" button, secondary "New blank timeline" + "Open / Import…" buttons, server status indicator, "Continue without selecting →" escape link
  - *Returning* — "+ New Timeline" + "Open / Import…" top actions; Recent Timelines grid (up to 5 cards with name, event/person count, last-modified date, colour swatch strip from category colours); Start from a Template strip (first 4 template preview cards + "Browse all N →"); server status; continue link
- **`getRecentTimelines()` helper** — reads `loadSaves()` from localStorage, reverses to newest-first, returns last 5 with `{ name, eventCount, personCount, lastModified, colors }` ✅
- **`welcomeDismissed` App state** — set to `true` on: template use, recent-file open, Continue click; reset via `handleNew` flow (so blank timeline returns to welcome if abandoned) ✅
- **`RecentFilesModal` component** — small modal listing last 5 saved timelines with colour dot row, name, event count, last-modified date; click to open; "No recent timelines" empty state ✅
- **File → Open Recent…** — menu item added to File menu (after "Open / Load…"); opens `RecentFilesModal`; `openRecent` action wired in `handleMenuAction`; i18n in all 4 languages (en/af/es/fr) ✅
- **Template gallery auto-show suppressed** — old first-load auto-show logic removed; WelcomeScreen now handles first-time UX; `tl_templateGallerySeen` still marked on load so other code paths remain intact ✅

**Completed this session (Subway View — 11th view mode):**
- **`SubwayView` component** — metro-map style visualisation; each person is a horizontal coloured line, each event is a stop circle on that line; inserted before `const App` ✅
- **Track assignment** — `assignSubwayTracks()` BFS algorithm places people with relationships on adjacent tracks; most-connected person first ✅
- **Converging lines** — events shared by multiple people cause all involved person lines to curve toward a shared midpoint stop (average Y of involved tracks), then curve back to their home track via cubic bezier paths ✅
- **Stop rendering** — single-person stops: filled circle in person colour with category-colour ring; multi-person stops: grey fill with category ring; larger radius for shared stops; labels alternate above/below to reduce overlap ✅
- **Relationship arcs** — dashed `<path>` arcs drawn for parent (gray, `strokeDasharray="6,3"`), spouse (pink, `"2,4"`), influenced (purple, `"8,4"`); arrow markers on parent/influenced ends; label at arc midpoint ✅
- **Era background bands** — vertical `<rect>` fills at 10% opacity behind all lines, with era label at top ✅
- **Date axis** — smart tick interval (same logic as ThreadTimeline) drawn at the bottom of the SVG ✅
- **Highlight mode** — click any person label in the left panel to highlight that person's line at full opacity/width 4px and dim all others to 18% opacity; click again to clear ✅
- **Hover tooltip** — title, date, people names, category badge; follows cursor; `pointerEvents:none` so it doesn't block interaction ✅
- **Pan & zoom** — mouse drag pans; Ctrl+scroll zooms centred on cursor; `Fit All` resets to auto-range ✅
- **Empty state** — 🚇 icon + message when no events are loaded ✅
- **Entry points** — View menu → `🚇 Subway` (`viewSubway` action); `🚇 Subway` button in HorizontalTimeline toolbar; `🚇 Subway` button in VerticalTimeline toolbar ✅
- **i18n** — `'🚇 Subway':'🚇 Subway'` added to all 4 language blocks (en/af/es/fr) ✅
- **Help updated** — "Subway view (🚇 Subway)" section added to `HELP_SECTIONS` (English) and "Metro-aansig (🚇 Subway)" to `HELP_SECTIONS_AF` (Afrikaans) in the Views section ✅

**Completed this session (Left Sidebar — Places, Arcs, Search, People panels):**
- **`places` and `arcs` data models** — global state `[{ id, name, lat, lon, description, color }]` and `[{ id, name, color, description, eventIds }]`; already fully wired into `saveToStorageLS`, `saveToStorage`, `exportJSON`, `loadTimeline`, `handleLoad`, `handleNew`, `handleUseTemplate`, `handleRemoteChange`, `OpenTimelineModal`, and the dirty-flag `useEffect` ✅
- **`placeId` on events** — `placeId: null` default added to SAMPLE_EVENTS and all event-creation paths (csvRowToEvent, addEvent, handleAdd in AddEventModal, handleSave in EditEventModal) ✅
- **`sidebarPanel` and `sidebarPinned` App state** — `null | 'search' | 'people' | 'places' | 'arcs'` and boolean pinned flag ✅
- **`SearchPanel` component** — global full-text search; autofocus input; results grouped by People / Events / Places / Arcs; click person → EditPersonModal; click event → EventPanel; click place/arc → switches to that panel; min 2-char threshold ✅
- **`PeoplePanel` component** — alphabetical people list with search input; coloured avatar + event count; click row → EditPersonModal; `+ Add Person` button at bottom ✅
- **`PlacesPanel` component** — place list with coloured dot + event count; expand to see linked events; inline edit form (name, lat/lon, geocode 🔍, description, colour palette); inline add form; delete with event-unlink cleanup ✅
- **`ArcsPanel` component** — arc list with colour swatch + event count; expand to see linked events with ✕ unlink; `+ Add events` inline searchable picker; inline edit and add forms; 12-colour palette ✅
- **`LeftSidebar` component** — 44px icon rail + absolute 280px slide-out panel; pin/unpin toggle; overlay-to-close when unpinned; `aria-label` + `aria-pressed` on all icon buttons; full accessibility ✅
- **Layout** — `<main>` wraps `<LeftSidebar>` + inner content div in a horizontal flex row; sidebar rail is `position:relative` so the absolute slide-out panel overlays correctly within the main area ✅
- **"Link to Place" in AddEventModal** — `places` prop added; `placeId` state; `handleSelectPlace` fills locName/locLat/locLon from selected place; name/lat/lon inputs go `readOnly` when a place is linked; place cleared if user manually edits location name; `placeId` included in the saved event object ✅
- **"Link to Place" in EditEventModal** — `places = []` prop added; `placeId` state initialised from `event.placeId`; `handleSelectPlace` helper; same readOnly behaviour; `placeId` included in both `_detachOccurrence` and normal save paths ✅
- **`places={places}` passed** to `AddEventModal` and `EditEventModal` call sites in App render ✅
- **Arc overlay on HorizontalTimeline** — `arcs` prop already in `HorizontalTimeline` signature; arc background bands already drawn via `__arc__` vis-timeline background items spanning the min→max event date range ✅
- **i18n keys** — all 4 languages already have: `Story Arcs`, `Places`, `Add Place`, `Add Arc`, `Link to Place`, `No places yet.`, `No arcs yet.`, `Pin panel`, `Unpin panel`, `No results`, `Type to search…` ✅
- **Help modal** — new "Left Sidebar" section (`id:'sidebar'`) added to `HELP_SECTIONS` (English) and "Linker Sykant" to `HELP_SECTIONS_AF` (Afrikaans); covers opening/closing/pinning, all 4 panels, Link to Place, arc overlay ✅
- **SQLite note** — server.py needs these migrations for next session (not yet applied):
  ```sql
  CREATE TABLE IF NOT EXISTS places (id TEXT, timeline_id TEXT, name TEXT, lat REAL, lon REAL, description TEXT, color TEXT);
  CREATE TABLE IF NOT EXISTS arcs (id TEXT, timeline_id TEXT, name TEXT, color TEXT, description TEXT, event_ids TEXT);
  ALTER TABLE events ADD COLUMN place_id TEXT DEFAULT NULL;
  ```

**Completed this session (Calendar Markers):**
- **`markers` state** — `[{ id, name, date, color, style, labelPos, visible, builtIn }]` in App; `displayMarkers` useMemo always prepends a live "Today" marker (recalculated from current year, never persisted); `builtIn` markers filtered out before all save paths ✅
- **`MarkersModal` component** — Tools → 🔖 Markers…; Today marker row (read-only date, editable color/style/labelPos); user markers with 👁 / ✏ / 🗑 controls; inline add/edit form with name, date (parseDate), colour swatches + native picker, Style pills, Label pills ✅
- **Horizontal timeline** — `markersLayerRef` absolutely-positioned div overlay; `updateMarkerLines()` useCallback using `markersRef.current`; hooked into `rangechanged` and `changed` vis-timeline events (same pattern as `redrawEras`); solid/dashed/dotted CSS implementation; top/bottom label positioning ✅
- **Vertical timeline** — `marker-banner` items injected into `renderItems` useMemo between event cards when the marker date falls within the card year range; 🔖 icon + name + date displayed in marker colour ✅
- **Thread timeline** — SVG `<line>` and `<text>` elements rendered after tick marks; `strokeDasharray` for dashed/dotted styles ✅
- **Full persistence** — `saveToStorageLS`, `saveToStorage`, `exportJSON`, `loadTimeline`, `handleLoad`, `handleOpenRecent`, `handleUseTemplate`, `handleRemoteChange`, `OpenTimelineModal` (all 3 paths), `VersionHistoryModal` restore, `SharePasswordModal` — all updated ✅
- **i18n keys** — all 4 languages (en/af/es/fr): 🔖 Markers…, Calendar Markers, Add Marker, Today, Solid, Dashed, Dotted ✅
- **Help modal** — "Calendar Markers" section (id: `markers`) added to `HELP_SECTIONS` (English) and "Kalendermerkers" to `HELP_SECTIONS_AF` (Afrikaans); covers Today marker, adding, editing, deleting, visibility toggle, persistence ✅
- **SQLite note** — server.py needs this migration for next session (not yet applied):
  ```sql
  ALTER TABLE timelines ADD COLUMN markers TEXT DEFAULT '[]';
  ```

**Completed this session (2026-04-15):**
- **Tree View (🌳 Tree — 12th view mode)** — d3-hierarchy CDN layout; top-down/left-right toggle; 32px portrait circle nodes with photos/initials; parent→child bezier edges; spouse dashed lines; supplementary parent dashed amber lines; click node → EditPerson; hover tooltip; drag-pan + Ctrl+scroll zoom; Fit All; empty state; help updated (EN + AF) ✅
- **Radial / Wheel View (☀ Radial — 13th view mode)** — custom SVG arc math; inner ring = categories, outer ring = events; click segment → EventPanel; hover tooltip; Ctrl+scroll zoom; drag pan; style panel (theme/gap/ring options); help updated (EN + AF) ✅
- **Horizontal timeline scroll fix (initial attempt)** — `overflow:'hidden'` on outer wrapper; `groupHeightMode:'auto'` — worked for small timelines but broke with large people counts ✅ (superseded below)

**Completed this session (2026-04-19):**
- **Git & GitHub setup verified** — Git 2.50.1, GitHub CLI 2.90.0 authenticated as `sarelroeloffze-lab`; remote origin `https://github.com/sarelroeloffze-lab/timeline-app.git` confirmed ✅
- **Global `.gitignore_global`** — created at `~/.gitignore_global`; wired via `git config --global core.excludesFile`; covers macOS, Python, Node/Electron, editors, temp files ✅
- **Project `.gitignore`** — created at `timeline/.gitignore`; covers `__pycache__/`, `.env`, `dist/`, `node_modules/`, `timeline.db-shm`, `timeline.db-wal`, `images/people/`, `images/events/`, `images/canvas/`, logs ✅
- **Horizontal timeline vertical scroll — definitive architectural fix** — recurring bug resolved permanently ✅
  - **Root cause diagnosed**: `verticalScroll:true` in vis-timeline conflicts with `zoomKey:'ctrlKey'` — vis-timeline captures all wheel events for horizontal panning; vertical scroll handler never fires. Additionally, `height:'auto'` collapses to 0 because all vis-timeline internals are `position:absolute`; and vis-timeline calls `preventDefault()` on wheel events, blocking native scroll.
  - **Fix 1 — removed `verticalScroll:true`** — eliminated the conflicting option
  - **Fix 2 — removed `groupHeightMode:'auto'`** — was distributing container height evenly across all rows (37 rows × ~19px = squished), making all rows visible at once with no scroll needed
  - **Fix 3 — native browser scroll**: `tlWrapRef` changed from `overflow:'hidden'` to `overflowX:'hidden', overflowY:'auto'`; `containerRef` changed from `height:'100%'` to `height:'auto'`
  - **Fix 4 — DOM-read height**: `updateTlHeight()` function reads actual vis-timeline content height from `.vis-label-set.scrollHeight + axisPanel.offsetHeight + 20`; stored in `updateTlHeightRef`; called via `requestAnimationFrame` after every group redraw and on ResizeObserver; eliminates row-count estimation errors
  - **Fix 5 — wheel interceptor**: capture-phase wheel listener on `containerRef`; intercepts vertical wheel (no ctrl) → `tlWrapRef.scrollTop += deltaY` + `preventDefault()` + `stopPropagation()`; horizontal trackpad swipe (deltaX > deltaY) and Ctrl+wheel pass through to vis-timeline normally
  - **Key architecture rule going forward**: never combine `verticalScroll:true` with `zoomKey:'ctrlKey'` in vis-timeline — they are mutually exclusive. Always use native browser scroll + DOM-read height for vertical row scrolling.

**Completed this session (2026-04-22) — Horizontal scroll DEFINITIVE FIX:**
- **Native browser scroll** — `tlWrapRef` uses `overflowY:'auto', overflowX:'hidden'` for true browser-native vertical scrolling
- **Explicit height calculation** — vis-timeline `height` set dynamically based on row count: `rowCount * (rowH + 10) + 60`; no `height:null` or `height:'auto'` (those collapse)
- **No `horizontalScroll:true`** — removed this option as it captures wheel events and breaks vertical scroll; Ctrl+wheel still zooms via `zoomKey:'ctrlKey'`
- **Dynamic overlay positioning** — `redrawEras()` and `updateMarkerLines()` read actual axis panel height and position overlays below it; era backgrounds now appear behind timeline rows, not above them
- **Scroll Control Bar** — right-side 28px column with: ⬆ Top, △ Page Up, scroll indicator, ▽ Page Down, ⬇ Bottom, row count
- **Keyboard support** — Page Up/Down, Home/End keys control `tlWrapRef.scrollTop` when no input is focused
- **Content height tracking** — `contentH` state set from row count calculation; `scrollY` and `viewportH` tracked for scroll indicator
- **ResizeObserver + MutationObserver** — trigger redrawEras/updateMarkerLines on DOM changes

**Completed this session (2026-04-30) — Horizontal Timeline FINAL FIX (Option C):**
- **Single source of truth** — `masterHeight` state drives all height calculations; eliminates circular dependencies
- **Zero DOM height reads** — removed `scrollHeight`, `offsetHeight`, and entire `updateContentHeight()` function
- **Overlays use masterHeight** — `redrawEras()` and `updateMarkerLines()` set `overlay.style.height = masterHeight + 'px'` (no more DOM reads)
- **Synchronous fitAll()** — `fitAll()` triggers immediate `redrawEras()` and `updateMarkerLines()` (no more blank flash during animation)
- **Removed minHeight trap** — inner wrapper no longer uses `minHeight:'100%'`; added `maxHeight:'100%'` to tlWrapRef instead
- **Scroll-to-end fixed** — Page Down and Bottom buttons use `masterHeight - clientHeight` for accurate max scroll
- **Scroll indicator fixed** — uses `masterHeight` instead of `contentH` for position calculation
- **Simplified observers** — ResizeObserver and MutationObserver only trigger redraws; no height measurement logic
- **Key principle** — Height flows one direction: calculation → state → consumers (no circular DOM reads)

**REGRESSION (2026-05-04/05) — Horizontal scroll broken again:**
- **Problem:** Big black blank area at top; scroll doesn't reach bottom of timeline
- **Root cause 1 (May 4):** `horizStyle` defaults had `showLabels:false, labelWidth:0` → person names hidden, leftW=0 → Fixed line 21252 to `showLabels:true, labelWidth:42`
- **Root cause 2 (May 4):** Inner wrapper had `minHeight:'100%'` instead of explicit height → Fixed line 7017 to `height: contentH + 'px'`
- **Root cause 3 (May 5):** `updateContentHeight()` correctly measures 2219px but `contentH` React state stays at 600px → **wrapper div only 600px tall while vis-timeline is 2013px** → INVESTIGATING
- **Current status:** Added debug logging to track state updates; need to verify why `setContentH(2219)` doesn't update the wrapper div height
- **See:** DEBUG_CONTEXT.md for full session log and console output

**Still remaining (minor, not in the gap analysis):**
- Edit via DataGrid inline double-click (currently only via modals)
- Settings modal (currently routes to Background Settings; proper SettingsModal not yet built)
- About modal (currently routes to Help modal)
- StyleTemplateBar is defined and working (see `const StyleTemplateBar` before `FLOW_PRESETS`)

---

## Recommended Language Stack

**Python + React** is the strongest combination with the future in mind:

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (JSX) | Visual timeline, drag-and-drop, graphics, UI |
| Backend | Python + FastAPI | Data handling, Claude API calls, image processing, export |
| Database | SQLite | Embedded single-file DB, no server needed |
| Desktop packaging | Electron or Tauri | Wraps app as installable .exe / .app |

> **Note:** Node.js is not currently installed on this machine. Stage 1 uses CDN-based React + Babel standalone to avoid any build step. When moving to Stage 2 proper project structure, Node.js will need to be installed.

---

## Should Claude AI Be Integrated?

Yes — it would genuinely elevate the product. Planned uses:

- **Natural language input** — "show me all events between 1990 and 2000 involving John Smith"
- **Auto-summarising** people and events for caption text on the timeline
- **Suggesting relationships** between people and dates
- **Generating descriptions** from minimal input
- **Export narration** — Claude writes the story of the timeline for PowerPoint notes

Use model: `claude-sonnet-4-6` (latest Sonnet)

---

## Database — SQLite

SQLite is the right choice:
- Single file database — easy to back up, move, and embed
- No server required — works perfectly in a desktop app
- Scales to millions of records for this use case
- Can graduate to PostgreSQL later if multi-user or cloud is needed

### Core Tables

```
People
  - id, name, birth_date, death_date, photo, bio, tags

Events
  - id, title, date_start, date_end, description, location, category, tags

PersonEvents  (relationship table)
  - person_id, event_id, role

Media
  - id, event_id, person_id, file_path, media_type, caption

Tags / Categories
  - id, label, colour
```

---

## Visual Output and Export

| Feature | Library/Tool |
|---|---|
| Timeline rendering | vis-timeline ✅ in use |
| Image/screenshot export | html2canvas or Puppeteer |
| PowerPoint export | PptxGenJS (generates real .pptx files from JavaScript) |
| PDF export | jsPDF (print-quality output) |

---

## Key Principles

- **Build with the end in mind** — every stage produces a working, usable result
- **Separate concerns early** — UI layer separate from data layer from AI layer
- **Don't over-engineer stage 1** — start visible, iterate fast
- **SQLite first** — upgrade database only when a real need arises
- **Claude API is the AI backbone** — use `claude-sonnet-4-6` model

---

## Instructions for Claude

- **Always check the Team Inbox** at the start of every session — read `Team Inbox/` for any notes, ideas, or instructions left by the user before doing anything else; acknowledge what you find
- **IDEA PHOTOS folder** — `Team Inbox/IDEA PHOTOS/` contains reference documents (Aeon top menu structure, left-hand menu, second-from-top menu buttons) — use as inspiration for UI decisions, do not copy verbatim
- **Always update this file** at the end of each work session — update the build progress table, what's built, current status, and next immediate step
- **Always update the Help modal** when adding or changing any feature — update `HELP_SECTIONS` (English) AND `HELP_SECTIONS_AF` (Afrikaans) in `index.html`; the relevant section(s) must reflect the new behaviour before the session ends
- Work is saved in the `timeline/` folder only
- Do not use VB/VBA — legacy, no path to modern AI, not cross-platform
- Single HTML file approach is intentional for Stage 1 — keep it until the backend is added

---

## Session Startup Protocol

**1. Check git status first:**
```bash
git status
git log --oneline -5
```

**2. Read these to understand current state:**
- This file (`claude.md`) — Build Progress table + Next Immediate Step section
- `Team Inbox/` — any new notes from user
- Memory (`~/.claude/projects/.../memory/MEMORY.md`) — persistent context across sessions

**3. Key files and what they contain:**
- `index.html` (1.37 MB) — entire frontend (React, all 13 view modes, all components, all modals)
- `server.py` (115 KB) — ⚠️ ARCHIVED — old FastAPI backend (replaced by Firebase)
- `timeline.db` — ⚠️ ARCHIVED — old SQLite database (replaced by Firestore)
- `mcp-server/` — Dev Assistant HTTP bridge (bridge.js for localhost:3131)
- `~/Documents/timeline-mcp/` — MCP server for Claude Desktop (moved from project folder due to macOS sandbox restrictions)
- `dev.html` — Dev panel UI (connects to bridge on localhost:3131)

---

## Git Workflow

**Stage + commit when:**
- Feature complete and tested
- User explicitly asks to commit
- End of significant work session

**Always include in commits:**
- Modified `claude.md` (if build progress updated)
- Modified `index.html` (if features changed)
- Modified `server.py` (if backend changed)
- Updated Help sections (if features added)

**Never commit:**
- `timeline.db*` (archived — old SQLite database files)
- `server.py`, `requirements.txt` (archived — old FastAPI backend)
- `mcp-server/.env` (gitignored — API key)
- `mcp-server/node_modules/` (gitignored — npm packages)
- User data files in `images/people/`, `images/events/`, `images/canvas/` (gitignored)
- `.claude/settings.local.json` (local IDE settings)
- `dist/` (excluded from Dropbox sync via `xattr` — build output)

**Commit message format:**
```
Brief one-line summary

- Bullet point details
- What changed and why
- Any breaking changes or migrations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Dev Assistant

Local development tool for fault-finding and AI-assisted coding.

### **Two Components:**

#### **1. HTTP Bridge (for dev.html panel)**
**Start:**
```bash
cd ~/Library/CloudStorage/Dropbox/AAA\ Claud/timeline/mcp-server && node bridge.js
```

**Open:** http://localhost:3131 in Chrome

**API key:** Stored in browser localStorage (only entered once)

**Files:**
- `mcp-server/bridge.js` — the HTTP bridge (port 3131)
- `dev.html` — the floating 🤖 panel UI

#### **2. MCP Server for Claude Desktop**
**Location:** `~/Documents/timeline-mcp/`

**Why separate?** macOS sandbox restrictions prevent Claude Desktop from accessing `~/Library/CloudStorage/Dropbox/`. The MCP server files are copied to `~/Documents/` (accessible location) while the project files remain in Dropbox.

**Config:** `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "timeline-dev-assistant": {
    "command": "node",
    "args": ["/Users/sarelroeloffze/Documents/timeline-mcp/server.js"],
    "env": {
      "TIMELINE_PATH": "/Users/sarelroeloffze/Library/CloudStorage/Dropbox/AAA Claud/timeline"
    }
  }
}
```

**Files:**
- `~/Documents/timeline-mcp/server.js` — MCP server for Claude Desktop
- `~/Documents/timeline-mcp/.env` — API key + TIMELINE_PATH
- `~/Documents/timeline-mcp/node_modules/` — dependencies

**MCP Tools Available in Claude Desktop:**
- `list_project_files` — Lists all files in the timeline project
- `read_file` — Reads any project file (index.html, etc.)
- `write_file` — Edits files with auto-git-commit before/after
- `search_in_files` — Search for text across project files
- `git_log` — Shows recent git commits

**Do NOT distribute:** dev.html and mcp-server/ stay on local Mac only

---

## Debug Session Log (May 4, 2026)

**Bug:** Horizontal timeline - era backgrounds appear "on top before timeline starts" instead of behind rows; scroll doesn't reach bottom

**Attempted Fix: Manual Overlay Approach (FAILED)**
- Changed `redrawEras()` and `updateMarkerLines()` to read height from `.vis-itemset` and `.vis-foreground` scrollHeight
- Wrapped all overlay update calls in `setTimeout(0)` to defer until DOM settled
- Fixed `leftW` to default to 42px when label panel has `clientWidth = 0`
- Result: Console shows correct values (`topOffset: 46, fullH: ~2000, leftW: 42`) but eras still render wrong

**Conclusion:** Manual overlay approach is fundamentally incompatible with vis-timeline's dynamic rendering

**Backup created:** `index-backup-may4-before-native-bg.html`

**Next Approach:** Use vis-timeline's native `type: 'background'` items instead of manual overlay (will integrate with vis-timeline's layout system)

**See also:** `DEBUG_CONTEXT.md` for full session log

---

## 🔥 FIREBASE MIGRATION PLAN (May 2026)

**Decision Date:** 2026-05-14
**Status:** APPROVED — Ready for implementation
**Target Users:** Non-technical users working across multiple devices (Windows/Mac/Linux)

### Strategic Decision

**User Requirements:**
1. ✅ All cloud services (OneDrive, Dropbox, iCloud, Google Drive)
2. ✅ Automatic sync (no manual export)
3. ✅ Multi-device simultaneous editing
4. ✅ Non-technical user friendly

**Selected Solution:** Firebase (Google Cloud Infrastructure)

**Why Firebase over self-hosted:**
- ✅ No server hosting/maintenance needed
- ✅ Built-in automatic sync across all devices
- ✅ Built-in offline mode (works without internet, syncs when back online)
- ✅ Generous free tier (1GB storage, 50K reads/day, 20K writes/day)
- ✅ Google-grade reliability and scale
- ✅ Authentication included (Email + Google + Microsoft OAuth)
- ✅ Faster implementation (1 week vs 3-4 weeks for self-hosted)

### Architecture Change

**Current (SQLite + FastAPI):**
```
Electron App → localhost:8765/server.py → timeline.db → File system images
```

**New (Firebase):**
```
Electron App → Firebase SDK → Cloud Firestore + Firebase Storage + Firebase Auth
```

**Key Changes:**
- Remove `server.py` entirely (no localhost server needed)
- Remove `timeline.db` (replaced by Firestore cloud database)
- Replace file-system images with Firebase Storage URLs
- Add user authentication (login/signup screen)
- Add "My Timelines" dashboard

### Data Model Mapping

| Current SQLite Table | Firebase Collection | Notes |
|---|---|---|
| `timelines` | `timelines/{timelineId}` | Top-level documents |
| `people` | `timelines/{id}/people/{personId}` | Subcollection |
| `events` | `timelines/{id}/events/{eventId}` | Subcollection |
| `relationships` | `timelines/{id}/relationships/{relId}` | Subcollection |
| `dependencies` | `timelines/{id}/dependencies/{depId}` | Subcollection |
| `canvas_images` | `timelines/{id}/canvasImages/{imgId}` | Subcollection |
| `places` | `timelines/{id}/places/{placeId}` | Subcollection |
| `arcs` | `timelines/{id}/arcs/{arcId}` | Subcollection |
| `share_links` | `shareLinks/{token}` | Top-level collection |
| (new) | `users/{userId}` | User profiles |

**Why subcollections:**
- Load timeline metadata without loading all events/people (performance)
- Firestore charges per document read (subcollections = granular reads)
- Better scalability for large timelines

### Implementation Phases

**Phase 1: Firebase Setup + SDK (Day 1 — 2 hours)**
- Create Firebase project
- Enable Firestore, Auth, Storage
- Add Firebase SDK CDN scripts to `index.html`
- Enable offline persistence

**Phase 2: Authentication UI (Day 1-2 — 6 hours)**
- `LoginScreen` component (email/password + Google OAuth)
- `auth.onAuthStateChanged()` listener in App
- Show login screen when `!user`

**Phase 3: Replace Database Operations (Day 2-4 — 12 hours)**
- Replace all `fetch('/api/...')` calls with Firestore queries
- Batch writes for save operations (performance)
- Real-time listeners with `.onSnapshot()` (automatic sync)

**Phase 4: Replace Image Storage (Day 3 — 4 hours)**
- Replace file uploads with Firebase Storage `.put()`
- Replace file paths with download URLs
- Update all avatar/event image/canvas image upload points

**Phase 5: Real-Time Sync (Day 4 — 2 hours)**
- Replace `loadTimeline()` with `.onSnapshot()` listeners
- Automatic multi-device sync (no polling needed)

**Phase 6: My Timelines Dashboard (Day 5 — 4 hours)**
- Replace WelcomeScreen with timeline list
- Query `timelines` collection filtered by `userId`
- Real-time updates when timelines change

**Phase 7: Offline Mode (Day 5 — Already works!)**
- `db.enablePersistence()` provides automatic offline mode
- Changes saved to local cache (IndexedDB)
- Auto-syncs when back online
- Add offline/online indicator in toolbar

**Phase 8: Cloud Backup Integration (Day 6 — Optional)**
- Keep existing "Export JSON" button
- Optional: Add "Auto-export to folder" for Dropbox/OneDrive backup
- User picks folder, app auto-exports JSON after every save

### Security Rules (Applied in Firebase Console)

**Firestore Rules:**
```javascript
// Users can only read/write their own timelines
match /timelines/{timelineId} {
  allow read, write: if request.auth != null
    && request.auth.uid == resource.data.userId;

  match /{document=**} {
    allow read, write: if request.auth != null
      && request.auth.uid == get(/databases/$(database)/documents/timelines/$(timelineId)).data.userId;
  }
}
```

**Storage Rules:**
```javascript
match /timelines/{timelineId}/{allPaths=**} {
  allow read: if true; // Images public
  allow write: if request.auth != null;
}
```

### Cost Estimate

**Free Tier (Personal/Small Team):**
- Good for 1-50 active users
- 1 GB storage, 50K reads/day, 20K writes/day
- **Cost: $0/month**

**Paid Tier (Scale):**
- 100 users: ~$0.50/month
- 1,000 users: ~$5/month
- 10,000 users: ~$50/month

### Features to Preserve

**Keep (already compatible with Firebase):**
- ✅ Real-time collaboration (Tier 4 Item 19) — Firestore `.onSnapshot()` is perfect for this
- ✅ Share links (Tier 4 Item 17) — Implement via security rules
- ✅ Version history (Tier 4 Item 18) — Store as subcollection or Cloud Functions
- ✅ All 13 view modes
- ✅ All export formats (PNG, PDF, PPTX, GEDCOM, ICS, JSON, CSV)
- ✅ Template gallery

**Remove:**
- ❌ `server.py` — no longer needed
- ❌ `timeline.db` — replaced by Firestore
- ❌ File system image storage — replaced by Firebase Storage
- ❌ REST API endpoints (Tier 4 Item 28) — can rebuild as Firebase Cloud Functions if needed

### Migration Path for Existing Users

**One-Time Import Tool:**
- File menu → "Import from Local Database…"
- User selects `timeline.db` file
- App reads SQLite database (using `better-sqlite3` in Electron)
- Uploads all data to Firestore under user's account
- Images uploaded to Firebase Storage

### Open Questions / Decisions Needed

**Before implementation starts:**

1. **Microsoft OAuth:** Include "Sign in with Microsoft" button? (Requires Azure app registration, +1 hour setup)

2. **Image strategy:**
   - ✅ All images → Firebase Storage (RECOMMENDED)
   - ❌ Keep local file system (more complex, no benefit)

3. **Version history:** Keep Firestore snapshots or simplify to "Export JSON = backup"?

4. **REST API:** Remove entirely or rebuild as Firebase Cloud Functions later?

5. **Template gallery:** Keep local or move to shared Firestore collection?

6. **Collaboration features:** Keep all real-time features (already Firebase-compatible)?

### Testing Checklist

**Before going live:**
- [ ] Multi-device sync (edit on Windows, see on Mac)
- [ ] Real-time updates (2 devices, same timeline, instant sync)
- [ ] Offline mode (disconnect WiFi, edit, reconnect → syncs)
- [ ] Conflict resolution (edit same field on 2 devices offline → last write wins)
- [ ] Image upload/display across devices
- [ ] Performance with 100 people + 500 events
- [ ] Login/logout/signup flow
- [ ] Windows/Mac/Linux builds all work

### Current Status

**Date:** 2026-05-18
**Phase:** ✅ **ALL PHASES COMPLETE (1-8)** — Firebase migration + cloud backup fully functional
**Implementation Period:** May 15-18, 2026

**Completed Phases:**
- ✅ Phase 1: Firebase SDK + offline persistence
- ✅ Phase 2: LoginScreen + Email/Password + Google OAuth
- ✅ Phase 3: Firestore database migration (8 subcollections)
- ✅ Phase 4: Firebase Storage for images + Offline indicator + Dashboard + dirty-flag fix
- ✅ Phase 5: Real-time sync via `.onSnapshot()` listeners
- ✅ Phase 6: My Timelines Dashboard with counts, colors, delete
- ✅ Phase 7: Offline mode with banner + connection detection
- ✅ Phase 8: Cloud Backup Integration (Electron-only auto-backup to local folder)

**Critical Bugs Fixed:**
- IndexedDB corruption (removed blanket clearPersistence())
- Data persistence failing (proper terminate() on page unload)
- Real-time sync blocked (isRemoteUpdateRef + isLoadingRef pattern)
- Horizontal view unassigned events invisible (added __unassigned__ group)
- Person photo upload missing (implemented in Add/Edit Person modals)

**Cloud Backup Features (Phase 8):**
- Auto-backup to user-selected folder (Dropbox/OneDrive/local)
- Configurable auto-save interval (1/5/10/30 minutes)
- Auto-prune: keep last N backups (5/10/20/50)
- Exit backup on app quit if unsaved changes
- Toolbar indicator shows last backup time
- Electron-only (not available in browser mode)

**Architecture Change Complete:**
- ❌ `server.py` removed
- ❌ `timeline.db` removed
- ❌ File system image storage removed
- ✅ Firebase SDK (9.23.0 compat)
- ✅ Cloud Firestore with offline persistence
- ✅ Firebase Storage (gs://timeline-app-6e2f3.firebasestorage.app)
- ✅ Firebase Authentication (Email + Google)

---

## Next Immediate Step

**Completed this session (2026-09-24):**
- ✅ **MCP Server Setup** — MCP server for Claude Desktop configured and working at `~/Documents/timeline-mcp/`
- ✅ **Project Cleanup** — Old backend files (`server.py`, `timeline.db`) archived to `~/Desktop/Timeline-Archive-20260924/`
- ✅ **Dropbox Optimization** — `dist/` folder excluded from Dropbox sync (saves ~370MB cloud storage)
- ✅ **Documentation Updated** — CLAUDE.md updated to reflect current Firebase architecture and MCP server location

**Firebase Migration Complete (All Phases 1-8)** — App fully cloud-native with automatic sync, offline support, and local backup.

**Ready for:**
- Production testing (multi-device, offline mode, backup restore)
- Electron build update (package with Firebase dependencies)
- User documentation (setup guide, backup instructions)
- Optional: Additional features or UX improvements

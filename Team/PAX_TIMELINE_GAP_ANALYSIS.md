---
prepared_by: PAX
date: 2026-03-28
purpose: Gap analysis — what the timeline app needs to become a world-class "any timeline" tool
---

# Timeline App — Gap Analysis
## What Needs to Be Built to Serve Every Real-World Timeline Use Case

---

## RESEARCH BASIS

This analysis covers:
- All major real-world timeline types (historical, genealogy, medical/legal, project management, journalistic, scientific/geological, military, product roadmap, personal biography, archaeological)
- Feature sets of leading tools: Aeon Timeline, Tiki-Toki, TimelineJS (Knight Lab), Preceden, Office Timeline, Sutori, TrialLine, CaseFleet, ChronoZoom, Timeline Maker Pro, Timestream, SmartDraw, LucidChart, and 15+ others
- Professional-grade requirements: data model depth, export formats, collaboration, accessibility, interoperability

---

## SECTION 1 — DATA MODEL GAPS

These are structural gaps in what the app can represent. Without them, whole classes of timeline use cases are impossible.

### Priority: CRITICAL

**1.1 — Source / Citation system**
Every serious timeline type (genealogy, legal, historical, journalistic, archaeological) requires that each fact be traceable to a source. Currently the app has no source/citation concept.
- Need: per-event source field(s) — title, URL, author, date, page, document type
- Need: source confidence/reliability rating (primary source vs secondary vs unknown)
- Genealogy tools (RootsMagic, Legacy) consider this non-negotiable
- Legal tools (CaseFleet, DISCO Timelines) link every fact directly to its source document

**1.2 — Location / Geography field on events**
Many timeline types are inherently spatial: military campaigns, archaeological sites, immigration routes, news events. The current data model has no location field.
- Need: location name + optional lat/lon coordinates on every event
- Nice-to-have: map view where events appear as pins on a geographic map, filterable by date range

**1.3 — Event confidence / uncertainty flags**
Real historical, genealogical, and archaeological data is often approximate. "Born circa 1840", "Battle occurred sometime in spring 1643" are common.
- Need: per-date uncertainty flag (exact / circa / estimated / unknown / range)
- Need: visual indicator on timeline items that have uncertain dates (e.g. dashed outline, question mark badge)
- Both genealogy software and academic historical tools treat this as standard

**1.4 — Recurring / repeating events**
Project management, medical, and personal timelines routinely need recurring events: annual reviews, weekly treatments, quarterly milestones.
- Need: RRULE-style recurrence (daily / weekly / monthly / yearly / custom interval)
- Need: ability to edit a single instance vs all instances
- Currently completely absent

**1.5 — Event sub-types / specialisation**
Different domains need different event shapes:
- Milestone (single point, no duration) — project management
- Duration/phase (start → end bar) — already present
- Span with uncertainty on either end — genealogy, archaeology
- Instantaneous with consequences (trigger event) — legal, medical
- Background period/era (contextual band) — already partially present as "eras"
- Need a formal `eventType` field so the UI, export, and data model behave appropriately per type

**1.6 — Tags / custom metadata fields**
The current model has fixed fields per entity. Professional tools allow arbitrary key-value metadata per event or person.
- Need: tag system on both people and events (multi-value, filterable, colour-coded)
- Need: custom fields — user-defined attributes (e.g. "Court case number", "Regiment", "Diagnosis code", "Gene variant")
- This is what separates a generic tool from a professional domain tool

**1.7 — Nested / hierarchical events**
Aeon Timeline, and every project management tool, supports parent→child event nesting. A "World War II" event contains "Battle of the Bulge" contains individual skirmishes.
- Need: parentEventId field enabling arbitrary depth nesting
- Need: collapse/expand in all views
- Need: inherit properties (category, colour) from parent unless overridden

**1.8 — Notes / rich-text field per event**
Current description field is plain text. Professional tools provide rich-text or markdown for event notes, supporting formatted summaries, bullet lists, and embedded links.
- Need: markdown-capable description field, rendered on the event detail panel

**1.9 — Multiple timelines / project model**
Currently timelines are isolated files/localStorage entries. There is no concept of:
- Sub-timelines within a project (e.g. story arcs, parallel threads)
- Linking people/events across timelines
- A project container that holds multiple named timelines
- Need: project-level container with multiple named timeline layers or strands

---

## SECTION 2 — TIMELINE TYPE GAPS

The app handles biographical/historical swimlane timelines well. These entire use-case categories are not adequately served:

### Priority: HIGH

**2.1 — Genealogy / Family Tree mode**
Genealogy is one of the largest consumer timeline markets. Required:
- GEDCOM import/export (the universal genealogy standard — virtually every genealogy tool supports it)
- Pedigree chart view (ancestor fan/tree layout)
- Family group view (parents + children as a unit)
- DNA/evidence confidence ratings per fact
- Source citations per vital event (birth, marriage, death)
- Relationship types beyond parent/spouse/influenced: sibling, adoptive parent, step-parent, godparent, co-worker, mentor
- Individual timeline (all events for one person, printable as a research aid)

**2.2 — Project Management / Gantt mode**
The horizontal swimlane view resembles a Gantt chart but lacks critical PM features:
- Task dependencies (finish-to-start, start-to-start, finish-to-finish, lag/lead)
- Critical path calculation and visual highlighting
- Resource/capacity view — who is assigned to what, when
- Milestone tracking with % completion
- Baseline vs actual comparison
- Sprint/phase grouping
- Progress bars on events
- Integration or export to MS Project (.mpp), JIRA, or at minimum CSV with dependency columns

**2.3 — Legal Case / Chronology mode**
Legal professionals need:
- Each event linked to one or more source documents (uploaded PDFs, images)
- Exhibit numbering system
- Party/witness tagging per event
- Issue/claim categorisation (distinct from general categories)
- Privilege/confidentiality flags
- Export to PDF chronology report format (tabular, court-ready)
- Print-optimised chronology table (date | event | source | party)

**2.4 — Medical / Clinical timeline**
Patient and clinical timelines require:
- Event types: symptom onset, diagnosis, procedure, medication, lab result, hospitalization, discharge
- Dosage/value field on medication and lab events (numeric with unit)
- Provider/facility field per event
- Body system / organ category
- Timeline view filtered by one patient (already close to person-centric swimlane, but needs the specialised event types)
- Export as clinical summary PDF
- FHIR-compatible JSON export for EHR integration (future/advanced)

**2.5 — Scientific / Deep Time mode**
Geological, palaeontological, cosmological timelines span millions or billions of years:
- Current `makeYear()` integer system maxes out at human-scale years; needs support for Ma (megayears) and Ga (gigayears) units
- Standard geological epoch/period/era nomenclature (Cambrian, Jurassic, etc.) as a preset era set
- Logarithmic or compressed time axis option (so 4 billion years and 100 years can coexist meaningfully)
- ICS (International Chronostratigraphic Chart) colour palette preset

**2.6 — Journalistic / Storytelling mode**
News organisations and educators need (Knight Lab TimelineJS is the benchmark):
- Slide-based narrative view — one event = one "slide" with large media, headline, and body text
- Embedded video (YouTube, Vimeo) and audio (SoundCloud, mp3) in events — currently only images supported
- Social media embed (tweet, post) as event media
- Title slide / intro slide concept
- Public URL / embeddable iframe export
- Available in 60+ languages (TimelineJS achieves this; app has only English + Afrikaans)

**2.7 — Military History mode**
Military historians need:
- Order of Battle (ORBAT) — unit hierarchy separate from the people hierarchy
- Unit entities (divisions, regiments, battalions) as first-class objects alongside people
- Map integration — campaign maps with geolocated events
- Phase/operation grouping of events
- Casualty/strength data fields per unit event

**2.8 — Roadmap / Product Planning mode**
Product teams need:
- Quarters/sprints as the primary time axis unit (not just raw years)
- OKR / Goal linking — events associated with strategic objectives
- Status field (planned / in progress / done / cancelled / at risk) with colour-coded display
- Owner assignment per event (linking to a person/team)
- Voting or priority score field
- Integration export to CSV format compatible with Aha!, ProductBoard, Linear, or JIRA

---

## SECTION 3 — VISUAL / RENDERING GAPS

**3.1 — Map view**
None of the current 6 views places events geographically. For historical, military, journalistic, and travel timelines this is essential.
- Need: a Map view where events with lat/lon coordinates appear as dated pins on an interactive map
- Libraries: Leaflet.js or Mapbox GL JS

**3.2 — Slide / presentation view**
For journalistic and educational use, a full-screen slide-per-event view (like TimelineJS) is needed.
- Events presented as large cards with dominant media, headline, subheadline, body
- Keyboard/swipe navigation
- This is distinct from the existing Canvas view

**3.3 — Network / relationship graph view**
The Flow view shows ribbons but not a true graph. For complex relationship data (influenced by, connected to, caused):
- Need: force-directed or hierarchical graph where nodes are people/events and edges are relationships
- Useful for literary, biographical, political, and investigative timelines

**3.4 — Table / chronology report view**
Legal, medical, and genealogy users need a paginated, print-ready tabular view:
- Columns: Date | Title | Description | People | Source | Category
- Sortable, filterable
- Exportable directly as PDF (court-ready or clinical-summary format)
- This is different from the DataGrid — it is a read-optimised report, not an edit interface

**3.5 — Thumbnail / gallery summary view**
For media-rich timelines (photo albums, journalistic archives), a thumbnail grid sorted by date:
- Image-dominant layout, date as caption
- Click to open event detail

**3.6 — Logarithmic / compressed time axis**
For deep-time or wide-span timelines:
- Option to switch from linear to logarithmic time axis
- Allows geological + historical + modern events to coexist on one timeline without the modern era being a pixel-thin sliver

**3.7 — Print layout improvements**
- Current print targets the canvas artboard only
- Need: print-optimised layouts for all views (vertical scroll, table/chronology, flow)
- Named paper sizes: A4, A3, US Letter, Legal, plus the existing banner sizes

---

## SECTION 4 — EXPORT / IMPORT GAPS

### Priority: HIGH

**4.1 — Visual export (PNG / PDF) — not yet built**
This is listed as planned but is the most-requested feature in every timeline tool review.
- PNG export of current view at full resolution (use html2canvas or Puppeteer)
- PDF export (jsPDF or Puppeteer headless)
- SVG export for vector-quality print output
- Should work for all views, not just canvas

**4.2 — PowerPoint (.pptx) export — not yet built**
Listed as planned. Critical for business and educational users.
- One slide per event (narrative/slide mode), or
- Single slide showing the full timeline graphic
- Use PptxGenJS (already identified in project notes)

**4.3 — GEDCOM export/import**
Essential for the genealogy market. GEDCOM 5.5.1 and GEDCOM X are the standards.
- Import: parse GEDCOM file, create people + events + relationships
- Export: generate valid GEDCOM from current people + relationships

**4.4 — MS Project / ICS / iCalendar export**
- iCalendar (.ics) export — allows events to be opened in any calendar app (Google Calendar, Apple Calendar, Outlook)
- MS Project XML export — allows Gantt-mode timelines to be opened in project management tools
- RRULE support needed first (gap 1.4) before ICS export is meaningful

**4.5 — Embeddable / shareable timeline**
- Generate a self-contained HTML file for embedding in a website (TimelineJS model)
- Public share link (requires backend — Stage 3)
- Read-only share with no edit access

**4.6 — Import from Wikipedia / Wikidata**
Several tools (ChronoZoom, TimelineJS) can pull events from Wikipedia or Wikidata by topic.
- Paste a Wikipedia URL → app extracts dates and events into a draft timeline
- This is an AI-augmented feature (Claude could do this)

**4.7 — Import from Google Sheets**
TimelineJS's killer feature — Google Sheets as the data source.
- Authenticated connection to a Google Sheet in a defined column format
- Live sync: sheet changes update the timeline
- Requires OAuth, appropriate for Stage 3+

---

## SECTION 5 — COLLABORATION / MULTI-USER GAPS

**5.1 — Real-time collaborative editing**
All leading SaaS tools (Preceden, LucidChart, Venngage, Mural) support simultaneous multi-user editing with live cursors and conflict resolution.
- Requires backend (Stage 3) + WebSocket or CRDT layer
- Not feasible in Stage 1, but the data model should be designed with collaborative IDs from the start

**5.2 — Comments / annotations on events**
Users reviewing a shared timeline need to be able to leave comments on specific events without editing them.
- Comment thread per event
- @mention notifications
- Resolve/close comments

**5.3 — Role-based permissions**
- Owner / Editor / Commenter / Viewer roles per timeline
- View-only shareable link
- Password-protected share

**5.4 — Version history / undo tree**
- Named snapshots ("Version before client review")
- Full undo/redo with named history steps
- Restore to previous version
- Currently only a single localStorage save slot exists per timeline

**5.5 — Audit trail**
Legal and medical timelines require a tamper-evident log of who changed what and when.
- Append-only change log per timeline
- Timestamps and user identity on each change

---

## SECTION 6 — AI / AUTOMATION GAPS

The Claude integration is a strong foundation. These capabilities are missing:

**6.1 — Auto-extract events from text / documents**
Paste or upload a document (biography, news article, case file, medical record) → Claude identifies dates and events and proposes them as a batch add.
- Already partially possible via Claude chat but not structured as a bulk-import workflow

**6.2 — Wikipedia / web research integration**
Ask Claude to research a person or event and populate the timeline from public sources.
- Currently Claude only works with what the user types; it cannot autonomously retrieve and parse external pages

**6.3 — Relationship suggestion**
Claude reviews the current people list and suggests likely relationships (parent/child, contemporaries, influenced by) based on dates and context.

**6.4 — Duplicate detection**
When adding a new person or event, check for near-duplicates in the existing data and warn the user.
- Especially important for large imported datasets (CSV, GEDCOM)

**6.5 — Narrative generation**
Claude writes a prose narrative of the timeline (the "story") suitable for export as PowerPoint speaker notes, a printed booklet, or a website article.
- Already mentioned in project notes as a planned use — needs a dedicated UI trigger and output panel

**6.6 — Smart date parsing from natural language**
Currently `parseDate()` handles structured formats. Need: free-text date parsing.
- "Early 1940s" → circa 1942 ± 3
- "Three years after the coronation" → requires context
- Claude could resolve these inline

---

## SECTION 7 — PERFORMANCE / SCALABILITY GAPS

**7.1 — localStorage is not a production database**
The current storage model will break at scale:
- localStorage cap ~5-10 MB per origin — a single timeline with 50 photos exceeds this
- No indexing, no query capability
- SQLite backend (Stage 3) is planned and should be prioritised
- IndexedDB is a browser-native alternative for before the backend is ready

**7.2 — Image storage strategy**
Base64 images in localStorage/JSON are extremely inefficient:
- A single 800×600 image = ~500 KB base64
- 20 images per timeline = ~10 MB — already at localStorage limit
- Need: file-system storage (Electron) or object storage (web) with only file paths in the data model
- Electron build already exists — use `fs` to write images to a local folder

**7.3 — Large timeline rendering performance**
- vis-timeline can handle thousands of events but performance degrades
- The custom vertical, flow, and thread views are fully custom SVG/HTML — no virtualisation
- Need: virtualised rendering (only render items in the current viewport) for large datasets
- Tested threshold: ~500 events before noticeable slowdown in custom views

**7.4 — Single HTML file architecture ceiling**
The single `index.html` file with all code inline is approaching the limits of maintainability:
- Code is already very large; adding more views and features will make it unmanageable
- Need: migration plan to a proper React project (Vite + component files) — this is a Stage 2 architectural task
- The Electron build exists, so Node.js is now available; no reason to stay single-file

---

## SECTION 8 — UX / USABILITY GAPS

**8.1 — Onboarding / empty state**
New users opening the app see either sample data or a blank canvas. No guided onboarding:
- Step-by-step first-time setup wizard
- Template gallery (choose a timeline type → pre-configured settings, sample structure)
- Video or interactive tutorial

**8.2 — Template library**
No pre-built timeline templates. Leading tools (Office Timeline, Venngage, SmartDraw) offer dozens:
- Historical: World War II, Ancient Rome, Renaissance
- Personal: Life timeline, Wedding planning, Pregnancy
- Business: Product launch, Quarterly roadmap, Project plan
- Educational: Science history, Literature timeline

**8.3 — Drag-to-reschedule events**
Users expect to drag event bars in the horizontal view to move their dates.
- vis-timeline supports this natively via `editable: { updateTime: true }`
- Currently not wired up — events can only be moved via the edit modal

**8.4 — Bulk edit operations**
No way to select multiple events and:
- Change category/colour for all selected
- Move all selected by a time offset
- Delete multiple events at once
- Assign a person to multiple events at once

**8.5 — Keyboard shortcuts**
No keyboard shortcuts currently documented or implemented beyond DataGrid navigation.
- N = New event, P = New person, F = Fit all, Esc = close panel, Delete = delete selected
- Standard power-user expectation

**8.6 — Mobile / responsive layout**
The app is desktop-only. For sharing and viewing:
- Responsive read-only view for mobile (pinch-zoom, swipe)
- The current vis-timeline implementation does not reflow for narrow screens

**8.7 — Accessibility (WCAG 2.1 AA)**
No accessibility audit has been done:
- SVG views (Flow, Thread) have no ARIA labels or screen-reader text
- Colour-coded categories have no non-colour alternative (pattern, icon)
- Keyboard navigation is incomplete outside the DataGrid
- Timeline is unusable for visually impaired users in its current state

**8.8 — Internationalisation (i18n)**
The app has English + Afrikaans in the Help modal only.
- UI labels, button text, date formats, error messages — all hardcoded English
- TimelineJS supports 60+ languages; for a general-purpose tool this matters
- Need: i18n framework (e.g., react-i18next) and at minimum RTL layout support

---

## SECTION 9 — SETTINGS / CONFIGURATION GAPS

**9.1 — Proper Settings modal**
The Settings menu item currently routes to Background Settings. A real settings modal needs:
- Default date format
- Default colour palette
- Default timeline type / view on open
- Autosave interval
- Language selection
- Theme (dark/light/parchment/system)

**9.2 — Category management**
Categories are currently hardcoded (7 fixed categories). Users need:
- Create, rename, delete, reorder categories
- Assign custom colour per category
- Assign an icon per category
- Per-timeline category sets (different projects have different taxonomies)

**9.3 — Custom colour palettes / themes**
Style panels exist per view but there is no global theme system:
- Save a named theme (colours, fonts, spacing)
- Apply a saved theme to any timeline
- Export/import themes

---

## SECTION 10 — INTEGRATION / INTEROPERABILITY GAPS

**10.1 — Calendar sync (Google Calendar, iCal, Outlook)**
Events exported as .ics file — allows viewing timeline events in any calendar app.

**10.2 — Note-taking app sync**
Aeon Timeline's key differentiator is Scrivener sync (for writers).
- Obsidian plugin or export (for researchers and historians)
- Notion CSV compatibility (for product teams)

**10.3 — Cloud storage integration**
- Save/open timelines from Google Drive, Dropbox, OneDrive
- Auto-sync to cloud on save
- Currently only localStorage + manual JSON export

**10.4 — API / webhook**
For power users and teams:
- REST API to create/read/update timeline data programmatically
- Webhook on event change (for integration with Zapier, Make, etc.)

---

## PRIORITISED BUILD ORDER

Based on impact vs effort, recommended sequencing:

### Tier 1 — Foundation (do first, everything else depends on these)
1. SQLite backend + file-system image storage (replaces localStorage)
2. Visual export: PNG + PDF (most-requested missing feature)
3. Source/citation system on events
4. Tags + custom metadata fields
5. Category management (create/edit/delete)

### Tier 2 — Reach new markets
6. PowerPoint (.pptx) export
7. GEDCOM import/export (unlocks genealogy market)
8. Recurring events (unlocks project management + medical)
9. Event dependencies (Gantt mode)
10. Slide/narrative view (unlocks journalistic/educational market)

### Tier 3 — Quality and depth
11. Location field + map view
12. Uncertainty/confidence flags on dates
13. Nested/hierarchical events
14. Drag-to-reschedule in horizontal view
15. Bulk edit operations
16. Table/chronology report view (print-ready)

### Tier 4 — Professional grade
17. Role-based permissions + share links (requires backend)
18. Version history
19. Real-time collaboration (requires WebSocket/CRDT)
20. WCAG 2.1 AA accessibility pass
21. i18n framework + 3+ languages
22. Template library (10+ starter templates)

### Tier 5 — Advanced AI and integrations
23. Auto-extract events from pasted text/documents
24. Wikipedia/Wikidata import via Claude
25. Narrative generation export (prose story from timeline)
26. Google Sheets live sync
27. Calendar sync (.ics export)
28. REST API

---

## WHAT THE BEST TOOLS DO THAT THIS APP DOES NOT (YET)

| Feature | Best-in-class tool | Current app |
|---|---|---|
| Source citations per event | CaseFleet, RootsMagic | Not present |
| GEDCOM import/export | Every genealogy tool | Not present |
| Task dependencies + critical path | MS Project, Asana | Not present |
| Slide/narrative view | TimelineJS, Sutori | Not present |
| Map view | ArcGIS, Histography | Not present |
| Recurring events | Google Calendar, Aeon | Not present |
| Visual export (PNG/PDF) | Every serious tool | Planned, not built |
| Nested events | Aeon Timeline | Not present |
| Collaboration + comments | Preceden, LucidChart | Not present |
| WCAG accessibility | Venngage, LucidChart | Not assessed |
| Template gallery | Office Timeline, Venngage | Not present |
| Custom metadata fields | Aeon Timeline, Timestream | Not present |
| Drag-to-reschedule | vis-timeline (native) | Not wired up |
| Version history | Every SaaS tool | Not present |

---

*Analysis prepared by PAX, LARRY team. Research conducted 2026-03-28.*
*Sources: Preceden.com, Aeon Timeline docs, Knight Lab TimelineJS, CaseFleet, Cambridge Intelligence timeline data modeling guide, GEDCOM Wikipedia, WCAG 2.2 W3C, Martin Fowler recurring events pattern, and 20+ additional tool reviews.*

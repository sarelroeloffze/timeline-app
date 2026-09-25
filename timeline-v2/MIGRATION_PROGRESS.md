# Timeline App - Next.js Migration Progress

**Migration Date:** September 2026  
**Stack:** Next.js 16.3.6 + TypeScript + Tailwind CSS 4 + Firebase + Tauri 2.11.5  
**Goal:** Modernize single-file HTML app to production-ready architecture

---

## Migration Phases

### ✅ Phase 0: Project Setup (Complete)
- [x] Create Next.js 16.3.6 project with TypeScript
- [x] Install dependencies (Firebase, Tailwind, Zustand, etc.)
- [x] Configure Firebase project
- [x] Set up Tauri 2.11.5 desktop wrapper
- [x] Configure TypeScript with strict mode
- [x] Set up ESLint and Prettier

**Files Created:**
- `package.json` - 25 dependencies
- `tsconfig.json` - Strict TypeScript configuration
- `next.config.ts` - Next.js configuration
- `src-tauri/` - Tauri desktop configuration
- `.env.local` - Firebase credentials

---

### ✅ Phase 1: Foundation - Types & Stores (Complete)
- [x] Create complete TypeScript type system
- [x] Set up Zustand stores with persistence
- [x] Auth store for user management
- [x] Timeline store for app state

**Files Created:**
- `src/lib/types/timeline.ts` (250 lines) - Complete type definitions
- `src/lib/stores/useTimelineStore.ts` (280 lines) - Main app state
- `src/lib/stores/useAuthStore.ts` (80 lines) - Authentication state

**Key Types:**
- `Timeline` - Complete timeline with all subcollections
- `Person` - People with birth/death dates, certainty, relationships
- `Event` - Events with 20+ fields (dates, location, sources, custom fields, recurrence)
- `Category`, `Place`, `Arc`, `Marker`, `Era` - Supporting data models
- `Relationship`, `Dependency` - Connections between entities

---

### ✅ Phase 2: Foundation - Utilities (Complete)
- [x] Date handling utilities (BC/AD support)
- [x] Export utilities (PNG, PDF, PPTX, ICS)
- [x] Import utilities (CSV, GEDCOM)
- [x] Helper functions (ID generation, formatting)

**Files Created:**
- `src/lib/utils/date.ts` (350 lines) - BC/AD date parsing and formatting
- `src/lib/utils/export.ts` (400 lines) - Export to PNG, PDF, PPTX, ICS
- `src/lib/utils/import.ts` (350 lines) - CSV and GEDCOM import
- `src/lib/utils/helpers.ts` (150 lines) - Utility functions

**Key Functions:**
- `parseDate()` - Supports "4 BC", "1867-11-07", "25/12/1867", etc.
- `fmtDate()` - Format with BC/AD, signed, or full date modes
- `exportToPNG()`, `exportToPDF()`, `exportToPPTX()` - Visual exports
- `parseGEDCOM()` - Genealogy file import
- `buildICSCalendar()` - Calendar export

---

### ✅ Phase 3: Foundation - Firebase Integration (Complete)
- [x] Firebase configuration with offline persistence
- [x] Firestore CRUD operations
- [x] Firebase Storage for images
- [x] Authentication helpers

**Files Created:**
- `src/lib/firebase/config.ts` (60 lines) - Firebase initialization
- `src/lib/firebase/firestore.ts` (410 lines) - Complete CRUD layer
- `src/lib/firebase/storage.ts` (250 lines) - Image upload/download
- `src/lib/firebase/auth.ts` (120 lines) - Email & Google OAuth

**Key Features:**
- Batch writes for performance
- Real-time subscriptions with `onSnapshot()`
- Offline persistence with IndexedDB
- 8 subcollections (people, events, places, arcs, markers, eras, relationships, dependencies)
- Automatic metadata tracking (createdAt, updatedAt)

---

### 🚧 Phase 4: Components Migration (In Progress - ~60% Complete)

**Progress:**
- [x] Shared UI components (Button, Input, Modal, Loading)
- [x] Authentication components (LoginScreen)
- [x] Dashboard component (My Timelines list)
- [x] Layout components (MenuBar, Toolbar)
- [x] App routing pages (Home, New Timeline, Timeline View)
- [x] View mode components (6 of 13) - Horizontal, Vertical, Data, Flow, Thread, Map ✅
- [x] Panel components (2 of 3) - EventPanel, FilterPanel ✅
- [x] Modal components (9 of 20+) - Add/Edit Person, Add/Edit Event, Help, Export PNG/PDF/PPTX, Import CSV/GEDCOM ✅

**Completed Components (29):**

1. **Shared UI (`src/components/shared/`):**
   - `Button.tsx` - Variants: primary, secondary, danger, ghost
   - `Input.tsx` - With label, error handling, fullWidth
   - `Modal.tsx` - Backdrop, ESC close, size variants
   - `Loading.tsx` - Spinner with sizes, fullScreen mode

2. **Authentication (`src/components/auth/`):**
   - `LoginScreen.tsx` (150 lines) - Email/password + Google OAuth

3. **Dashboard (`src/components/dashboard/`):**
   - `Dashboard.tsx` (210 lines) - Timeline list with cards, delete confirmation

4. **Layout (`src/components/layout/`):**
   - `MenuBar.tsx` (180 lines) - File, Edit, View, Tools, Help menus
   - `Toolbar.tsx` (100 lines) - Search, quick actions, status indicator

5. **Pages (`src/app/`):**
   - `page.tsx` - Home (Login or Dashboard based on auth)
   - `timeline/new/page.tsx` - New timeline form
   - `timeline/[id]/page.tsx` - Full timeline view with HorizontalView, EventPanel, modals

6. **View Components (`src/components/views/`):**
   - `HorizontalView.tsx` (230 lines) - vis-timeline integration, groups, items, zoom controls
   - `VerticalView.tsx` (200 lines) - Card-based vertical timeline with center spine
     - Alternating left/right cards
     - Connecting lines to spine
     - Date markers on spine
     - Sort order toggle (oldest/newest)
     - Zoom controls (50-200%)
     - Click to open EventPanel
   - `DataView.tsx` (280 lines) - Spreadsheet/table view
     - Tabbed interface (Events / People)
     - Sortable columns
     - Inline edit buttons
     - Event count by person
     - Category badges
     - Avatar rendering
     - Empty states
   - `FlowView.tsx` (220 lines) - Vertical flow timeline
     - Chronological card flow with connector lines
     - Sort order toggle (oldest/newest)
     - Zoom controls (50-200%)
     - Category badges and colors
     - People chips with avatars
     - Tag display
     - Click to open EventPanel
   - `ThreadView.tsx` (290 lines) - Horizontal timeline with floating events
     - Events positioned above/below horizontal axis
     - Thread lines connecting cards to axis
     - Greedy row layout algorithm avoids overlaps
     - Date markers on axis
     - Mouse drag panning
     - Zoom controls (50-200%)
     - Category badges and colors
     - Click to open EventPanel
   - `MapView.tsx` (180 lines) - Geographic map view with Leaflet
     - OpenStreetMap tile layer
     - Circle markers for events with coordinates
     - Colored by category
     - Hover tooltips with event details
     - Click markers to open EventPanel
     - Fit All button to show all markers
     - Empty state when no events have locations

7. **Panel Components (`src/components/panels/`):**
   - `EventPanel.tsx` (220 lines) - Slide-in panel showing event details, sources, people, tags

8. **Modal Components (`src/components/modals/`):**
   - `AddPersonModal.tsx` (170 lines) - Form with dates, certainty, color picker
   - `AddEventModal.tsx` (210 lines) - Form with dates, category, people association
   - `EditPersonModal.tsx` (220 lines) - Pre-filled form, delete confirmation
   - `EditEventModal.tsx` (230 lines) - Pre-filled form, delete confirmation

9. **Additional Panels (`src/components/panels/`):**
   - `FilterPanel.tsx` (260 lines) - Slide-in filter panel
     - Filter by people (with search when >10)
     - Filter by categories
     - Filter by tags
     - Select all / none buttons
     - Hidden count badge
     - Clear all filters button

10. **Additional Modals (`src/components/modals/`):**
   - `HelpModal.tsx` (280 lines) - Comprehensive help guide
     - 8 sections: Getting Started, People, Events, Views, Filtering, Dates, Save/Sync, Keyboard
     - Sidebar navigation
     - Formatted content with headings, lists, paragraphs
     - GitHub link in footer
   - `ExportModal.tsx` (200 lines) - PNG/PDF export
     - Format selector (PNG/PDF)
     - Filename input
     - PDF options: orientation, paper size (A4/A3/Letter/Legal)
     - Render scale slider (1-3×)
     - Current view detection
     - Element ID targeting for export
   - `ImportCSVModal.tsx` (270 lines) - CSV import
     - 3-step wizard: Select file → Preview → Complete
     - Import type selector (Events/People)
     - Import mode selector (Merge/Replace)
     - File input with format detection
     - Preview table (first 5 rows)
     - Deduplication by name/title in merge mode
   - `GedcomImportModal.tsx` (290 lines) - GEDCOM genealogy import
     - 3-step wizard: Select file → Preview → Complete
     - Merge/Replace modes
     - Parses INDI (individuals) and FAM (families) records
     - Creates people, relationships, and marriage events
     - Preview stats (people count, relationships, events)
     - Sample people preview (first 5)
   - `PptxExportModal.tsx` (230 lines) - PowerPoint export
     - Two modes: Timeline Slide (single slide) or Story Slides (one per event)
     - Theme selector (Match Timeline/Dark/Light)
     - Options for images and sources (Story mode)
     - Toggle switches for include/exclude features

**Remaining Work:**

**View Components (7 remaining of 13):** ✅ HorizontalView, ✅ VerticalView, ✅ FlowView, ✅ ThreadView, SubwayView, TreeView, RadialView, GanttView, SlideView, ✅ MapView, ReportView, ✅ DataView, CanvasView

**Panel Components (3):** EventPanel, FilterPanel, LeftSidebar

**Modal Components (17+):**
- Person: ✅ AddPersonModal, ✅ EditPersonModal
- Event: ✅ AddEventModal, ✅ EditEventModal
- Data: ✅ ImportCSVModal, ✅ GedcomImportModal, GoogleSheetsModal, WikiImportModal, ExtractModal
- Export: ✅ ExportModal (PNG/PDF), ✅ PptxExportModal, NarrativeModal
- Settings: CategoryManagerModal, FieldDefsModal, BgSettingsModal, EraEditorModal, MarkersModal
- Misc: ✅ HelpModal, VersionHistoryModal, ShareModal, APIModal

---

### ⏳ Phase 5: Routing & Navigation (Not Started)
- [ ] App Router pages for all views
- [ ] Navigation between views
- [ ] Keyboard shortcuts
- [ ] Modal routing

---

### ⏳ Phase 6: Tauri Desktop Integration (Not Started)
- [ ] Window configuration
- [ ] Menu bar integration
- [ ] File system access
- [ ] Auto-update configuration

---

### ⏳ Phase 7: Testing & Feature Parity (Not Started)
- [ ] Test all 13 view modes
- [ ] Test all import/export formats
- [ ] Test real-time collaboration
- [ ] Test offline mode
- [ ] Cross-platform testing (Windows, Mac, Linux)

---

### ⏳ Phase 8: Data Migration & Launch (Not Started)
- [ ] Create migration script (index.html → Firebase)
- [ ] User documentation
- [ ] Build installers for all platforms
- [ ] Deploy to production

---

## Current Status

**Last Updated:** September 24, 2026

**Phase:** 4 (Components Migration)  
**Progress:** ~60% of Phase 4 complete  
**Overall Progress:** ~70% of entire migration

**What's Working Now:**
- ✅ Full authentication flow (login, signup, Google OAuth)
- ✅ Dashboard with timeline list
- ✅ Create new timeline
- ✅ **6 View Modes Working:**
  - **HorizontalView** - vis-timeline swimlane layout, zoom, click events
  - **VerticalView** - card timeline with center spine, alternating layout, zoom 50-200%
  - **DataView** - spreadsheet tables for Events/People, inline edit buttons
  - **FlowView** - vertical flow with connector lines, zoom, sort order
  - **ThreadView** - horizontal timeline with events above/below axis, thread lines, greedy layout
  - **MapView** - Leaflet map with event markers, tooltips, Fit All
- ✅ **EventPanel** - click events to see details, sources, people, tags
- ✅ **FilterPanel** - filter by people, categories, tags with search
- ✅ **Complete CRUD** - Create, Read, Update, Delete for people & events
- ✅ **Add/Edit Modals** - Person and Event forms with validation
- ✅ **HelpModal** - Comprehensive 8-section help guide with sidebar navigation
- ✅ **ExportModal** - PNG/PDF export with scale, orientation, paper size options
- ✅ **PptxExportModal** - PowerPoint export with Timeline/Story modes, theme options
- ✅ **ImportCSVModal** - CSV import for people/events with merge/replace modes, preview, deduplication
- ✅ **GedcomImportModal** - Genealogy import with family relationships, marriage events, preview stats
- ✅ Real-time Firebase sync
- ✅ Save to Firestore
- ✅ View switching (Horizontal ↔ Vertical ↔ Data ↔ Flow ↔ Thread ↔ Map)
- ✅ Export to PNG/PDF/PowerPoint from any view
- ✅ Import from CSV and GEDCOM with preview and validation

**Next Steps:**
1. Add remaining view modes (Subway, Tree, Radial, Gantt, Slide, Report, Canvas)
2. Create additional import modals (Google Sheets, Wikipedia, Extract from Text)
3. Create Settings modal and category manager
4. Create additional export modals (ICS calendar, Narrative)

**Dev Server:** Running at http://localhost:3000  
**Status:** ✅ Compiles successfully, no errors  
**Test:** Timeline view fully interactive with add/view functionality

---

## Technical Decisions

1. **Tauri over Electron:** Lighter, faster, better security
2. **Firebase over self-hosted:** Easier deployment, automatic sync, offline support
3. **Zustand over Redux:** Simpler API, less boilerplate
4. **TypeScript strict mode:** Catch errors at compile time
5. **Migrate everything:** Don't leave features behind, build complete product
6. **Automatic data migration:** Script to move old localStorage data to Firebase

---

## File Structure

```
timeline-v2/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Home (login/dashboard)
│   │   ├── timeline/
│   │   │   ├── new/page.tsx   # New timeline form
│   │   │   └── [id]/page.tsx  # Timeline view
│   │   └── layout.tsx
│   ├── components/
│   │   ├── shared/            # ✅ UI components
│   │   ├── auth/              # ✅ Login screen
│   │   ├── dashboard/         # ✅ Timeline list
│   │   ├── layout/            # ✅ MenuBar, Toolbar
│   │   ├── views/             # ⏳ 13 view components
│   │   ├── panels/            # ⏳ Event, Filter, Sidebar
│   │   └── modals/            # ⏳ 20+ modals
│   └── lib/
│       ├── types/             # ✅ TypeScript definitions
│       ├── stores/            # ✅ Zustand state
│       ├── firebase/          # ✅ Firestore, Storage, Auth
│       └── utils/             # ✅ Date, Export, Import
├── src-tauri/                 # Desktop wrapper config
├── public/                    # Static assets
└── package.json              # Dependencies

✅ = Complete
🚧 = In Progress
⏳ = Not Started
```

---

## Testing Notes

**Build Status:** ✅ Clean build, no TypeScript errors  
**Dev Server:** ✅ Starts in 332ms  
**Firebase:** ✅ Connected and authenticated  
**Auth:** ✅ Email and Google OAuth working  

**To Test:**
```bash
cd timeline-v2
npm run dev          # Development server
npm run build        # Production build
npm run tauri:dev    # Desktop app (development)
npm run tauri:build  # Desktop installer
```

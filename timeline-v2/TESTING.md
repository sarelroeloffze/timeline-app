# Timeline App - Testing Checklist

**Last Updated:** September 25, 2026  
**Migration Phase:** 7 (Testing & Feature Parity)

---

## Test Environment Setup

### Prerequisites
- [x] Node.js installed
- [x] npm dependencies installed
- [ ] Rust toolchain installed (for Tauri builds)
- [x] Firebase project configured
- [x] `.env.local` with Firebase credentials

### Build Status
- [x] TypeScript compilation passes
- [x] Next.js build succeeds
- [x] All 49 components compile without errors
- [ ] Tauri build succeeds (requires Rust)

---

## Component Testing (49 components)

### Shared Components (4/4)
- [ ] `Button.tsx` - Renders with variants, sizes, disabled state
- [ ] `Input.tsx` - Text input, validation, onChange
- [ ] `Modal.tsx` - Open/close, backdrop click, escape key
- [ ] `Loading.tsx` - Spinner displays correctly

### Layout Components (2/2)
- [ ] `MenuBar.tsx` - All menu items clickable, keyboard shortcuts work
- [ ] `Toolbar.tsx` - Search input, action buttons

### Authentication Components (1/1)
- [ ] `LoginScreen.tsx` - Email/password, Google OAuth, signup flow

### Dashboard Component (1/1)
- [ ] `Dashboard.tsx` - Timeline list, create new, search, delete

### View Components (13/13)
- [ ] `HorizontalView.tsx` - vis-timeline renders, zoom/pan, click events
- [ ] `VerticalView.tsx` - Card layout, scrolling, zoom 50-200%
- [ ] `DataView.tsx` - Spreadsheet tables, inline edit buttons
- [ ] `FlowView.tsx` - Flow chart, connector lines, zoom
- [ ] `ThreadView.tsx` - Timeline with thread lines, greedy layout
- [ ] `MapView.tsx` - Leaflet map, markers, tooltips, Fit All
- [ ] `ReportView.tsx` - List view, sorting, grouping
- [ ] `SlideView.tsx` - Slideshow, keyboard nav, filmstrip
- [ ] `CanvasView.tsx` - Artboard, paper sizes, zoom/pan
- [ ] `GanttView.tsx` - Gantt chart, date axis, colored bars
- [ ] `TreeView.tsx` - Family tree, SVG nodes, avatars
- [ ] `RadialView.tsx` - Wheel chart, category inner ring
- [ ] `SubwayView.tsx` - Metro map, person tracks, event stops

### Panel Components (3/3)
- [ ] `EventPanel.tsx` - Event details, sources, people, tags
- [ ] `FilterPanel.tsx` - Filter by people/categories/tags
- [ ] `LeftSidebar.tsx` - Icon rail, slide-out panels, pin/unpin

### Modal Components (22/22)

#### Person & Event Modals (4)
- [ ] `AddPersonModal.tsx` - Form validation, date pickers, color picker
- [ ] `EditPersonModal.tsx` - Pre-filled form, delete confirmation
- [ ] `AddEventModal.tsx` - Date pickers, category select, people chips
- [ ] `EditEventModal.tsx` - Pre-filled form, delete confirmation

#### Import Modals (5)
- [ ] `ImportCSVModal.tsx` - File picker, preview, merge/replace
- [ ] `GedcomImportModal.tsx` - GEDCOM parse, relationships, preview
- [ ] `GoogleSheetsModal.tsx` - URL input, column mapping, auto-sync
- [ ] `WikiImportModal.tsx` - Wikipedia fetch, AI extraction, preview
- [ ] `ExtractModal.tsx` - Text paste, AI extraction, checkbox selection

#### Export Modals (3)
- [ ] `ExportModal.tsx` - PNG/PDF format, scale, orientation
- [ ] `PptxExportModal.tsx` - Timeline/Story modes, theme options
- [ ] `NarrativeModal.tsx` - Tone/length/focus selectors, generate

#### Settings & Management Modals (10)
- [ ] `HelpModal.tsx` - 8 sections, sidebar navigation
- [ ] `SettingsModal.tsx` - Theme, language, auto-save, default view
- [ ] `ShareModal.tsx` - Link/export/email, permission levels
- [ ] `CategoryManagerModal.tsx` - CRUD operations, color picker
- [ ] `FieldDefsModal.tsx` - Custom field management, type selector
- [ ] `BgSettingsModal.tsx` - Solid/gradient/photo, preview
- [ ] `EraEditorModal.tsx` - Timeline eras, year ranges, presets
- [ ] `MarkersModal.tsx` - Calendar markers, style, visibility
- [ ] `VersionHistoryModal.tsx` - List, preview, restore, snapshots
- [ ] `APIModal.tsx` - API keys, webhooks, generate/revoke

---

## Functional Testing

### Authentication Flow
- [ ] Sign up with email/password
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Logout
- [ ] Session persistence across page reload
- [ ] Auth state syncs with Firestore

### Timeline CRUD
- [ ] Create new timeline (blank)
- [ ] Create new timeline (from template)
- [ ] Open existing timeline
- [ ] Save timeline to Firestore
- [ ] Delete timeline
- [ ] Real-time sync between tabs

### People Management
- [ ] Add person with all fields
- [ ] Edit person
- [ ] Delete person
- [ ] Upload person photo
- [ ] Person appears in all views
- [ ] Person filters work

### Event Management
- [ ] Add event with all fields
- [ ] Edit event
- [ ] Delete event
- [ ] Add event images (multiple)
- [ ] Add event sources
- [ ] Add event tags
- [ ] Add event custom fields
- [ ] Event appears in all views
- [ ] Event filters work

### Relationships & Dependencies
- [ ] Add person relationship (parent/spouse/influenced)
- [ ] Relationships show in Flow/Tree views
- [ ] Add event dependency (fs/ss/ff)
- [ ] Dependencies show in Gantt view
- [ ] Critical path calculation

### Import/Export

#### Import Formats
- [ ] CSV import (people)
- [ ] CSV import (events)
- [ ] GEDCOM import (genealogy)
- [ ] JSON import (timeline backup)
- [ ] Google Sheets sync
- [ ] Wikipedia import
- [ ] Extract from text

#### Export Formats
- [ ] JSON export (full timeline)
- [ ] PNG export (current view)
- [ ] PDF export (current view, multiple paper sizes)
- [ ] PowerPoint export (Timeline + Story modes)
- [ ] ICS calendar export
- [ ] Narrative text export

### View Mode Switching
- [ ] Switch between all 13 view modes
- [ ] View state persists in URL (?view=horizontal)
- [ ] Each view renders without errors
- [ ] Zoom/pan controls work in each view
- [ ] Click events open EventPanel in each view

### Filtering & Search
- [ ] Filter by people
- [ ] Filter by categories
- [ ] Filter by tags
- [ ] Filter by status
- [ ] Global text search
- [ ] Filters persist across view changes
- [ ] Clear all filters

### Keyboard Shortcuts
- [ ] Ctrl+S (Save)
- [ ] Ctrl+N (New Timeline)
- [ ] Ctrl+O (Open)
- [ ] Ctrl+1-9 (Switch views)
- [ ] Ctrl+Shift+P (Add Person)
- [ ] Ctrl+Shift+E (Add Event)
- [ ] Ctrl+Z (Undo)
- [ ] Ctrl+/ (Shortcuts help)
- [ ] Escape (Close panels)

### Tauri Desktop Features
- [ ] Native menu bar works
- [ ] File dialogs (open/save/directory)
- [ ] File system read/write
- [ ] Menu actions trigger React handlers
- [ ] Window title updates
- [ ] Window size persists

---

## Firebase Integration Testing

### Firestore
- [ ] Timeline create/read/update/delete
- [ ] People subcollection CRUD
- [ ] Events subcollection CRUD
- [ ] Real-time listeners (onSnapshot)
- [ ] Batch writes for performance
- [ ] Offline persistence (IndexedDB)
- [ ] Sync after reconnection

### Firebase Storage
- [ ] Person photo upload
- [ ] Event image upload (multiple)
- [ ] Image download URLs
- [ ] Image deletion

### Firebase Auth
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Google OAuth login
- [ ] User state persistence
- [ ] Auth state change listeners

---

## Performance Testing

### Load Testing
- [ ] Timeline with 100 people loads quickly
- [ ] Timeline with 500 events loads quickly
- [ ] Timeline with 1000 events loads quickly
- [ ] Image-heavy timeline (50+ images) loads

### Real-time Performance
- [ ] Real-time updates appear < 1 second
- [ ] No UI freeze during sync
- [ ] Offline changes sync when online

### View Rendering
- [ ] Horizontal view renders 1000 events
- [ ] Vertical view scrolls smoothly
- [ ] Map view handles 100+ markers
- [ ] Gantt view renders complex dependencies

---

## Error Handling

### Network Errors
- [ ] Offline mode works
- [ ] Reconnection syncs data
- [ ] Error messages for failed saves
- [ ] Retry logic for failed operations

### Validation Errors
- [ ] Required field validation
- [ ] Date format validation
- [ ] Circular dependency detection
- [ ] Duplicate detection in imports

### Edge Cases
- [ ] Empty timeline
- [ ] Timeline with no people
- [ ] Timeline with no events
- [ ] Event with no dates
- [ ] Person with no birth/death dates
- [ ] BC/AD date edge cases (year 0, negative years)

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers (if responsive design added)
- [ ] iOS Safari
- [ ] Android Chrome

---

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements keyboard-accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Escape key closes modals

### Screen Reader Testing
- [ ] Semantic HTML structure
- [ ] ARIA labels on controls
- [ ] Form labels associated
- [ ] Live regions for dynamic content

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Interactive elements have sufficient contrast
- [ ] Dark mode maintains contrast

---

## Security Testing

### Authentication
- [ ] Passwords not stored in localStorage
- [ ] Auth tokens secure
- [ ] Session timeout works
- [ ] Logout clears session

### Data Validation
- [ ] XSS protection (no script injection)
- [ ] SQL injection not applicable (Firestore)
- [ ] File upload size limits
- [ ] File type restrictions

### Firestore Security Rules
- [ ] Users can only read their own timelines
- [ ] Users can only write their own timelines
- [ ] Unauthenticated users blocked

---

## Status Summary

**Total Components:** 49  
**Components Tested:** 0  
**Tests Passing:** 0  
**Tests Failing:** 0  
**Not Yet Tested:** 49

**Functional Tests:** 0/100+  
**Integration Tests:** 0/20+  
**Performance Tests:** 0/10+  
**Security Tests:** 0/10+

**Overall Testing Progress:** 0%

---

## Next Steps

1. Install Rust toolchain for Tauri builds
2. Start Next.js dev server
3. Test authentication flow (login/signup)
4. Test dashboard (timeline list)
5. Test creating new timeline
6. Test all 13 view modes systematically
7. Test import/export formats
8. Test Firebase real-time sync
9. Build Tauri desktop app
10. Cross-platform testing

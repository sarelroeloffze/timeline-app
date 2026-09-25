# Timeline App - Next.js Migration

A visual timeline builder with rich media support, real-time collaboration, and 13 different visualization modes.

**Stack:** Next.js 16.3.6 + TypeScript + Tailwind CSS 4 + Firebase + Tauri 2.11.5  
**Status:** 93% Complete (Phase 7 - Testing)

---

## Features

### 13 View Modes
- **Horizontal** - vis-timeline swimlane with zoom/pan
- **Vertical** - Card timeline with center spine
- **Data** - Spreadsheet tables (Events/People)
- **Flow** - Vertical flow chart with connectors
- **Thread** - Events above/below axis with thread lines
- **Map** - Leaflet map with event markers
- **Report** - Detailed list with sorting/grouping
- **Slides** - Presentation slideshow
- **Canvas** - Printable artboard with paper sizes
- **Gantt** - Project Gantt chart
- **Tree** - Family tree genealogy view
- **Radial** - Circular wheel chart
- **Subway** - Metro map style

### Import Formats
- CSV (People & Events)
- GEDCOM (Genealogy)
- JSON (Timeline backup)
- Google Sheets (Live sync)
- Wikipedia (AI extraction)
- Text (AI extraction)

### Export Formats
- JSON (Full timeline)
- PNG (Visual export)
- PDF (Multiple paper sizes)
- PowerPoint (.pptx)
- ICS Calendar
- Narrative Text

### Firebase Integration
- Real-time sync across devices
- Offline mode with IndexedDB
- User authentication (Email + Google OAuth)
- Cloud storage for images
- Automatic backups

### Desktop Features (Tauri)
- Native menu bar
- File system access
- Native dialogs
- Keyboard shortcuts
- Cross-platform (Windows/Mac/Linux)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Rust toolchain (for desktop builds)
- Firebase project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sarelroeloffze/timeline-app.git
cd timeline-app/timeline-v2
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
Create `.env.local` with your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Desktop Build (Tauri)

1. **Install Rust** (if not already installed)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. **Run Tauri dev build**
```bash
npm run tauri:dev
```

3. **Build production installer**
```bash
npm run tauri:build
```

---

## Development

### Available Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build production Next.js app
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run tauri:dev` - Run Tauri desktop app (dev mode)
- `npm run tauri:build` - Build Tauri installers

### Project Structure

```
timeline-v2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Dashboard
│   │   ├── timeline/
│   │   │   ├── [id]/page.tsx  # Timeline view (dynamic route)
│   │   │   └── new/page.tsx   # New timeline
│   ├── components/
│   │   ├── layout/            # MenuBar, Toolbar
│   │   ├── modals/            # 22 modal components
│   │   ├── panels/            # EventPanel, FilterPanel, LeftSidebar
│   │   ├── shared/            # Button, Input, Modal, Loading
│   │   └── views/             # 13 view mode components
│   ├── lib/
│   │   ├── firebase/          # Firestore, Storage, Auth
│   │   ├── hooks/             # useKeyboardShortcuts, useMenuListener
│   │   ├── stores/            # Zustand stores (Auth, Timeline)
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Date, Export, Import, Tauri helpers
│   └── styles/
│       └── globals.css        # Tailwind styles
├── src-tauri/                 # Tauri desktop wrapper
│   ├── src/
│   │   ├── lib.rs            # Main Tauri app
│   │   ├── menu.rs           # Native menu bar
│   │   └── commands.rs       # File system commands
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── MIGRATION_PROGRESS.md     # Migration status (93%)
├── TESTING.md                # Test checklist (200+ tests)
└── package.json
```

### Key Files

- **Type System**: `src/lib/types/timeline.ts` (250 lines)
- **Timeline Store**: `src/lib/stores/useTimelineStore.ts` (280 lines)
- **Firebase Integration**: `src/lib/firebase/firestore.ts` (410 lines)
- **Timeline Page**: `src/app/timeline/[id]/page.tsx` (700 lines)

---

## Architecture

### Frontend (Next.js 16 + React 19)
- App Router with dynamic routes
- TypeScript strict mode
- Tailwind CSS 4 for styling
- Zustand for state management

### Backend (Firebase)
- Cloud Firestore (NoSQL database)
- Firebase Storage (image hosting)
- Firebase Authentication (Email + OAuth)
- Real-time listeners with `onSnapshot()`
- Offline persistence (IndexedDB)

### Desktop (Tauri 2)
- Native system menu
- File system access
- Native dialogs (open/save/directory)
- Keyboard shortcuts
- Cross-platform builds

### Data Model
```typescript
Timeline {
  id: string
  name: string
  userId: string
  categories: Category[]
  people: Person[]        // Subcollection
  events: Event[]         // Subcollection
  places: Place[]         // Subcollection
  arcs: Arc[]            // Subcollection
  markers: Marker[]      // Subcollection
  eras: Era[]            // Subcollection
  relationships: Relationship[]  // Subcollection
  dependencies: Dependency[]     // Subcollection
}
```

---

## Testing

See [TESTING.md](./TESTING.md) for complete test checklist.

**Test Coverage:**
- 49 component render tests
- 100+ functional tests
- 20+ integration tests
- 10+ performance tests
- 10+ security tests

**Run Tests:**
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build
```

---

## Migration Status

**Overall Progress: 93%**

- ✅ Phase 0: Project Setup (100%)
- ✅ Phase 1: Types & Stores (100%)
- ✅ Phase 2: Utilities (100%)
- ✅ Phase 3: Firebase Integration (100%)
- ✅ Phase 4: Components (100% - 49 components)
- ✅ Phase 5: Routing & Navigation (100%)
- ✅ Phase 6: Tauri Desktop Integration (100%)
- ⏳ Phase 7: Testing & Feature Parity (10%)
- ⏳ Phase 8: Data Migration & Launch (0%)

See [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) for detailed progress.

---

## Contributing

This is a migration from a single-file HTML app to a modern Next.js architecture.

**Before contributing:**
1. Read [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md)
2. Check [TESTING.md](./TESTING.md) for test requirements
3. Ensure TypeScript compilation passes: `npx tsc --noEmit`
4. Follow existing code patterns (see `src/components` for examples)

---

## License

Proprietary - All Rights Reserved

---

## Original App

The original Timeline app was a single-file HTML application (1.4 MB) with:
- 28 Tier system features (all implemented)
- Firebase integration
- 13 view modes
- 7 import formats
- 6 export formats
- Real-time collaboration
- Offline mode

This Next.js migration preserves all original features while modernizing the architecture for better maintainability, performance, and scalability.

**Migration started:** September 2026  
**Current phase:** Testing & Feature Parity

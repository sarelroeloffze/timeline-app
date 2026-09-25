# Contributing to Timeline App

Thank you for your interest in contributing to the Timeline App Next.js migration!

---

## Project Status

**Current Phase:** 7 (Testing & Feature Parity)  
**Overall Progress:** 93%  
**Active Development:** Yes

This is an active migration from a single-file HTML app (1.4 MB) to a modern Next.js architecture. All original features are being preserved while modernizing the codebase.

---

## Before You Start

1. **Read the documentation:**
   - [README.md](./README.md) - Project overview and setup
   - [MIGRATION_PROGRESS.md](./MIGRATION_PROGRESS.md) - Detailed migration status
   - [TESTING.md](./TESTING.md) - Test checklist and requirements

2. **Understand the architecture:**
   - Frontend: Next.js 16.3.6 + React 19 + TypeScript
   - State: Zustand stores
   - Styling: Tailwind CSS 4
   - Backend: Firebase (Firestore + Storage + Auth)
   - Desktop: Tauri 2.11.5

3. **Check existing patterns:**
   - Component structure: See `src/components/`
   - Type definitions: See `src/lib/types/`
   - Utilities: See `src/lib/utils/`

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)
- Rust toolchain (for Tauri builds)

### Installation

1. Fork and clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/timeline-app.git
cd timeline-app/timeline-v2
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` with Firebase credentials
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the dev server
```bash
npm run dev
```

5. Verify the build
```bash
npm run build
```

---

## Code Standards

### TypeScript

- **Use strict mode** - All code must pass `npx tsc --noEmit`
- **Explicit types** - No `any` types unless absolutely necessary
- **Import types correctly**:
  ```typescript
  import type { Timeline, Person, Event } from '@/lib/types';
  ```
- **Use type inference** where obvious:
  ```typescript
  const [count, setCount] = useState(0); // Not useState<number>(0)
  ```

### React Components

- **Use functional components** with hooks
- **Use 'use client'** directive for client components
- **Export through index.ts** barrel files:
  ```typescript
  // src/components/modals/index.ts
  export * from './AddPersonModal';
  export * from './AddEventModal';
  ```
- **Props interface naming**:
  ```typescript
  interface AddPersonModalProps {
    open: boolean;
    onClose: () => void;
  }
  ```

### File Naming

- Components: `PascalCase.tsx` (e.g., `AddPersonModal.tsx`)
- Utilities: `camelCase.ts` (e.g., `dateUtils.ts`)
- Types: `camelCase.ts` (e.g., `timeline.ts`)
- Hooks: `use*.ts` (e.g., `useKeyboardShortcuts.ts`)

### Code Organization

```
src/
├── app/              # Next.js pages (App Router)
├── components/       # React components
│   ├── layout/      # Layout components
│   ├── modals/      # Modal dialogs
│   ├── panels/      # Side panels
│   ├── shared/      # Shared/reusable components
│   └── views/       # View mode components
├── lib/
│   ├── firebase/    # Firebase integration
│   ├── hooks/       # Custom React hooks
│   ├── stores/      # Zustand stores
│   ├── types/       # TypeScript types
│   └── utils/       # Utility functions
└── styles/          # Global CSS
```

### Styling

- **Use Tailwind CSS** for all styling
- **Avoid inline styles** unless dynamic
- **Use utility classes** over custom CSS
- **Dark mode first** - All UI should work in dark mode
- **Responsive design** - Mobile-friendly where applicable

Example:
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  Save
</button>
```

---

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions

### Commit Messages

Follow this format:
```
Brief one-line summary (50 chars max)

- Detailed description (if needed)
- What changed and why
- Any breaking changes

Co-Authored-By: Your Name <email@example.com>
```

Examples:
```
Add WikiImportModal with AI extraction

- Created 3-step wizard for Wikipedia import
- Integrated with Claude API for extraction
- Added 13 language support
- Includes duplicate detection
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Write code following standards above
   - Add/update tests in TESTING.md
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Type check
   npx tsc --noEmit
   
   # Lint
   npm run lint
   
   # Build
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

6. **Create a Pull Request**
   - Describe what you changed and why
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

---

## Component Development

### Creating a New Component

1. **Create the component file**
   ```bash
   # Example: New modal component
   touch src/components/modals/MyNewModal.tsx
   ```

2. **Use this template**:
   ```tsx
   'use client';
   
   import { useState } from 'react';
   import { Modal, Button } from '@/components/shared';
   
   interface MyNewModalProps {
     open: boolean;
     onClose: () => void;
     onSave?: (data: MyData) => void;
   }
   
   export function MyNewModal({ open, onClose, onSave }: MyNewModalProps) {
     const [data, setData] = useState<MyData>({ /* ... */ });
   
     const handleSave = () => {
       onSave?.(data);
       onClose();
     };
   
     return (
       <Modal open={open} onClose={onClose} title="My New Modal">
         {/* Modal content */}
         <div className="space-y-4">
           {/* Form fields */}
         </div>
         
         <div className="flex justify-end gap-2 mt-6">
           <Button variant="secondary" onClick={onClose}>
             Cancel
           </Button>
           <Button onClick={handleSave}>
             Save
           </Button>
         </div>
       </Modal>
     );
   }
   ```

3. **Export from index.ts**
   ```typescript
   // src/components/modals/index.ts
   export * from './MyNewModal';
   ```

4. **Import in parent component**
   ```typescript
   import { MyNewModal } from '@/components/modals';
   ```

5. **Add to TESTING.md**
   - Add component to test checklist
   - List what needs to be tested

---

## Testing Guidelines

### Before Submitting a PR

- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Component renders without errors
- [ ] Functionality works as expected
- [ ] No console errors in browser
- [ ] Responsive design tested (if applicable)
- [ ] Dark mode tested
- [ ] Updated TESTING.md with new tests

### Manual Testing

1. Start dev server: `npm run dev`
2. Navigate to your component/feature
3. Test all interactions
4. Check browser console for errors
5. Test edge cases (empty state, errors, etc.)

---

## Common Tasks

### Adding a New View Mode

1. Create component in `src/components/views/`
2. Add to view type in `src/lib/types/timeline.ts`
3. Export from `src/components/views/index.ts`
4. Import in `src/app/timeline/[id]/page.tsx`
5. Add menu item in `src-tauri/src/menu.rs`
6. Add case in `handleMenuAction`
7. Add tests to TESTING.md

### Adding a New Modal

1. Create component in `src/components/modals/`
2. Export from `src/components/modals/index.ts`
3. Import in timeline page
4. Add state: `const [showModal, setShowModal] = useState(false);`
5. Add menu action case
6. Render modal with props
7. Add tests to TESTING.md

### Adding a Firebase Collection

1. Define type in `src/lib/types/timeline.ts`
2. Add CRUD functions in `src/lib/firebase/firestore.ts`
3. Add to timeline store in `src/lib/stores/useTimelineStore.ts`
4. Update save/load functions
5. Test offline persistence

---

## Getting Help

- **Questions?** Open a GitHub Discussion
- **Bugs?** Open a GitHub Issue
- **Ideas?** Open a GitHub Issue with `enhancement` label
- **Stuck?** Check existing issues or ask in Discussions

---

## Code of Conduct

- Be respectful and constructive
- Follow coding standards
- Test your changes
- Document new features
- Help others learn

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Thank You!

Every contribution helps make Timeline App better. Whether it's:
- Fixing a typo
- Adding a test
- Building a feature
- Improving docs

Your work is appreciated! 🎉

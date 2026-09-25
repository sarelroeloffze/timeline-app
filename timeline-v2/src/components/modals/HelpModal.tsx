'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
**Creating Your First Timeline:**
1. Click "+ New Timeline" from the dashboard
2. Enter a timeline name
3. Add people using the "+ Person" button
4. Add events using the "+ Event" button
5. View your timeline in different modes using the View menu

**Navigation:**
- Use the menu bar at the top for all major actions
- The toolbar provides quick access to common tasks
- Click events to see details in the Event Panel
- Use keyboard shortcuts for faster work
    `,
  },
  {
    id: 'people',
    title: 'Managing People',
    content: `
**Adding People:**
- Click "+ Person" in the toolbar or menu
- Enter name, birth/death dates (supports BC dates like "4 BC")
- Set date certainty: Exact, c. (circa), est. (estimated), or ? (unknown)
- Choose a color for the person
- Add a role/description

**Editing People:**
- Click "Edit" in the Data view
- Or open EventPanel and click a person's name
- All fields can be updated
- Delete option available (with confirmation)
    `,
  },
  {
    id: 'events',
    title: 'Managing Events',
    content: `
**Adding Events:**
- Click "+ Event" in the toolbar or menu
- Enter title and start date (required)
- Optional: end date for date ranges
- Select a category
- Add description, associate with people
- Set date certainty for both dates

**Editing Events:**
- Click an event on the timeline
- Click "Edit Event" in the Event Panel
- Or use "Edit" button in Data view
- Delete option available (with confirmation)
    `,
  },
  {
    id: 'views',
    title: 'View Modes',
    content: `
**Horizontal Timeline (vis-timeline):**
- Swimlane layout, one row per person
- Zoom with Ctrl+Scroll or +/- buttons
- Pan by dragging
- Click events to see details

**Vertical Timeline:**
- Card-based layout with center spine
- Alternating left/right cards
- Zoom from 50% to 200%
- Toggle sort order (oldest/newest first)

**Data View:**
- Spreadsheet-style tables
- Separate tabs for Events and People
- Inline editing
- Export-ready format

*More views coming soon: Flow, Thread, Subway, Tree, Radial, Gantt, Slide, Map, Report*
    `,
  },
  {
    id: 'filtering',
    title: 'Filtering & Search',
    content: `
**Filter Panel:**
- Click "🔍 Filters" in the toolbar
- Filter by People (with search when >10)
- Filter by Categories
- Filter by Tags
- Use "All on" / "All off" buttons
- Clear all filters at once

**Search:**
- Use the search box in the toolbar
- Searches event titles, descriptions, people names
- Real-time filtering as you type
    `,
  },
  {
    id: 'dates',
    title: 'Date Formats',
    content: `
**Supported Formats:**
- BC dates: "4 BC", "33 BC"
- AD years: "1867", "2024"
- Full dates: "14/03/1879", "1879-03-14"
- Mixed: "25/12/4 BC"

**Date Certainty:**
- Exact: Known precise date
- c. (circa): Approximate date
- est. (estimated): Educated guess
- ? (unknown): Date uncertain

**Display:**
Dates show with certainty indicators in all views.
    `,
  },
  {
    id: 'save-sync',
    title: 'Saving & Sync',
    content: `
**Automatic Sync:**
- Changes save automatically to Firebase
- Real-time sync across devices
- Works offline, syncs when back online
- Green "Saved ✓" indicator confirms saves

**Manual Save:**
- Use File → Save (⌘S)
- Or toolbar save button
- Creates a save point in Firebase

**Firebase Storage:**
All your data is securely stored in Google's Firebase cloud infrastructure.
    `,
  },
  {
    id: 'keyboard',
    title: 'Keyboard Shortcuts',
    content: `
**File Operations:**
- ⌘N / Ctrl+N - New Timeline
- ⌘O / Ctrl+O - Open Timeline
- ⌘S / Ctrl+S - Save

**Adding:**
- ⌘⇧P - Add Person
- ⌘⇧E - Add Event

**Navigation:**
- ⌘F / Ctrl+F - Open Filters
- Escape - Close panels/modals

**Timeline:**
- Ctrl+Scroll - Zoom (Horizontal view)
- Drag - Pan timeline
    `,
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState('getting-started');

  const activeSectionData = HELP_SECTIONS.find((s) => s.id === activeSection);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Feature Guide" size="xl">
      <div className="flex gap-6 h-[600px]">
        {/* Sidebar */}
        <div className="w-56 border-r border-gray-700 pr-4 overflow-y-auto">
          <nav className="space-y-1">
            {HELP_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeSectionData && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {activeSectionData.title}
              </h2>
              <div className="prose prose-invert prose-sm max-w-none">
                {activeSectionData.content.split('\n').map((line, idx) => {
                  const trimmed = line.trim();

                  // Headings
                  if (trimmed.startsWith('**') && trimmed.endsWith(':**')) {
                    return (
                      <h3 key={idx} className="text-lg font-semibold text-indigo-400 mt-6 mb-3">
                        {trimmed.slice(2, -3)}
                      </h3>
                    );
                  }

                  // Bold text
                  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    return (
                      <p key={idx} className="text-white font-semibold mt-4 mb-2">
                        {trimmed.slice(2, -2)}
                      </p>
                    );
                  }

                  // List items
                  if (trimmed.startsWith('-')) {
                    return (
                      <li key={idx} className="text-gray-300 ml-4">
                        {trimmed.slice(1).trim()}
                      </li>
                    );
                  }

                  // Numbered list items
                  if (/^\d+\./.test(trimmed)) {
                    return (
                      <li key={idx} className="text-gray-300 ml-4">
                        {trimmed.replace(/^\d+\.\s*/, '')}
                      </li>
                    );
                  }

                  // Italic text (wrapped in *)
                  if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
                    return (
                      <p key={idx} className="text-gray-400 italic mt-2">
                        {trimmed.slice(1, -1)}
                      </p>
                    );
                  }

                  // Regular paragraphs
                  if (trimmed.length > 0) {
                    return (
                      <p key={idx} className="text-gray-300 mb-3">
                        {trimmed}
                      </p>
                    );
                  }

                  // Empty lines
                  return <div key={idx} className="h-2" />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
        <p>Timeline App v2.0 • Built with Next.js, Firebase & Tauri</p>
        <p className="mt-1">
          Need more help? Visit{' '}
          <a
            href="https://github.com/sarelroeloffze/timeline-app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </Modal>
  );
}

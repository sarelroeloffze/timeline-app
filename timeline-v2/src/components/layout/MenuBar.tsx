'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';

interface MenuBarProps {
  onAction: (action: string) => void;
}

type MenuItem =
  | { type: 'separator' }
  | { label: string; action: string; shortcut?: string; disabled?: boolean };

export function MenuBar({ onAction }: MenuBarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentTimeline = useTimelineStore((state) => state.currentTimeline);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleAction = (action: string) => {
    setActiveMenu(null);
    onAction(action);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const menus: Array<{ name: string; items: MenuItem[] }> = [
    {
      name: 'File',
      items: [
        { label: 'New Timeline', action: 'new', shortcut: '⌘N' },
        { label: 'Open...', action: 'open', shortcut: '⌘O' },
        { label: 'Save', action: 'save', shortcut: '⌘S' },
        { type: 'separator' },
        { label: 'Import CSV...', action: 'importCsv' },
        { type: 'separator' },
        { label: 'Export to PNG...', action: 'exportPng' },
        { label: 'Export to PDF...', action: 'exportPdf' },
        { label: 'Export to PowerPoint...', action: 'exportPptx' },
        { type: 'separator' },
        { label: 'Back to Dashboard', action: 'dashboard' },
      ],
    },
    {
      name: 'Edit',
      items: [
        { label: 'Undo', action: 'undo', shortcut: '⌘Z', disabled: true },
        { label: 'Redo', action: 'redo', shortcut: '⌘⇧Z', disabled: true },
        { type: 'separator' },
        { label: 'Add Person', action: 'addPerson', shortcut: '⌘⇧P' },
        { label: 'Add Event', action: 'addEvent', shortcut: '⌘⇧E' },
      ],
    },
    {
      name: 'View',
      items: [
        { label: 'Horizontal Timeline', action: 'viewHorizontal' },
        { label: 'Vertical Timeline', action: 'viewVertical' },
        { label: 'Flow View', action: 'viewFlow' },
        { label: 'Thread View', action: 'viewThread' },
        { label: 'Subway View', action: 'viewSubway' },
        { label: 'Tree View', action: 'viewTree' },
        { label: 'Radial View', action: 'viewRadial' },
        { label: 'Gantt View', action: 'viewGantt' },
        { label: 'Slide View', action: 'viewSlide' },
        { label: 'Map View', action: 'viewMap' },
        { label: 'Report View', action: 'viewReport' },
        { label: 'Data View', action: 'viewData' },
        { type: 'separator' },
        { label: 'Filters...', action: 'filters', shortcut: '⌘F' },
      ],
    },
    {
      name: 'Tools',
      items: [
        { label: 'Manage Categories...', action: 'manageCategories' },
        { label: 'Calendar Markers...', action: 'markers' },
        { label: 'Settings...', action: 'settings' },
      ],
    },
    {
      name: 'Help',
      items: [
        { label: 'Help & Feature Guide', action: 'help', shortcut: '?' },
        { label: 'About Timeline', action: 'about' },
        { type: 'separator' },
        { label: 'Sign Out', action: 'signOut' },
      ],
    },
  ];

  return (
    <div
      ref={menuRef}
      className="bg-gray-900 border-b border-gray-800 px-4 h-10 flex items-center gap-1"
    >
      {menus.map((menu) => (
        <div key={menu.name} className="relative">
          <button
            onClick={() => handleMenuClick(menu.name)}
            className={`px-3 py-1 text-sm rounded hover:bg-gray-800 transition-colors ${
              activeMenu === menu.name ? 'bg-gray-800 text-white' : 'text-gray-300'
            }`}
          >
            {menu.name}
          </button>

          {activeMenu === menu.name && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[200px] py-1 z-50">
              {menu.items.map((item, idx) => {
                if ('type' in item && item.type === 'separator') {
                  return <div key={idx} className="h-px bg-gray-700 my-1" />;
                }

                // Type narrowing: item is now definitely a menu action
                const menuItem = item as { label: string; action: string; shortcut?: string; disabled?: boolean };

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (menuItem.action === 'signOut') {
                        handleSignOut();
                      } else {
                        handleAction(menuItem.action);
                      }
                    }}
                    disabled={menuItem.disabled}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
                      menuItem.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span>{menuItem.label}</span>
                    {menuItem.shortcut && (
                      <span className="text-xs text-gray-500 ml-4">
                        {menuItem.shortcut}
                      </span>
                    )}
                  </button>
                );
              }
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {currentTimeline && (
            <span className="text-gray-500">{currentTimeline.name}</span>
          )}
          <span>•</span>
          <span>{user.email}</span>
        </div>
      )}
    </div>
  );
}

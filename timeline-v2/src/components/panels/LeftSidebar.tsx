'use client';

import { useState } from 'react';

type PanelType = 'search' | 'people' | 'places' | 'arcs' | null;

interface LeftSidebarProps {
  activePanel: PanelType;
  onChangePanel: (panel: PanelType) => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export function LeftSidebar({
  activePanel,
  onChangePanel,
  isPinned,
  onTogglePin,
}: LeftSidebarProps) {
  const panels = [
    { id: 'search' as const, icon: '🔍', label: 'Search' },
    { id: 'people' as const, icon: '👥', label: 'People' },
    { id: 'places' as const, icon: '📍', label: 'Places' },
    { id: 'arcs' as const, icon: '🎭', label: 'Arcs' },
  ];

  const handlePanelClick = (panelId: PanelType) => {
    if (activePanel === panelId) {
      onChangePanel(null);
    } else {
      onChangePanel(panelId);
    }
  };

  return (
    <div className="relative flex h-full">
      {/* Icon rail */}
      <div className="w-11 bg-gray-800 border-r border-gray-700 flex flex-col">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => handlePanelClick(panel.id)}
            className={`w-11 h-11 flex items-center justify-center text-xl transition-colors ${
              activePanel === panel.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={panel.label}
            aria-label={panel.label}
            aria-pressed={activePanel === panel.id}
          >
            {panel.icon}
          </button>
        ))}
      </div>

      {/* Slide-out panel */}
      {activePanel && (
        <div
          className={`absolute left-11 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 shadow-xl ${
            isPinned ? 'relative' : 'absolute'
          }`}
          style={{ zIndex: 40 }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">
              {panels.find((p) => p.id === activePanel)?.label}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={onTogglePin}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                title={isPinned ? 'Unpin panel' : 'Pin panel'}
                aria-label={isPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {isPinned ? '📌' : '📍'}
              </button>
              {!isPinned && (
                <button
                  onClick={() => onChangePanel(null)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  title="Close panel"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Panel content */}
          <div className="p-3 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
            {activePanel === 'search' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type to search..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="text-xs text-gray-500 text-center py-8">
                  Search across people, events, places, and arcs
                </div>
              </div>
            )}

            {activePanel === 'people' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search people..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 mb-2"
                />
                <div className="text-xs text-gray-500 text-center py-8">
                  People list will appear here
                </div>
              </div>
            )}

            {activePanel === 'places' && (
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors">
                  + Add Place
                </button>
                <div className="text-xs text-gray-500 text-center py-8">
                  No places yet
                </div>
              </div>
            )}

            {activePanel === 'arcs' && (
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors">
                  + Add Arc
                </button>
                <div className="text-xs text-gray-500 text-center py-8">
                  No arcs yet
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close panel when unpinned */}
      {activePanel && !isPinned && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => onChangePanel(null)}
          aria-label="Close panel overlay"
        />
      )}
    </div>
  );
}

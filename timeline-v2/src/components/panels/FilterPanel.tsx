'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenPeople: Set<string>;
  hiddenCategories: Set<string>;
  hiddenTags: Set<string>;
  onTogglePerson: (personId: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

export function FilterPanel({
  isOpen,
  onClose,
  hiddenPeople,
  hiddenCategories,
  hiddenTags,
  onTogglePerson,
  onToggleCategory,
  onToggleTag,
  onClearAll,
}: FilterPanelProps) {
  const { people, categories, events } = useTimelineStore();
  const [searchPeople, setSearchPeople] = useState('');

  if (!isOpen) return null;

  // Get all unique tags from events
  const allTags = Array.from(
    new Set(events.flatMap((e) => e.tags || []))
  ).sort();

  // Filter people by search
  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchPeople.toLowerCase())
  );

  const hiddenCount = hiddenPeople.size + hiddenCategories.size + hiddenTags.size;

  const handleSelectAllPeople = () => {
    people.forEach((p) => {
      if (hiddenPeople.has(p.id)) {
        onTogglePerson(p.id);
      }
    });
  };

  const handleDeselectAllPeople = () => {
    people.forEach((p) => {
      if (!hiddenPeople.has(p.id)) {
        onTogglePerson(p.id);
      }
    });
  };

  const handleSelectAllCategories = () => {
    categories.forEach((c) => {
      if (hiddenCategories.has(c.name)) {
        onToggleCategory(c.name);
      }
    });
  };

  const handleDeselectAllCategories = () => {
    categories.forEach((c) => {
      if (!hiddenCategories.has(c.name)) {
        onToggleCategory(c.name);
      }
    });
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 shadow-2xl z-30 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          {hiddenCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">
              {hiddenCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* People Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">People</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllPeople}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                All
              </button>
              <button
                onClick={handleDeselectAllPeople}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                None
              </button>
            </div>
          </div>

          {people.length > 10 && (
            <input
              type="text"
              placeholder="Search people..."
              value={searchPeople}
              onChange={(e) => setSearchPeople(e.target.value)}
              className="w-full px-3 py-1.5 mb-3 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <div className="space-y-2">
            {filteredPeople.map((person) => (
              <label
                key={person.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/30 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!hiddenPeople.has(person.id)}
                  onChange={() => onTogglePerson(person.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                  style={{ backgroundColor: person.color }}
                >
                  {person.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <span className="text-sm text-gray-300">{person.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Categories</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllCategories}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                All
              </button>
              <button
                onClick={handleDeselectAllCategories}
                className="text-xs text-gray-500 hover:text-gray-400"
              >
                None
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/30 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!hiddenCategories.has(cat.name)}
                  onChange={() => onToggleCategory(cat.name)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-gray-300">
                  {cat.icon} {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Tags</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    hiddenTags.has(tag)
                      ? 'bg-gray-700 text-gray-500 line-through'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {hiddenCount > 0 && (
        <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
          <button
            onClick={onClearAll}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

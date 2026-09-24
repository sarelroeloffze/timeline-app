'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { Button } from '@/components/shared';

interface ToolbarProps {
  onAction: (action: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Toolbar({ onAction, searchQuery = '', onSearchChange }: ToolbarProps) {
  const currentTimeline = useTimelineStore((state) => state.currentTimeline);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 h-12 flex items-center gap-3">
      {/* Timeline Name */}
      {currentTimeline && (
        <div className="font-semibold text-white text-sm">
          {currentTimeline.name}
        </div>
      )}

      {/* Search Box */}
      <div className="flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search events, people, places..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('addPerson')}
          title="Add Person (⌘⇧P)"
        >
          + Person
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('addEvent')}
          title="Add Event (⌘⇧E)"
        >
          + Event
        </Button>

        <div className="w-px h-6 bg-gray-700" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('filters')}
          title="Filters (⌘F)"
        >
          🔍 Filters
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('claude')}
          title="AI Assistant"
        >
          🤖 Claude
        </Button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>
    </div>
  );
}

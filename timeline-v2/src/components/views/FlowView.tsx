'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface FlowViewProps {
  onEventClick?: (eventId: string) => void;
}

export function FlowView({ onEventClick }: FlowViewProps) {
  const { events, people, categories } = useTimelineStore();
  const [zoom, setZoom] = useState(100);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedEvents = [...events].sort((a, b) => {
    const aDate = typeof a.date_start === 'number' ? a.date_start : new Date(a.date_start).getFullYear();
    const bDate = typeof b.date_start === 'number' ? b.date_start : new Date(b.date_start).getFullYear();
    return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
  });

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in flow view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-flow" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Flow View</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
            >
              {sortOrder === 'asc' ? '↓ Oldest First' : '↑ Newest First'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            −
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(100)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Flow Content */}
      <div className="flex-1 overflow-auto p-8">
        <div
          style={{
            zoom: `${zoom}%`,
            minWidth: '100%',
          }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {sortedEvents.map((event, idx) => {
              const category = categories.find((c) => c.name === event.category);
              const eventPeople = event.peopleIds
                ? people.filter((p) => event.peopleIds!.includes(p.id))
                : [];

              return (
                <div
                  key={event.id}
                  className="relative"
                >
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-indigo-500/30" />
                  )}

                  {/* Event card */}
                  <div
                    onClick={() => onEventClick?.(event.id)}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all shadow-lg hover:shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {category && (
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                            style={{
                              backgroundColor: category.color + '33',
                              color: category.color,
                              border: `1px solid ${category.color}`,
                            }}
                          >
                            {category.icon} {category.name}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-white">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-400 mb-3">
                      {event.date_end && event.date_end !== event.date_start
                        ? `${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)} – ${fmtDate(event.date_end, 'bcad', event.dateEndCertainty)}`
                        : fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                        {event.description}
                      </p>
                    )}

                    {/* People */}
                    {eventPeople.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {eventPeople.map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded text-xs"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: person.color }}
                            >
                              {person.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-300">{person.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

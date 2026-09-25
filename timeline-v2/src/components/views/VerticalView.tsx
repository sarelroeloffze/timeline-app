'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';
import type { Event } from '@/lib/types';

interface VerticalViewProps {
  onEventClick?: (eventId: string) => void;
}

export function VerticalView({ onEventClick }: VerticalViewProps) {
  const { events, people, categories } = useTimelineStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [zoom, setZoom] = useState(100);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const aDate = typeof a.date_start === 'number' ? a.date_start : new Date(a.date_start).getFullYear();
    const bDate = typeof b.date_start === 'number' ? b.date_start : new Date(b.date_start).getFullYear();
    return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
  });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  return (
    <div id="tl-view-vertical" className="flex-1 flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        >
          {sortOrder === 'asc' ? '↓ Oldest' : '↑ Newest'}
        </button>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            −
          </button>
          <span className="px-3 text-sm text-gray-400">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors ml-2"
          >
            Reset
          </button>
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-400">
          {events.length} events • {people.length} people
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto bg-gray-950 p-8">
        <div
          className="max-w-4xl mx-auto"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div className="relative">
            {/* Center spine */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-indigo-600/30 -translate-x-1/2" />

            {/* Events */}
            <div className="space-y-12">
              {sortedEvents.map((event, idx) => {
                const category = categories.find((c) => c.name === event.category);
                const eventPeople = event.people
                  ? people.filter((p) => event.people!.includes(p.id))
                  : [];

                const isLeft = idx % 2 === 0;

                return (
                  <div key={event.id} className="relative">
                    {/* Dot on spine */}
                    <div className="absolute left-1/2 top-8 w-4 h-4 rounded-full bg-indigo-600 border-4 border-gray-950 -translate-x-1/2 z-10" />

                    {/* Card */}
                    <div
                      className={`relative ${
                        isLeft ? 'pr-[52%]' : 'pl-[52%]'
                      }`}
                    >
                      <div
                        onClick={() => onEventClick?.(event.id)}
                        className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all shadow-xl group"
                      >
                        {/* Date */}
                        <div className="text-sm font-semibold mb-2" style={{ color: category?.color || '#6366f1' }}>
                          {fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                          {event.date_end && event.date_end !== event.date_start && (
                            <> – {fmtDate(event.date_end, 'bcad', event.dateEndCertainty)}</>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                          {event.title}
                        </h3>

                        {/* Category */}
                        {category && (
                          <div className="mb-3">
                            <span
                              className="inline-block px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: category.color + '33',
                                color: category.color,
                                border: `1px solid ${category.color}`,
                              }}
                            >
                              {category.icon} {category.name}
                            </span>
                          </div>
                        )}

                        {/* Description */}
                        {event.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                            {event.description}
                          </p>
                        )}

                        {/* People */}
                        {eventPeople.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            {eventPeople.slice(0, 3).map((person) => (
                              <div
                                key={person.id}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                                style={{ backgroundColor: person.color }}
                                title={person.name}
                              >
                                {person.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            ))}
                            {eventPeople.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{eventPeople.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{event.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Connecting line to spine */}
                      <div
                        className={`absolute top-8 w-8 h-0.5 bg-indigo-600/50 ${
                          isLeft ? 'right-0' : 'left-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
              <p className="text-gray-400">Add some events to see them on the timeline</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

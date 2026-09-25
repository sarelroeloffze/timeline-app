'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface GanttViewProps {
  onEventClick?: (eventId: string) => void;
}

export function GanttView({ onEventClick }: GanttViewProps) {
  const { events, people, categories } = useTimelineStore();
  const [zoom, setZoom] = useState(100);

  // Calculate date range
  const { minDate, maxDate, dateRange } = useMemo(() => {
    if (events.length === 0) return { minDate: 0, maxDate: 0, dateRange: 1 };

    const dates = events.map((e) => {
      const d = typeof e.date_start === 'number' ? e.date_start : new Date(e.date_start).getFullYear();
      return d;
    });
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return { minDate: min, maxDate: max, dateRange: max - min || 1 };
  }, [events]);

  // Convert date to X position
  const dateToX = (date: number | string): number => {
    const d = typeof date === 'number' ? date : new Date(date).getFullYear();
    return ((d - minDate) / dateRange) * 800;
  };

  // Group events by person
  const groupedEvents = useMemo(() => {
    const groups: { [personId: string]: typeof events } = {};
    const unassigned: typeof events = [];

    events.forEach((event) => {
      if (event.peopleIds && event.peopleIds.length > 0) {
        event.peopleIds.forEach((personId) => {
          if (!groups[personId]) groups[personId] = [];
          groups[personId].push(event);
        });
      } else {
        unassigned.push(event);
      }
    });

    if (unassigned.length > 0) {
      groups['__unassigned__'] = unassigned;
    }

    return groups;
  }, [events]);

  // Calculate bar dimensions
  const barHeight = 24;
  const rowHeight = 60;
  const labelWidth = 200;
  const chartWidth = 900;

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in Gantt view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-gantt" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Gantt View</span>
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

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto">
        <div
          style={{
            zoom: `${zoom}%`,
            minWidth: `${labelWidth + chartWidth}px`,
          }}
        >
          {/* Header */}
          <div className="flex bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
            <div
              className="flex-shrink-0 px-4 py-2 font-semibold text-gray-300 border-r border-gray-700"
              style={{ width: `${labelWidth}px` }}
            >
              Person / Event
            </div>
            <div className="flex-1 relative" style={{ minWidth: `${chartWidth}px` }}>
              {/* Date axis */}
              <div className="flex items-center h-full px-4">
                {Array.from({ length: 11 }).map((_, i) => {
                  const date = minDate + Math.floor((dateRange / 10) * i);
                  const x = dateToX(date);
                  return (
                    <div
                      key={i}
                      className="absolute text-xs text-gray-400"
                      style={{ left: `${x}px`, top: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      {date > 0 ? date : `${Math.abs(date)} BC`}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rows */}
          {Object.entries(groupedEvents).map(([personId, personEvents]) => {
            const person =
              personId === '__unassigned__' ? null : people.find((p) => p.id === personId);
            const personName = person ? person.name : 'Unassigned';

            return (
              <div key={personId}>
                {/* Person Header */}
                <div className="flex bg-gray-800/50 border-b border-gray-700">
                  <div
                    className="flex-shrink-0 px-4 py-2 font-medium text-gray-200 border-r border-gray-700 flex items-center gap-2"
                    style={{ width: `${labelWidth}px` }}
                  >
                    {person && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{personName}</span>
                  </div>
                  <div className="flex-1" style={{ minWidth: `${chartWidth}px` }} />
                </div>

                {/* Events for this person */}
                {personEvents.map((event) => {
                  const category = categories.find((c) => c.name === event.category);
                  const startX = dateToX(event.date_start);
                  const endX = event.date_end
                    ? dateToX(event.date_end)
                    : startX + 20; // Default width for point events

                  return (
                    <div key={event.id} className="flex border-b border-gray-700/50">
                      <div
                        className="flex-shrink-0 px-4 py-2 text-sm text-gray-400 border-r border-gray-700 truncate"
                        style={{ width: `${labelWidth}px` }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                      <div
                        className="flex-1 relative"
                        style={{ height: `${rowHeight}px`, minWidth: `${chartWidth}px` }}
                      >
                        {/* Grid lines */}
                        {Array.from({ length: 11 }).map((_, i) => {
                          const x = dateToX(minDate + Math.floor((dateRange / 10) * i));
                          return (
                            <div
                              key={i}
                              className="absolute bg-gray-700/30"
                              style={{
                                left: `${x}px`,
                                top: 0,
                                bottom: 0,
                                width: '1px',
                              }}
                            />
                          );
                        })}

                        {/* Event bar */}
                        <div
                          onClick={() => onEventClick?.(event.id)}
                          className="absolute cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2"
                          style={{
                            left: `${startX}px`,
                            width: `${Math.max(endX - startX, 20)}px`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: `${barHeight}px`,
                            backgroundColor: category?.color || '#6366f1',
                            borderRadius: '4px',
                          }}
                          title={`${event.title} · ${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}`}
                        >
                          <span className="text-xs text-white font-medium truncate">
                            {event.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

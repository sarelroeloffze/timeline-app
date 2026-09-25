'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface SubwayViewProps {
  onEventClick?: (eventId: string) => void;
}

export function SubwayView({ onEventClick }: SubwayViewProps) {
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
    return ((d - minDate) / dateRange) * 900;
  };

  // Assign each person to a track (horizontal line)
  const personTracks = useMemo(() => {
    const tracks: { [personId: string]: number } = {};
    people.forEach((person, idx) => {
      tracks[person.id] = idx;
    });
    return tracks;
  }, [people]);

  const trackHeight = 80;
  const svgHeight = people.length * trackHeight + 100;

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🚇</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in subway view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-subway" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Subway View</span>
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

      {/* Subway Content */}
      <div className="flex-1 overflow-auto p-8">
        <svg
          width={1100}
          height={svgHeight}
          style={{ zoom: `${zoom}%` }}
          className="mx-auto"
        >
          {/* Person tracks (horizontal lines) */}
          {people.map((person, idx) => {
            const y = idx * trackHeight + 50;
            const personEvents = events.filter((e) => e.peopleIds?.includes(person.id));

            return (
              <g key={person.id}>
                {/* Track line */}
                <line
                  x1={50}
                  y1={y}
                  x2={1000}
                  y2={y}
                  stroke={person.color}
                  strokeWidth={4}
                  opacity={0.6}
                />

                {/* Person label */}
                <text x={10} y={y + 5} fill={person.color} fontSize={12} fontWeight="bold">
                  {person.name}
                </text>

                {/* Event stops on this track */}
                {personEvents.map((event) => {
                  const category = categories.find((c) => c.name === event.category);
                  const x = dateToX(event.date_start) + 50;

                  return (
                    <g key={event.id}>
                      {/* Stop circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={8}
                        fill={category?.color || person.color}
                        stroke="#1f2937"
                        strokeWidth={2}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onEventClick?.(event.id)}
                      >
                        <title>{`${event.title} · ${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}`}</title>
                      </circle>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Date axis at bottom */}
          {Array.from({ length: 11 }).map((_, i) => {
            const date = minDate + Math.floor((dateRange / 10) * i);
            const x = dateToX(date) + 50;
            const y = svgHeight - 30;

            return (
              <g key={i}>
                <line x1={x} y1={30} x2={x} y2={y} stroke="#374151" strokeWidth={1} opacity={0.3} />
                <text x={x} y={y + 15} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                  {date > 0 ? date : `${Math.abs(date)} BC`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

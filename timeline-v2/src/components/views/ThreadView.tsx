'use client';

import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface ThreadViewProps {
  onEventClick?: (eventId: string) => void;
}

export function ThreadView({ onEventClick }: ThreadViewProps) {
  const { events, people, categories, eras } = useTimelineStore();
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🧵</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in thread view</p>
        </div>
      </div>
    );
  }

  // Calculate date range
  const dates = events.map(e => {
    const d = typeof e.date_start === 'number' ? e.date_start : new Date(e.date_start).getFullYear();
    return d;
  });
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  // Convert date to X position
  const dateToX = (date: number | string): number => {
    const d = typeof date === 'number' ? date : new Date(date).getFullYear();
    return ((d - minDate) / dateRange) * 800;
  };

  // Layout events to avoid overlap (greedy row assignment)
  const layoutEvents = () => {
    const sortedEvents = [...events].sort((a, b) => {
      const aDate = typeof a.date_start === 'number' ? a.date_start : new Date(a.date_start).getFullYear();
      const bDate = typeof b.date_start === 'number' ? b.date_start : new Date(b.date_start).getFullYear();
      return aDate - bDate;
    });

    const rows: Array<{ maxX: number; above: boolean }> = [];
    const layout: Array<{ event: typeof events[0]; x: number; row: number; above: boolean }> = [];

    sortedEvents.forEach(event => {
      const x = dateToX(event.date_start);
      const cardWidth = 200;

      // Try to find an available row
      let assignedRow = -1;
      let above = true;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].maxX < x - 10) { // 10px gap
          assignedRow = i;
          above = rows[i].above;
          break;
        }
      }

      if (assignedRow === -1) {
        // Create new row, alternate above/below
        assignedRow = rows.length;
        above = assignedRow % 2 === 0;
        rows.push({ maxX: x + cardWidth, above });
      } else {
        rows[assignedRow].maxX = x + cardWidth;
      }

      layout.push({ event, x, row: assignedRow, above });
    });

    return layout;
  };

  const layout = layoutEvents();

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFitAll = () => {
    setZoom(100);
    setPanX(0);
  };

  return (
    <div id="tl-view-thread" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Thread View</span>
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
            onClick={handleFitAll}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            Fit All
          </button>
        </div>
      </div>

      {/* Thread Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${panX}px, 0) scale(${zoom / 100})`,
            transformOrigin: 'left center',
            width: '1000px',
            height: '100%',
            position: 'relative',
            paddingLeft: '100px',
            paddingRight: '100px',
          }}
        >
          {/* Horizontal axis line */}
          <div
            className="absolute bg-indigo-600"
            style={{
              left: '0',
              right: '0',
              top: '50%',
              height: '3px',
              transform: 'translateY(-50%)',
            }}
          />

          {/* Date markers */}
          {Array.from({ length: Math.min(10, dateRange + 1) }).map((_, i) => {
            const date = minDate + Math.floor((dateRange / 9) * i);
            const x = dateToX(date);
            return (
              <div key={i} style={{ position: 'absolute', left: `${x}px`, top: '50%' }}>
                <div className="w-2 h-2 bg-indigo-400 rounded-full" style={{ transform: 'translate(-50%, -50%)' }} />
                <div className="text-xs text-gray-400 mt-4" style={{ transform: 'translateX(-50%)' }}>
                  {date > 0 ? date : `${Math.abs(date)} BC`}
                </div>
              </div>
            );
          })}

          {/* Events */}
          {layout.map(({ event, x, row, above }, idx) => {
            const category = categories.find(c => c.name === event.category);
            const eventPeople = event.peopleIds ? people.filter(p => event.peopleIds!.includes(p.id)) : [];
            const yOffset = (row + 1) * 120;

            return (
              <div key={event.id} style={{ position: 'absolute', left: `${x}px`, top: '50%' }}>
                {/* Thread line */}
                <div
                  className="absolute bg-gray-600"
                  style={{
                    left: '50%',
                    width: '2px',
                    height: `${yOffset}px`,
                    top: above ? `-${yOffset}px` : '0',
                    transform: 'translateX(-50%)',
                  }}
                />

                {/* Event card */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event.id);
                  }}
                  className="absolute bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all shadow-lg"
                  style={{
                    width: '200px',
                    top: above ? `-${yOffset + 80}px` : `${yOffset}px`,
                    left: '-100px',
                  }}
                >
                  {category && (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                      style={{
                        backgroundColor: category.color + '33',
                        color: category.color,
                        border: `1px solid ${category.color}`,
                      }}
                    >
                      {category.icon} {category.name}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                    {event.title}
                  </h4>
                  <div className="text-xs text-gray-400 mb-1">
                    {fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {eventPeople.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {eventPeople.slice(0, 3).map(person => (
                        <div
                          key={person.id}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: person.color }}
                          title={person.name}
                        >
                          {person.name.charAt(0).toUpperCase()}
                        </div>
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
  );
}

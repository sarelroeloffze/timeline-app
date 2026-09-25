'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface RadialViewProps {
  onEventClick?: (eventId: string) => void;
}

export function RadialView({ onEventClick }: RadialViewProps) {
  const { events, categories } = useTimelineStore();
  const [zoom, setZoom] = useState(100);

  // Group events by category
  const groupedByCategory = useMemo(() => {
    const groups: { [category: string]: typeof events } = {};
    events.forEach((event) => {
      const cat = event.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(event);
    });
    return groups;
  }, [events]);

  const categoryNames = Object.keys(groupedByCategory);
  const centerX = 400;
  const centerY = 400;
  const innerRadius = 80;
  const categoryRingWidth = 60;
  const eventRingWidth = 200;

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">☀️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in radial view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-radial" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Radial View</span>
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

      {/* Radial Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <svg
          width={800}
          height={800}
          style={{ zoom: `${zoom}%` }}
          className="mx-auto"
        >
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="#1f2937"
            stroke="#4b5563"
            strokeWidth={2}
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            fill="#d1d5db"
            fontSize={14}
            fontWeight="bold"
          >
            {events.length}
          </text>
          <text
            x={centerX}
            y={centerY + 16}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={11}
          >
            events
          </text>

          {/* Category rings */}
          {categoryNames.map((catName, catIdx) => {
            const category = categories.find((c) => c.name === catName);
            const catColor = category?.color || '#6366f1';
            const catEvents = groupedByCategory[catName];

            const anglePerCategory = (2 * Math.PI) / categoryNames.length;
            const startAngle = catIdx * anglePerCategory;
            const endAngle = startAngle + anglePerCategory;

            // Category ring arc
            const innerRingRadius = innerRadius + 10;
            const outerRingRadius = innerRingRadius + categoryRingWidth;

            const largeArcFlag = anglePerCategory > Math.PI ? 1 : 0;

            const x1 = centerX + innerRingRadius * Math.cos(startAngle);
            const y1 = centerY + innerRingRadius * Math.sin(startAngle);
            const x2 = centerX + outerRingRadius * Math.cos(startAngle);
            const y2 = centerY + outerRingRadius * Math.sin(startAngle);
            const x3 = centerX + outerRingRadius * Math.cos(endAngle);
            const y3 = centerY + outerRingRadius * Math.sin(endAngle);
            const x4 = centerX + innerRingRadius * Math.cos(endAngle);
            const y4 = centerY + innerRingRadius * Math.sin(endAngle);

            const pathD = `
              M ${x1} ${y1}
              L ${x2} ${y2}
              A ${outerRingRadius} ${outerRingRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
              L ${x4} ${y4}
              A ${innerRingRadius} ${innerRingRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
            `;

            // Category label
            const labelAngle = startAngle + anglePerCategory / 2;
            const labelRadius = innerRingRadius + categoryRingWidth / 2;
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);

            return (
              <g key={catName}>
                {/* Category arc */}
                <path d={pathD} fill={catColor} fillOpacity={0.4} stroke={catColor} strokeWidth={1} />

                {/* Category label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {catName}
                </text>
              </g>
            );
          })}

          {/* Event segments */}
          {categoryNames.map((catName, catIdx) => {
            const category = categories.find((c) => c.name === catName);
            const catColor = category?.color || '#6366f1';
            const catEvents = groupedByCategory[catName];

            const anglePerCategory = (2 * Math.PI) / categoryNames.length;
            const catStartAngle = catIdx * anglePerCategory;
            const anglePerEvent = anglePerCategory / catEvents.length;

            const eventInnerRadius = innerRadius + categoryRingWidth + 20;

            return catEvents.map((event, eventIdx) => {
              const eventStartAngle = catStartAngle + eventIdx * anglePerEvent;
              const eventEndAngle = eventStartAngle + anglePerEvent;

              const innerR = eventInnerRadius;
              const outerR = innerR + eventRingWidth;

              const largeArcFlag = anglePerEvent > Math.PI ? 1 : 0;

              const x1 = centerX + innerR * Math.cos(eventStartAngle);
              const y1 = centerY + innerR * Math.sin(eventStartAngle);
              const x2 = centerX + outerR * Math.cos(eventStartAngle);
              const y2 = centerY + outerR * Math.sin(eventStartAngle);
              const x3 = centerX + outerR * Math.cos(eventEndAngle);
              const y3 = centerY + outerR * Math.sin(eventEndAngle);
              const x4 = centerX + innerR * Math.cos(eventEndAngle);
              const y4 = centerY + innerR * Math.sin(eventEndAngle);

              const pathD = `
                M ${x1} ${y1}
                L ${x2} ${y2}
                A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x3} ${y3}
                L ${x4} ${y4}
                A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x1} ${y1}
              `;

              return (
                <g key={event.id}>
                  <path
                    d={pathD}
                    fill={catColor}
                    fillOpacity={0.7}
                    stroke="#1f2937"
                    strokeWidth={1}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onEventClick?.(event.id)}
                  >
                    <title>{`${event.title} · ${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}`}</title>
                  </path>
                </g>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
}

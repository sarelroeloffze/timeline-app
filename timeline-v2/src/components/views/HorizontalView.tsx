'use client';

import { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';
import type { Event, Person } from '@/lib/types';

interface HorizontalViewProps {
  onEventClick?: (eventId: string) => void;
  onAddEvent?: () => void;
}

export function HorizontalView({ onEventClick, onAddEvent }: HorizontalViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const visTimelineRef = useRef<Timeline | null>(null);

  const { people, events, categories } = useTimelineStore();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!timelineRef.current) return;

    // Create groups (one per person + unassigned)
    const groups = [
      { id: '__unassigned__', content: 'Unassigned', style: 'border-left: 4px solid #666' },
      ...people.map((person) => ({
        id: person.id,
        content: getPersonLabel(person),
        style: `border-left: 4px solid ${person.color}`,
      })),
    ];

    // Create items from events
    const items = events.flatMap((event) => {
      if (event.people && event.people.length > 0) {
        // Create one item per associated person
        return event.people.map((personId) => createVisItem(event, personId));
      } else {
        // Unassigned event
        return [createVisItem(event, '__unassigned__')];
      }
    });

    // Configure timeline options
    const options = {
      height: '100%',
      orientation: 'top',
      stack: true,
      zoomKey: 'ctrlKey',
      zoomMin: 1000 * 60 * 60 * 24 * 365, // 1 year
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 2100, // 2100 years
      moveable: true,
      zoomable: true,
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
      },
    };

    // Create or update timeline
    if (!visTimelineRef.current) {
      visTimelineRef.current = new Timeline(timelineRef.current, items, groups, options);

      // Event handlers
      visTimelineRef.current.on('select', (properties) => {
        if (properties.items.length > 0) {
          const itemId = properties.items[0];
          // Extract event ID (format: eventId or eventId_personId)
          const eventId = itemId.split('_')[0];
          setSelectedEventId(eventId);
          onEventClick?.(eventId);
        }
      });

      visTimelineRef.current.on('doubleClick', (properties) => {
        if (!properties.item) {
          // Double-click on empty space - add new event
          onAddEvent?.();
        }
      });
    } else {
      visTimelineRef.current.setItems(items);
      visTimelineRef.current.setGroups(groups);
    }

    return () => {
      // Don't destroy on every update, only on unmount
    };
  }, [people, events, categories, onEventClick, onAddEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (visTimelineRef.current) {
        visTimelineRef.current.destroy();
        visTimelineRef.current = null;
      }
    };
  }, []);

  function getPersonLabel(person: Person): string {
    const initials = person.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `<span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:${person.color};color:white;text-align:center;line-height:32px;font-weight:bold;font-size:12px;">${initials}</span>`;
  }

  function createVisItem(event: Event, groupId: string) {
    const category = categories.find((c) => c.name === event.category);
    const color = category?.color || '#666';

    // Determine if it's a point event or range event
    const isPoint = !event.date_end || event.date_start === event.date_end;

    // Convert dates to vis-timeline format
    const start = dateToVis(event.date_start);
    const end = isPoint ? undefined : dateToVis(event.date_end!);

    const item: any = {
      id: `${event.id}_${groupId}`,
      group: groupId,
      content: event.title,
      start,
      type: isPoint ? 'point' : 'range',
      style: `background-color: ${color}; border-color: ${color};`,
      title: createTooltip(event),
    };

    if (end) {
      item.end = end;
    }

    return item;
  }

  function dateToVis(dateValue: string | number): Date {
    if (typeof dateValue === 'number') {
      // Integer year (BC/AD)
      if (dateValue <= 0) {
        // BC year - vis-timeline doesn't handle BC well, use year 1 offset
        const yearOffset = Math.abs(dateValue);
        return new Date(-yearOffset, 0, 1);
      } else {
        return new Date(dateValue, 0, 1);
      }
    } else {
      // ISO string
      return new Date(dateValue);
    }
  }

  function createTooltip(event: Event): string {
    const dateStr = event.date_end && event.date_end !== event.date_start
      ? `${fmtDate(event.date_start)} – ${fmtDate(event.date_end)}`
      : fmtDate(event.date_start);

    const category = categories.find((c) => c.name === event.category);
    const categoryLabel = category ? `[${category.name}]` : '';

    const parts = [
      `<strong>${event.title}</strong>`,
      dateStr,
      categoryLabel,
      event.description ? event.description.slice(0, 100) : '',
    ].filter(Boolean);

    return parts.join('\n');
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => visTimelineRef.current?.fit()}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Fit All
        </button>
        <button
          onClick={() => visTimelineRef.current?.zoomIn(0.5)}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          +
        </button>
        <button
          onClick={() => visTimelineRef.current?.zoomOut(0.5)}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          −
        </button>

        <div className="flex-1" />

        <div className="text-sm text-gray-400">
          {events.length} events • {people.length} people
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="flex-1 bg-gray-950" />
    </div>
  );
}

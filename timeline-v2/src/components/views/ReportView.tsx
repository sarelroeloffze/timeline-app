'use client';

import { useState, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface ReportViewProps {
  onEditPerson?: (personId: string) => void;
  onEditEvent?: (eventId: string) => void;
}

export function ReportView({ onEditPerson, onEditEvent }: ReportViewProps) {
  const { events, people, categories } = useTimelineStore();
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'person'>('none');

  // Sort events
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      if (sortBy === 'date') {
        const aDate =
          typeof a.date_start === 'number' ? a.date_start : new Date(a.date_start).getFullYear();
        const bDate =
          typeof b.date_start === 'number' ? b.date_start : new Date(b.date_start).getFullYear();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      } else {
        // title
        const comparison = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
    return sorted;
  }, [events, sortBy, sortOrder]);

  // Group events
  const groupedEvents = useMemo(() => {
    if (groupBy === 'none') {
      return { '': sortedEvents };
    } else if (groupBy === 'category') {
      const groups: { [key: string]: typeof events } = {};
      sortedEvents.forEach((event) => {
        const key = event.category || 'Uncategorized';
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
      });
      return groups;
    } else {
      // person
      const groups: { [key: string]: typeof events } = {};
      sortedEvents.forEach((event) => {
        if (event.peopleIds && event.peopleIds.length > 0) {
          event.peopleIds.forEach((personId) => {
            const person = people.find((p) => p.id === personId);
            const key = person ? person.name : 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
          });
        } else {
          const key = 'No People';
          if (!groups[key]) groups[key] = [];
          groups[key].push(event);
        }
      });
      return groups;
    }
  }, [sortedEvents, groupBy, people]);

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in report view</p>
        </div>
      </div>
    );
  }

  return (
    <div id="tl-view-report" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Report View</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'category' | 'person')}
            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
          >
            <option value="none">No Grouping</option>
            <option value="category">Group by Category</option>
            <option value="person">Group by Person</option>
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
            <div key={groupName} className="mb-8">
              {groupName && (
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">
                  {groupName}
                  <span className="text-sm text-gray-500 ml-2">
                    ({groupEvents.length} event{groupEvents.length !== 1 ? 's' : ''})
                  </span>
                </h2>
              )}

              <div className="space-y-4">
                {groupEvents.map((event) => {
                  const category = categories.find((c) => c.name === event.category);
                  const eventPeople = event.peopleIds
                    ? people.filter((p) => event.peopleIds!.includes(p.id))
                    : [];

                  return (
                    <div
                      key={event.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {category && (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium mr-2"
                              style={{
                                backgroundColor: category.color + '33',
                                color: category.color,
                                border: `1px solid ${category.color}`,
                              }}
                            >
                              {category.icon} {category.name}
                            </span>
                          )}
                          <h3 className="text-lg font-semibold text-white inline">
                            {event.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => onEditEvent?.(event.id)}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="text-sm text-gray-400 mb-2">
                        {event.date_end && event.date_end !== event.date_start
                          ? `${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)} – ${fmtDate(event.date_end, 'bcad', event.dateEndCertainty)}`
                          : fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-300 mb-3">{event.description}</p>
                      )}

                      {event.location?.name && (
                        <div className="text-sm text-gray-400 mb-2">
                          📍 {event.location.name}
                        </div>
                      )}

                      {eventPeople.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
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

                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

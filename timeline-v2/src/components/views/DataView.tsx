'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';
import type { Person, Event } from '@/lib/types';

interface DataViewProps {
  onEditPerson?: (personId: string) => void;
  onEditEvent?: (eventId: string) => void;
}

export function DataView({ onEditPerson, onEditEvent }: DataViewProps) {
  const { people, events, categories } = useTimelineStore();
  const [activeTab, setActiveTab] = useState<'people' | 'events'>('events');

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1 bg-gray-700 rounded p-1">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-1 text-sm rounded transition-colors ${
              activeTab === 'events'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-1 text-sm rounded transition-colors ${
              activeTab === 'people'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            People ({people.length})
          </button>
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-400">
          {activeTab === 'events' ? `${events.length} events` : `${people.length} people`}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'events' && (
          <table className="w-full border-collapse">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  People
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => {
                const category = categories.find((c) => c.name === event.category);
                const eventPeople = event.people
                  ? people.filter((p) => event.people!.includes(p.id))
                  : [];

                return (
                  <tr
                    key={event.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'
                    } hover:bg-gray-700/50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm text-white border-b border-gray-700">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700 whitespace-nowrap">
                      {fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700 whitespace-nowrap">
                      {event.date_end && event.date_end !== event.date_start
                        ? fmtDate(event.date_end, 'bcad', event.dateEndCertainty)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-gray-700">
                      {category && (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: category.color + '33',
                            color: category.color,
                          }}
                        >
                          {category.icon} {category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700">
                      {eventPeople.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {eventPeople.slice(0, 2).map((p) => (
                            <div
                              key={p.id}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: p.color }}
                              title={p.name}
                            >
                              {p.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          ))}
                          {eventPeople.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{eventPeople.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700 max-w-xs truncate">
                      {event.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center border-b border-gray-700">
                      <button
                        onClick={() => onEditEvent?.(event.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'people' && (
          <table className="w-full border-collapse">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Birth
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Death
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Events
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, idx) => {
                const personEvents = events.filter((e) =>
                  e.people?.includes(person.id)
                );

                return (
                  <tr
                    key={person.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'
                    } hover:bg-gray-700/50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ backgroundColor: person.color }}
                        >
                          {person.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-white">{person.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700 whitespace-nowrap">
                      {person.birth
                        ? fmtDate(person.birth, 'bcad', person.birthCertainty)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700 whitespace-nowrap">
                      {person.death
                        ? fmtDate(person.death, 'bcad', person.deathCertainty)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700">
                      {person.role || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 border-b border-gray-700">
                      {personEvents.length} event{personEvents.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-center border-b border-gray-700">
                      <button
                        onClick={() => onEditPerson?.(person.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Empty states */}
        {activeTab === 'events' && events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
              <p className="text-gray-400">Add some events to see them here</p>
            </div>
          </div>
        )}

        {activeTab === 'people' && people.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">No people yet</h3>
              <p className="text-gray-400">Add some people to see them here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

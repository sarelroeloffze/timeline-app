'use client';

import { useEffect, useState } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';
import type { Event, Person } from '@/lib/types';

interface EventPanelProps {
  eventId: string | null;
  onClose: () => void;
  onEdit?: (eventId: string) => void;
}

export function EventPanel({ eventId, onClose, onEdit }: EventPanelProps) {
  const { events, people, categories } = useTimelineStore();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (eventId) {
      const foundEvent = events.find((e) => e.id === eventId);
      setEvent(foundEvent || null);
    } else {
      setEvent(null);
    }
  }, [eventId, events]);

  if (!event) return null;

  const category = categories.find((c) => c.name === event.category);
  const eventPeople = event.people
    ? people.filter((p) => event.people!.includes(p.id))
    : [];

  const dateDisplay = event.date_end && event.date_end !== event.date_start
    ? `${fmtDate(event.date_start, 'bcad', event.dateStartCertainty)} – ${fmtDate(event.date_end, 'bcad', event.dateEndCertainty)}`
    : fmtDate(event.date_start, 'bcad', event.dateStartCertainty);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {category && (
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: category.color + '33',
                  color: category.color,
                  border: `1px solid ${category.color}`,
                }}
              >
                {category.icon} {category.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">{event.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{dateDisplay}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Description */}
        {event.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Location */}
        {event.location?.name && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">📍 Location</h3>
            <p className="text-gray-400 text-sm">
              {event.location.lat && event.location.lon ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${event.location.lat}&mlon=${event.location.lon}&zoom=12`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  {event.location.name}
                </a>
              ) : (
                event.location.name
              )}
            </p>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* People */}
        {eventPeople.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">People</h3>
            <div className="space-y-2">
              {eventPeople.map((person) => (
                <div key={person.id} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{person.name}</p>
                    {person.role && (
                      <p className="text-xs text-gray-500">{person.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {event.sources && event.sources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Sources</h3>
            <div className="space-y-2">
              {event.sources.map((source, idx) => (
                <div key={idx} className="text-sm">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <span className="text-gray-400">{source.title}</span>
                  )}
                  {(source.author || source.year) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {source.author && <span>{source.author}</span>}
                      {source.author && source.year && <span>, </span>}
                      {source.year && <span>{source.year}</span>}
                    </div>
                  )}
                  {source.confidence && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                        source.confidence === 'Primary source'
                          ? 'bg-green-500/20 text-green-400'
                          : source.confidence === 'Secondary source'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {source.confidence}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {event.customFields && event.customFields.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Custom Fields</h3>
            <div className="space-y-1">
              {event.customFields.map((field, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-gray-500">{field.key}:</span>{' '}
                  <span className="text-gray-300">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {event.status && event.status !== 'planned' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Status</h3>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                event.status === 'done'
                  ? 'bg-green-500/20 text-green-400'
                  : event.status === 'active'
                  ? 'bg-blue-500/20 text-blue-400'
                  : event.status === 'cancelled'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {event.status}
            </span>
          </div>
        )}

        {/* Progress */}
        {event.progress !== undefined && event.progress > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Progress</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${event.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">{event.progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
        <button
          onClick={() => onEdit?.(event.id)}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Edit Event
        </button>
      </div>
    </div>
  );
}

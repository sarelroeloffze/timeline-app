'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { fmtDate } from '@/lib/utils/date';

interface SlideViewProps {
  onEventClick?: (eventId: string) => void;
}

export function SlideView({ onEventClick }: SlideViewProps) {
  const { events, people, categories } = useTimelineStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => {
    const aDate =
      typeof a.date_start === 'number' ? a.date_start : new Date(a.date_start).getFullYear();
    const bDate =
      typeof b.date_start === 'number' ? b.date_start : new Date(b.date_start).getFullYear();
    return aDate - bDate;
  });

  const currentEvent = sortedEvents[currentIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, sortedEvents.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentIndex(sortedEvents.length - 1);
      }
    },
    [sortedEvents.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, sortedEvents.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📽️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400">Add some events to see them in slide view</p>
        </div>
      </div>
    );
  }

  const category = currentEvent ? categories.find((c) => c.name === currentEvent.category) : null;
  const eventPeople = currentEvent?.peopleIds
    ? people.filter((p) => currentEvent.peopleIds!.includes(p.id))
    : [];

  return (
    <div id="tl-view-slide" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Slide View</span>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {sortedEvents.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex(0)}
            disabled={currentIndex === 0}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ⏮ First
          </button>
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ◀ Prev
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === sortedEvents.length - 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next ▶
          </button>
          <button
            onClick={() => setCurrentIndex(sortedEvents.length - 1)}
            disabled={currentIndex === sortedEvents.length - 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Last ⏭
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Navigation Arrows (Large) */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full flex items-center justify-center text-2xl transition-colors z-10"
            aria-label="Previous slide"
          >
            ‹
          </button>
        )}

        {currentIndex < sortedEvents.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full flex items-center justify-center text-2xl transition-colors z-10"
            aria-label="Next slide"
          >
            ›
          </button>
        )}

        {/* Event Card */}
        {currentEvent && (
          <div className="max-w-4xl w-full bg-gray-800 rounded-2xl p-12 border border-gray-700 shadow-2xl">
            <div className="text-center mb-8">
              {category && (
                <span
                  className="inline-block px-4 py-2 rounded-lg text-sm font-medium mb-4"
                  style={{
                    backgroundColor: category.color + '33',
                    color: category.color,
                    border: `2px solid ${category.color}`,
                  }}
                >
                  {category.icon} {category.name}
                </span>
              )}

              <h1 className="text-4xl font-bold text-white mb-4">{currentEvent.title}</h1>

              <div className="text-xl text-gray-400 mb-6">
                {currentEvent.date_end && currentEvent.date_end !== currentEvent.date_start
                  ? `${fmtDate(currentEvent.date_start, 'bcad', currentEvent.dateStartCertainty)} – ${fmtDate(currentEvent.date_end, 'bcad', currentEvent.dateEndCertainty)}`
                  : fmtDate(currentEvent.date_start, 'bcad', currentEvent.dateStartCertainty)}
              </div>

              {currentEvent.location?.name && (
                <div className="text-lg text-gray-400 mb-6">📍 {currentEvent.location.name}</div>
              )}
            </div>

            {currentEvent.description && (
              <div className="text-lg text-gray-300 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
                {currentEvent.description}
              </div>
            )}

            {eventPeople.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {eventPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-200">{person.name}</span>
                  </div>
                ))}
              </div>
            )}

            {currentEvent.tags && currentEvent.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {currentEvent.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button
                onClick={() => onEventClick?.(currentEvent.id)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip (Bottom) */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedEvents.map((event, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={event.id}
                onClick={() => goToSlide(idx)}
                className={`
                  flex-shrink-0 w-32 h-20 rounded-lg border-2 transition-all overflow-hidden
                  ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-gray-600 hover:border-gray-500'}
                `}
                title={event.title}
              >
                <div className="w-full h-full bg-gray-700 p-2 flex flex-col justify-center">
                  <div className="text-xs text-gray-300 font-medium truncate">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {fmtDate(event.date_start, 'bcad', event.dateStartCertainty)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

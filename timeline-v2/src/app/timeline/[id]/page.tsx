'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { loadTimeline, subscribeToTimeline, saveTimeline } from '@/lib/firebase/firestore';
import { Loading } from '@/components/shared';
import { MenuBar, Toolbar } from '@/components/layout';
import { HorizontalView } from '@/components/views';
import { EventPanel, FilterPanel } from '@/components/panels';
import { AddPersonModal, AddEventModal, EditPersonModal, EditEventModal } from '@/components/modals';
import type { Timeline } from '@/lib/types';

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setCurrentTimeline = useTimelineStore((state) => state.setCurrentTimeline);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const timelineId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    if (!timelineId) {
      setError('Invalid timeline ID');
      setLoading(false);
      return;
    }

    // Load initial timeline data
    loadTimeline(timelineId)
      .then((timeline) => {
        setCurrentTimeline(timeline);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load timeline:', err);
        setError(err.message || 'Failed to load timeline');
        setLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToTimeline(timelineId, (timeline) => {
      setCurrentTimeline(timeline);
    });

    return () => unsubscribe();
  }, [timelineId, user, router, setCurrentTimeline]);

  if (loading) {
    return <Loading size="lg" fullScreen text="Loading timeline..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentTimeline = useTimelineStore((state) => state.currentTimeline);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('horizontal');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editPersonId, setEditPersonId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenPeople, setHiddenPeople] = useState<Set<string>>(new Set());
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [hiddenTags, setHiddenTags] = useState<Set<string>>(new Set());

  const togglePerson = (personId: string) => {
    setHiddenPeople((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setHiddenTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setHiddenPeople(new Set());
    setHiddenCategories(new Set());
    setHiddenTags(new Set());
  };

  const handleSave = async () => {
    if (!currentTimeline) return;

    setSaving(true);
    try {
      await saveTimeline(currentTimeline);
      // Show success feedback
      setTimeout(() => setSaving(false), 1000);
    } catch (err) {
      console.error('Failed to save timeline:', err);
      alert('Failed to save timeline');
      setSaving(false);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'new':
        router.push('/timeline/new');
        break;
      case 'dashboard':
        router.push('/');
        break;
      case 'save':
        handleSave();
        break;
      case 'addPerson':
        setShowAddPerson(true);
        break;
      case 'addEvent':
        setShowAddEvent(true);
        break;
      case 'viewHorizontal':
        setCurrentView('horizontal');
        break;
      case 'viewVertical':
        setCurrentView('vertical');
        break;
      case 'viewData':
        setCurrentView('data');
        break;
      case 'claude':
        alert('Claude AI integration coming soon');
        break;
      case 'filters':
        setShowFilters(true);
        break;
      default:
        console.log('Unhandled action:', action);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <MenuBar onAction={handleMenuAction} />
      <Toolbar
        onAction={handleMenuAction}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'horizontal' && (
          <HorizontalView
            onEventClick={(eventId) => setSelectedEventId(eventId)}
            onAddEvent={() => setShowAddEvent(true)}
          />
        )}

        {currentView !== 'horizontal' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
              </h2>
              <p className="text-gray-400">Coming soon...</p>
            </div>
          </div>
        )}

        {/* Event Panel */}
        {selectedEventId && (
          <EventPanel
            eventId={selectedEventId}
            onClose={() => setSelectedEventId(null)}
            onEdit={(eventId) => {
              setEditEventId(eventId);
              setSelectedEventId(null);
            }}
          />
        )}

        {/* Filter Panel */}
        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          hiddenPeople={hiddenPeople}
          hiddenCategories={hiddenCategories}
          hiddenTags={hiddenTags}
          onTogglePerson={togglePerson}
          onToggleCategory={toggleCategory}
          onToggleTag={toggleTag}
          onClearAll={clearAllFilters}
        />
      </div>

      {/* Modals */}
      <AddPersonModal
        isOpen={showAddPerson}
        onClose={() => setShowAddPerson(false)}
      />

      <AddEventModal
        isOpen={showAddEvent}
        onClose={() => setShowAddEvent(false)}
      />

      <EditPersonModal
        personId={editPersonId}
        isOpen={!!editPersonId}
        onClose={() => setEditPersonId(null)}
      />

      <EditEventModal
        eventId={editEventId}
        isOpen={!!editEventId}
        onClose={() => setEditEventId(null)}
      />

      {/* Save indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
}

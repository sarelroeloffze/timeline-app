'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { loadTimeline, subscribeToTimeline } from '@/lib/firebase/firestore';
import { Loading } from '@/components/shared';
import { MenuBar, Toolbar } from '@/components/layout';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('horizontal');

  const handleMenuAction = (action: string) => {
    console.log('Menu action:', action);

    switch (action) {
      case 'new':
        router.push('/timeline/new');
        break;
      case 'dashboard':
        router.push('/');
        break;
      case 'save':
        // TODO: Implement save
        alert('Save not yet implemented');
        break;
      case 'addPerson':
        // TODO: Open add person modal
        alert('Add Person modal not yet implemented');
        break;
      case 'addEvent':
        // TODO: Open add event modal
        alert('Add Event modal not yet implemented');
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
      // Add more view cases here
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
      <div className="flex-1 p-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">
            Current View: {currentView}
          </h2>
          <p className="text-gray-400 mb-4">
            Timeline loaded successfully! View components will be added next.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• {currentTimeline?.people.length || 0} people</p>
            <p>• {currentTimeline?.events.length || 0} events</p>
            <p>• {currentTimeline?.categories.length || 0} categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}

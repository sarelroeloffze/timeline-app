'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { listTimelines, deleteTimeline } from '@/lib/firebase/firestore';
import { Button, Loading } from '@/components/shared';
import type { Timeline } from '@/lib/types/timeline';

interface TimelineCard {
  id: string;
  name: string;
  eventCount: number;
  personCount: number;
  lastModified: Date;
  categoryColors: string[];
}

export function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [timelines, setTimelines] = useState<TimelineCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadTimelines();
  }, [user]);

  const loadTimelines = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await listTimelines(user.uid);

      const cards: TimelineCard[] = data.map((tl) => ({
        id: tl.id,
        name: tl.name,
        eventCount: tl.eventCount || 0,
        personCount: tl.personCount || 0,
        lastModified: tl.updatedAt || new Date(),
        categoryColors: tl.categoryColors || [],
      }));

      setTimelines(cards.sort((a, b) =>
        b.lastModified.getTime() - a.lastModified.getTime()
      ));
    } catch (err: any) {
      console.error('Failed to load timelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeline(id);
      setTimelines((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete timeline:', err);
      alert('Failed to delete timeline: ' + err.message);
    }
  };

  const handleOpen = (id: string) => {
    router.push(`/timeline/${id}`);
  };

  const handleNew = () => {
    router.push('/timeline/new');
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <Loading size="lg" fullScreen text="Loading your timelines..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Timelines</h1>
            <p className="text-gray-400 mt-1">
              {timelines.length === 0
                ? 'No timelines yet — create your first one!'
                : `${timelines.length} timeline${timelines.length === 1 ? '' : 's'}`
              }
            </p>
          </div>

          <Button variant="primary" onClick={handleNew}>
            + New Timeline
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {timelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome to Timeline
            </h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">
              Visual timeline builder with rich media support. Create your first
              timeline to get started.
            </p>
            <Button variant="primary" onClick={handleNew}>
              + Create Your First Timeline
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timelines.map((timeline) => (
              <div
                key={timeline.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-indigo-500 transition-all cursor-pointer group"
                onClick={() => handleOpen(timeline.id)}
              >
                {/* Color Strip */}
                {timeline.categoryColors.length > 0 && (
                  <div className="h-3 rounded-t-xl flex overflow-hidden">
                    {timeline.categoryColors.slice(0, 8).map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {timeline.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>{timeline.eventCount} events</span>
                    <span>•</span>
                    <span>{timeline.personCount} people</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(timeline.lastModified)}</span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(timeline.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                      aria-label="Delete timeline"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-3">
              Delete Timeline?
            </h3>
            <p className="text-gray-400 mb-6">
              This will permanently delete this timeline and all its data. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { createTimeline } from '@/lib/firebase/firestore';
import { Button, Input, Loading } from '@/components/shared';

export default function NewTimelinePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setError('Timeline name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const timelineId = await createTimeline(user.uid, name.trim());
      router.push(`/timeline/${timelineId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create timeline');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user) {
    return <Loading size="lg" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">New Timeline</h1>
          <p className="text-gray-400">Create a new visual timeline</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Timeline Name"
              placeholder="e.g., World War II, My Life, Company History"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Timeline'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

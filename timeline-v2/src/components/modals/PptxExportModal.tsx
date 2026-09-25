'use client';

import { useState, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { exportToPPTX } from '@/lib/utils/export';

interface PptxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
}

type SlideTheme = 'timeline' | 'dark' | 'light';
type SlideMode = 'timeline' | 'story';

export function PptxExportModal({ isOpen, onClose, currentView }: PptxExportModalProps) {
  const { currentTimeline, events, people, categories } = useTimelineStore();

  const [slideMode, setSlideMode] = useState<SlideMode>('timeline');
  const [theme, setTheme] = useState<SlideTheme>('timeline');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSources, setIncludeSources] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExporting(true);

    try {
      if (!currentTimeline) {
        throw new Error('No timeline loaded');
      }

      const mode = slideMode === 'timeline' ? 'timeline-slide' : 'story-slides';
      const themeOption = theme === 'timeline' ? 'match' : theme;

      await exportToPPTX(currentTimeline, mode, {
        theme: themeOption,
        includeImages,
        includeSources,
      });

      // Success - close modal after brief delay
      setTimeout(() => {
        onClose();
        setExporting(false);
      }, 1000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Export failed. Please try again.');
      setExporting(false);
    }
  };

  const handleClose = () => {
    setSlideMode('timeline');
    setTheme('timeline');
    setIncludeImages(true);
    setIncludeSources(true);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export to PowerPoint" size="lg">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slide Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slide Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSlideMode('timeline')}
              className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                slideMode === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold mb-1">Timeline Slide</div>
              <div className="text-xs opacity-75">Single slide with current view</div>
            </button>
            <button
              type="button"
              onClick={() => setSlideMode('story')}
              className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                slideMode === 'story'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold mb-1">Story Slides</div>
              <div className="text-xs opacity-75">One slide per event</div>
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTheme('timeline')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                theme === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Match Timeline
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                theme === 'light'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Light
            </button>
          </div>
        </div>

        {/* Options (only for Story mode) */}
        {slideMode === 'story' && (
          <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Include event images</label>
              <button
                type="button"
                onClick={() => setIncludeImages(!includeImages)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeImages ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeImages ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Include sources as footnotes</label>
              <button
                type="button"
                onClick={() => setIncludeSources(!includeSources)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeSources ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeSources ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

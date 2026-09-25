'use client';

import { useState, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { exportToPNG, exportToPDF } from '@/lib/utils/export';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
}

type ExportFormat = 'png' | 'pdf';
type PaperSize = 'a4' | 'a3' | 'letter' | 'legal';
type Orientation = 'landscape' | 'portrait';

export function ExportModal({ isOpen, onClose, currentView }: ExportModalProps) {
  const { currentTimeline } = useTimelineStore();

  const [format, setFormat] = useState<ExportFormat>('png');
  const [filename, setFilename] = useState(currentTimeline?.name || 'timeline');
  const [scale, setScale] = useState(2);
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const getElementId = (): string => {
    switch (currentView) {
      case 'horizontal':
        return 'tl-view-horizontal';
      case 'vertical':
        return 'tl-view-vertical';
      case 'data':
        return 'tl-view-data';
      default:
        return 'tl-view-horizontal';
    }
  };

  const handleExport = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExporting(true);

    try {
      const elementId = getElementId();
      const element = document.getElementById(elementId);

      if (!element) {
        throw new Error('View element not found. Make sure you are on a valid view.');
      }

      if (format === 'png') {
        await exportToPNG(elementId, `${filename}.png`, scale);
      } else if (format === 'pdf') {
        await exportToPDF(elementId, `${filename}.pdf`, {
          orientation,
          paperSize,
          scale,
        });
      }

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
    if (!exporting) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Timeline" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleExport} className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Format
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormat('png')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                format === 'png'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PNG Image
            </button>
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                format === 'pdf'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PDF Document
            </button>
          </div>
        </div>

        {/* Filename */}
        <Input
          type="text"
          label="Filename"
          placeholder="timeline"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          required
          fullWidth
        />

        {/* PDF-specific options */}
        {format === 'pdf' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Orientation
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                    orientation === 'landscape'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                    orientation === 'portrait'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Portrait
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paper Size
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
          </>
        )}

        {/* Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Render Scale: {scale}×
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Standard (1×)</span>
            <span>High (2×)</span>
            <span>Ultra (3×)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Higher scale = better quality but larger file size
          </p>
        </div>

        {/* Current View Info */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Current View:</strong>{' '}
            {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            The export will capture the current view as displayed on screen.
          </p>
        </div>

        {/* Actions */}
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
            {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

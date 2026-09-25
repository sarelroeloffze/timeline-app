'use client';

import { useState, useRef, FormEvent } from 'react';
import { Modal, Button } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseCSV, csvRowsToPeople, csvRowsToEvents } from '@/lib/utils/import';
import type { Person, Event } from '@/lib/types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportType = 'people' | 'events';
type ImportMode = 'merge' | 'replace';

export function ImportCSVModal({ isOpen, onClose }: ImportCSVModalProps) {
  const { people, events, addPerson, addEvent, setPeople, setEvents } = useTimelineStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>('events');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }

      setPreview(rows.slice(0, 6)); // Header + 5 rows
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to read CSV file');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setError('');
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      if (importType === 'people') {
        const newPeople = csvRowsToPeople(rows);

        if (importMode === 'replace') {
          setPeople(newPeople);
        } else {
          // Merge - deduplicate by name
          const existingNames = new Set(people.map((p) => p.name.toLowerCase()));
          const uniqueNewPeople = newPeople.filter(
            (p) => !existingNames.has(p.name.toLowerCase())
          );
          uniqueNewPeople.forEach((p) => addPerson(p));
        }

        setStep(3);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        // Events
        const newEvents = csvRowsToEvents(rows, people);

        if (importMode === 'replace') {
          setEvents(newEvents);
        } else {
          // Merge - deduplicate by title
          const existingTitles = new Set(events.map((e) => e.title.toLowerCase()));
          const uniqueNewEvents = newEvents.filter(
            (e) => !existingTitles.has(e.title.toLowerCase())
          );
          uniqueNewEvents.forEach((e) => addEvent(e));
        }

        setStep(3);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Import failed. Please check your CSV format.');
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setError('');
    setStep(1);
    setImporting(false);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setError('');
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from CSV" size="xl">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          {/* Import Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Import Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportType('events')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  importType === 'events'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Events
              </button>
              <button
                type="button"
                onClick={() => setImportType('people')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  importType === 'people'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                People
              </button>
            </div>
          </div>

          {/* Import Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Import Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  importMode === 'merge'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Merge (Add New)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  importMode === 'replace'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Replace (Delete Existing)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {importMode === 'merge'
                ? 'New items will be added. Duplicates (by name/title) will be skipped.'
                : 'All existing items will be deleted and replaced with imported data.'}
            </p>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-indigo-500 hover:text-white transition-colors"
            >
              {file ? file.name : 'Click to select CSV file'}
            </button>
          </div>

          {/* Expected Format */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 font-semibold mb-2">
              Expected Format for {importType === 'events' ? 'Events' : 'People'}:
            </p>
            {importType === 'events' ? (
              <code className="text-xs text-gray-400">
                Title,Start Date,End Date,Description,Category,People
              </code>
            ) : (
              <code className="text-xs text-gray-400">
                Name,Birth,Death,Role,Color
              </code>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              ← Choose different file
            </button>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  {preview[0]?.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-800">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-3 py-2 text-gray-400 max-w-xs truncate"
                      >
                        {cell || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500">
            Showing first 5 rows. Total rows: {preview.length - 1}
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleReset}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-semibold text-white mb-2">Import Complete!</h3>
          <p className="text-gray-400">
            Your {importType} have been imported successfully.
          </p>
        </div>
      )}
    </Modal>
  );
}

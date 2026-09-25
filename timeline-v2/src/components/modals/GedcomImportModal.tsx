'use client';

import { useState, useRef, FormEvent } from 'react';
import { Modal, Button } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseGEDCOM } from '@/lib/utils/import';
import type { Person, Event, Relationship } from '@/lib/types';

interface GedcomImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'merge' | 'replace';

export function GedcomImportModal({ isOpen, onClose }: GedcomImportModalProps) {
  const { people, events, relationships, setPeople, setEvents, addPerson, addEvent, addRelationship } = useTimelineStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    people: Person[];
    events: Event[];
    relationships: Relationship[];
  } | null>(null);
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
      const result = parseGEDCOM(text);

      if (result.people.length === 0 && result.events.length === 0) {
        throw new Error('GEDCOM file contains no valid data');
      }

      setPreview(result);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to parse GEDCOM file');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setError('');
    setImporting(true);

    try {
      if (importMode === 'replace') {
        setPeople(preview.people);
        setEvents(preview.events);
        // Note: relationships will be handled by the store if needed
      } else {
        // Merge - deduplicate by name
        const existingNames = new Set(people.map((p) => p.name.toLowerCase()));
        const uniqueNewPeople = preview.people.filter(
          (p) => !existingNames.has(p.name.toLowerCase())
        );
        uniqueNewPeople.forEach((p) => addPerson(p));

        // Merge events - deduplicate by title
        const existingTitles = new Set(events.map((e) => e.title.toLowerCase()));
        const uniqueNewEvents = preview.events.filter(
          (e) => !existingTitles.has(e.title.toLowerCase())
        );
        uniqueNewEvents.forEach((e) => addEvent(e));

        // Merge relationships
        const existingRelKeys = new Set(
          relationships.map((r) => `${r.fromId}-${r.toId}-${r.type}`)
        );
        const uniqueNewRels = preview.relationships.filter(
          (r) => !existingRelKeys.has(`${r.fromId}-${r.toId}-${r.type}`)
        );
        uniqueNewRels.forEach((r) => addRelationship(r));
      }

      setStep(3);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Import failed. Please try again.');
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError('');
    setStep(1);
    setImporting(false);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError('');
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from GEDCOM" size="xl">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
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
              GEDCOM File (.ged)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ged"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-indigo-500 hover:text-white transition-colors"
            >
              {file ? file.name : 'Click to select GEDCOM file'}
            </button>
          </div>

          {/* Expected Format */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 font-semibold mb-2">
              About GEDCOM Import:
            </p>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>Imports genealogy data from Family Tree software</li>
              <li>Extracts individuals (people) and families</li>
              <li>Creates birth/death events and marriage events</li>
              <li>Builds parent-child and spouse relationships</li>
            </ul>
          </div>
        </div>
      )}

      {step === 2 && preview && (
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

          {/* Preview Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-400">{preview.people.length}</div>
              <div className="text-sm text-gray-400 mt-1">People</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{preview.relationships.length}</div>
              <div className="text-sm text-gray-400 mt-1">Relationships</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{preview.events.length}</div>
              <div className="text-sm text-gray-400 mt-1">Events</div>
            </div>
          </div>

          {/* Sample People */}
          {preview.people.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                Sample People (first 5):
              </h4>
              <div className="bg-gray-800 rounded-lg p-3 space-y-1">
                {preview.people.slice(0, 5).map((person, idx) => (
                  <div key={idx} className="text-sm text-gray-400">
                    • {person.name}
                    {person.birth && ` (b. ${person.birth})`}
                    {person.death && ` – d. ${person.death}`}
                  </div>
                ))}
              </div>
            </div>
          )}

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
            Your genealogy data has been imported successfully.
          </p>
        </div>
      )}
    </Modal>
  );
}

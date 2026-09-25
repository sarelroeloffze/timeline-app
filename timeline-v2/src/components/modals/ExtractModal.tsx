'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';
import type { Person, Event } from '@/lib/types';

interface ExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (text: string) => Promise<{ people: Person[]; events: Event[] }>;
  onImport: (people: Person[], events: Event[]) => Promise<void>;
}

export function ExtractModal({
  isOpen,
  onClose,
  onExtract,
  onImport,
}: ExtractModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedPeople, setExtractedPeople] = useState<Person[]>([]);
  const [extractedEvents, setExtractedEvents] = useState<Event[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const result = await onExtract(inputText.trim());
      setExtractedPeople(result.people);
      setExtractedEvents(result.events);
      setSelectedPeople(new Set(result.people.map((p) => p.id)));
      setSelectedEvents(new Set(result.events.map((e) => e.id)));
      setStep(2);
    } catch (error) {
      alert('Failed to extract data from text');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const peopleToImport = extractedPeople.filter((p) => selectedPeople.has(p.id));
    const eventsToImport = extractedEvents.filter((e) => selectedEvents.has(e.id));

    setLoading(true);
    try {
      await onImport(peopleToImport, eventsToImport);
      setStep(3);
    } catch (error) {
      alert('Import failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setInputText('');
    setExtractedPeople([]);
    setExtractedEvents([]);
    setSelectedPeople(new Set());
    setSelectedEvents(new Set());
    onClose();
  };

  const togglePerson = (id: string) => {
    setSelectedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllPeople = () => {
    setSelectedPeople(new Set(extractedPeople.map((p) => p.id)));
  };

  const deselectAllPeople = () => {
    setSelectedPeople(new Set());
  };

  const selectAllEvents = () => {
    setSelectedEvents(new Set(extractedEvents.map((e) => e.id)));
  };

  const deselectAllEvents = () => {
    setSelectedEvents(new Set());
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="✨ Extract from Text" size="xl">
      <div className="space-y-4">
        {/* Step 1: Enter Text */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Paste your text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-64 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                placeholder="Paste historical text, article, or any content with people and dates..."
              />
              <p className="text-xs text-gray-500 mt-1">
                AI will extract people, dates, and events from this text
              </p>
            </div>

            <button
              onClick={handleExtract}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={!inputText.trim() || loading}
            >
              {loading ? 'Extracting...' : 'Extract People & Events'}
            </button>
          </div>
        )}

        {/* Step 2: Review Extracted Data */}
        {step === 2 && (
          <div className="space-y-4">
            {/* People */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  People found ({selectedPeople.size} of {extractedPeople.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPeople}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Select all
                  </button>
                  <button
                    onClick={deselectAllPeople}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {extractedPeople.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPeople.has(person.id)}
                      onChange={() => togglePerson(person.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{person.name}</div>
                      <div className="text-xs text-gray-400">
                        {person.birth
                          ? `Born: ${person.birth}`
                          : 'Birth unknown'}
                      </div>
                    </div>
                  </label>
                ))}
                {extractedPeople.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No people found in text
                  </p>
                )}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  Events found ({selectedEvents.size} of {extractedEvents.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllEvents}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Select all
                  </button>
                  <button
                    onClick={deselectAllEvents}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {extractedEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs text-gray-400">
                        {event.date_start} · {event.category}
                      </div>
                    </div>
                  </label>
                ))}
                {extractedEvents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No events found in text
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading || (selectedPeople.size === 0 && selectedEvents.size === 0)}
              >
                {loading ? 'Adding...' : 'Add selected to timeline'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold">Extraction Complete</h3>
            <p className="text-gray-400">
              {selectedPeople.size} people and {selectedEvents.size} events added to your timeline
            </p>

            <button
              onClick={handleClose}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

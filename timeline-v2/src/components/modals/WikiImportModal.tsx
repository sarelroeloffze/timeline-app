'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';
import type { Person, Event } from '@/lib/types';

interface WikiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (people: Person[], events: Event[]) => Promise<void>;
}

export function WikiImportModal({
  isOpen,
  onClose,
  onImport,
}: WikiImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [urlOrTopic, setUrlOrTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [extractedPeople, setExtractedPeople] = useState<Person[]>([]);
  const [extractedEvents, setExtractedEvents] = useState<Event[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [articleTitle, setArticleTitle] = useState('');
  const [articleUrl, setArticleUrl] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'pl', name: 'Polski' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ];

  const handleFetchAndExtract = async () => {
    if (!urlOrTopic.trim()) return;

    setLoading(true);
    try {
      // Simulate Wikipedia fetch + AI extraction
      // In production, this would call a backend endpoint
      const mockPeople: Person[] = [
        {
          id: 'p1',
          name: 'Sample Person 1',
          birth: '1900-01-01',
          birthCertainty: 'exact',
          death: null,
          deathCertainty: 'exact',
          role: 'Historical figure',
          color: '#6366f1',
          photoUrl: '',
          visible: true,
          tags: [],
        },
        {
          id: 'p2',
          name: 'Sample Person 2',
          birth: '1920',
          birthCertainty: 'circa',
          death: '1990',
          deathCertainty: 'exact',
          role: 'Notable contributor',
          color: '#10b981',
          photoUrl: '',
          visible: true,
          tags: [],
        },
      ];

      const mockEvents: Event[] = [
        {
          id: 'e1',
          title: 'Sample Event 1',
          date_start: '1950-06-01',
          dateStartCertainty: 'exact',
          date_end: null,
          dateEndCertainty: 'exact',
          description: 'Significant historical event',
          category: 'Historical',
          peopleIds: ['p1'],
          location: { name: 'City, Country', lat: null, lon: null },
          tags: [],
          sources: [],
          customFields: [],
          placeId: null,
          parentEventId: null,
          progress: 0,
          status: 'done',
          images: [],
          visible: true,
          recurrence: null,
        },
      ];

      setExtractedPeople(mockPeople);
      setExtractedEvents(mockEvents);
      setSelectedPeople(new Set(mockPeople.map((p) => p.id)));
      setSelectedEvents(new Set(mockEvents.map((e) => e.id)));
      setArticleTitle('Sample Wikipedia Article');
      setArticleUrl(`https://${language}.wikipedia.org/wiki/Sample_Article`);
      setStep(2);
    } catch (error) {
      alert('Failed to fetch article or extract data');
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
    setUrlOrTopic('');
    setLanguage('en');
    setExtractedPeople([]);
    setExtractedEvents([]);
    setSelectedPeople(new Set());
    setSelectedEvents(new Set());
    setArticleTitle('');
    setArticleUrl('');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="🌐 Wikipedia Import" size="xl">
      <div className="space-y-4">
        {/* Step 1: URL/Topic Input */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Wikipedia URL or topic
              </label>
              <input
                type="text"
                value={urlOrTopic}
                onChange={(e) => setUrlOrTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchAndExtract();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g., https://en.wikipedia.org/wiki/Apollo_11 or just 'Apollo 11'"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a Wikipedia URL or enter a topic name to search
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFetchAndExtract}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={!urlOrTopic.trim() || loading}
            >
              {loading ? 'Fetching & Extracting...' : 'Fetch & Extract'}
            </button>
          </div>
        )}

        {/* Step 2: Review Extracted Data */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm">
                <strong>Fetched from Wikipedia:</strong>{' '}
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {articleTitle} ↗
                </a>
              </div>
            </div>

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
                      <div className="text-xs text-gray-400">{person.role}</div>
                    </div>
                  </label>
                ))}
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
            <h3 className="text-xl font-semibold">Wikipedia Import Complete</h3>
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

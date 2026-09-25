'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseDate } from '@/lib/utils/date';
import type { Event, DateValue, DateCertainty } from '@/lib/types';

interface EditEventModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CERTAINTY_OPTIONS: { value: DateCertainty; label: string }[] = [
  { value: 'exact', label: 'Exact' },
  { value: 'circa', label: 'c.' },
  { value: 'estimated', label: 'est.' },
  { value: 'unknown', label: '?' },
];

export function EditEventModal({ eventId, isOpen, onClose }: EditEventModalProps) {
  const { events, categories, people, updateEvent, deleteEvent } = useTimelineStore();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startCertainty, setStartCertainty] = useState<DateCertainty>('exact');
  const [endCertainty, setEndCertainty] = useState<DateCertainty>('exact');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (eventId && isOpen) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setTitle(event.title);
        setStartDate(formatDateForInput(event.date_start));
        setEndDate(event.date_end ? formatDateForInput(event.date_end) : '');
        setStartCertainty(event.dateStartCertainty || 'exact');
        setEndCertainty(event.dateEndCertainty || 'exact');
        setDescription(event.description || '');
        setCategory(event.category || '');
        setSelectedPeople(event.people || []);
      }
    }
  }, [eventId, isOpen, events]);

  function formatDateForInput(dateValue: DateValue): string {
    if (typeof dateValue === 'number') {
      if (dateValue <= 0) {
        return `${Math.abs(dateValue)} BC`;
      }
      return String(dateValue);
    } else {
      return dateValue;
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!eventId) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!startDate.trim()) {
      setError('Start date is required');
      return;
    }

    // Parse dates
    const parsedStart = parseDate(startDate.trim());
    if (!parsedStart) {
      setError('Invalid start date format');
      return;
    }

    let parsedEnd: DateValue | null = null;
    if (endDate.trim()) {
      parsedEnd = parseDate(endDate.trim());
      if (!parsedEnd) {
        setError('Invalid end date format');
        return;
      }
    }

    const updates: Partial<Event> = {
      title: title.trim(),
      date_start: parsedStart,
      date_end: parsedEnd || parsedStart,
      dateStartCertainty: startCertainty,
      dateEndCertainty: endCertainty,
      description: description.trim(),
      category: category || (categories[0]?.name || 'Uncategorised'),
      people: selectedPeople,
    };

    updateEvent(eventId, updates);
    handleClose();
  };

  const handleDelete = () => {
    if (!eventId) return;
    deleteEvent(eventId);
    setShowDeleteConfirm(false);
    handleClose();
  };

  const handleClose = () => {
    setError('');
    setShowDeleteConfirm(false);
    onClose();
  };

  const togglePerson = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  if (!eventId) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Event" size="lg">
      {showDeleteConfirm ? (
        <div>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete Event
            </Button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Title *"
              placeholder="e.g., World War II Begins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Date *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 1939, 01/09/1939"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  fullWidth
                />
                <div className="flex gap-2 mt-2">
                  {CERTAINTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStartCertainty(option.value)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        startCertainty === option.value
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Date
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 1945, 08/05/1945"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                />
                <div className="flex gap-2 mt-2">
                  {CERTAINTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEndCertainty(option.value)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        endCertainty === option.value
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this event..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Associate with People
              </label>
              <div className="flex flex-wrap gap-2">
                {people.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => togglePerson(person.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedPeople.includes(person.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: person.color }}
                    />
                    {person.name}
                  </button>
                ))}
                {people.length === 0 && (
                  <p className="text-sm text-gray-500">No people added yet.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

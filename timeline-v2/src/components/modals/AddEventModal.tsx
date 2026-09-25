'use client';

import { useState, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseDate } from '@/lib/utils/date';
import type { Event, DateValue, DateCertainty } from '@/lib/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CERTAINTY_OPTIONS: { value: DateCertainty; label: string }[] = [
  { value: 'exact', label: 'Exact' },
  { value: 'circa', label: 'c.' },
  { value: 'estimated', label: 'est.' },
  { value: 'unknown', label: '?' },
];

export function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
  const { addEvent, categories, people } = useTimelineStore();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startCertainty, setStartCertainty] = useState<DateCertainty>('exact');
  const [endCertainty, setEndCertainty] = useState<DateCertainty>('exact');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

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
      const parsed = parseDate(endDate.trim());
      if (!parsed) {
        setError('Invalid end date format');
        return;
      }
      parsedEnd = parsed;
    }

    const newEvent: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      date_start: parsedStart,
      date_end: parsedEnd || parsedStart,
      dateStartCertainty: startCertainty,
      dateEndCertainty: endCertainty,
      description: description.trim(),
      category: category || (categories[0]?.name || 'Uncategorised'),
      peopleIds: selectedPeople,
      location: { name: '', lat: null, lon: null },
      placeId: null,
      tags: [],
      sources: [],
      customFields: [],
      images: [],
      status: 'planned',
      progress: 0,
      parentEventId: null,
      recurrence: null,
      visible: true,
    };

    addEvent(newEvent);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setStartDate('');
    setEndDate('');
    setStartCertainty('exact');
    setEndCertainty('exact');
    setDescription('');
    setCategory('');
    setSelectedPeople([]);
    setError('');
    onClose();
  };

  const togglePerson = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Event" size="lg">
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
              <p className="text-sm text-gray-500">No people added yet. Add a person first.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Add Event
          </Button>
        </div>
      </form>
    </Modal>
  );
}

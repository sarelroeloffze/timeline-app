'use client';

import { useState, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseDate } from '@/lib/utils/date';
import type { Person, DateValue, DateCertainty } from '@/lib/types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#ef4444', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const CERTAINTY_OPTIONS: { value: DateCertainty; label: string }[] = [
  { value: 'exact', label: 'Exact' },
  { value: 'circa', label: 'c.' },
  { value: 'estimated', label: 'est.' },
  { value: 'unknown', label: '?' },
];

export function AddPersonModal({ isOpen, onClose }: AddPersonModalProps) {
  const { addPerson } = useTimelineStore();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [birthCertainty, setBirthCertainty] = useState<DateCertainty>('exact');
  const [deathCertainty, setDeathCertainty] = useState<DateCertainty>('exact');
  const [role, setRole] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Parse dates
    let birthDate: DateValue | null = null;
    let deathDate: DateValue | null = null;

    if (birth.trim()) {
      const parsed = parseDate(birth.trim());
      if (!parsed) {
        setError('Invalid birth date format');
        return;
      }
      birthDate = parsed;
    }

    if (death.trim()) {
      const parsed = parseDate(death.trim());
      if (!parsed) {
        setError('Invalid death date format');
        return;
      }
      deathDate = parsed;
    }

    const newPerson: Person = {
      id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      birth: birthDate,
      death: deathDate,
      birthCertainty,
      deathCertainty,
      role: role.trim(),
      color,
      photoUrl: '',
      tags: [],
      visible: true,
    };

    addPerson(newPerson);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setBirth('');
    setDeath('');
    setBirthCertainty('exact');
    setDeathCertainty('exact');
    setRole('');
    setColor(COLOR_PALETTE[0]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Person" size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Name *"
          placeholder="e.g., Albert Einstein"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Birth Date
          </label>
          <Input
            type="text"
            placeholder="e.g., 1879, 14/03/1879, 4 BC"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            fullWidth
          />
          <div className="flex gap-2 mt-2">
            {CERTAINTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBirthCertainty(option.value)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  birthCertainty === option.value
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
            Death Date
          </label>
          <Input
            type="text"
            placeholder="e.g., 1955, 18/04/1955"
            value={death}
            onChange={(e) => setDeath(e.target.value)}
            fullWidth
          />
          <div className="flex gap-2 mt-2">
            {CERTAINTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDeathCertainty(option.value)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  deathCertainty === option.value
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          type="text"
          label="Role / Description"
          placeholder="e.g., Theoretical Physicist"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Colour
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Add Person
          </Button>
        </div>
      </form>
    </Modal>
  );
}

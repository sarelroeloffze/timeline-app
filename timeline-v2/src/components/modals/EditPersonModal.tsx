'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Modal, Button, Input } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { parseDate, fmtDate } from '@/lib/utils/date';
import type { Person, DateValue, DateCertainty } from '@/lib/types';

interface EditPersonModalProps {
  personId: string | null;
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

export function EditPersonModal({ personId, isOpen, onClose }: EditPersonModalProps) {
  const { people, updatePerson, deletePerson } = useTimelineStore();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [birthCertainty, setBirthCertainty] = useState<DateCertainty>('exact');
  const [deathCertainty, setDeathCertainty] = useState<DateCertainty>('exact');
  const [role, setRole] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (personId && isOpen) {
      const person = people.find((p) => p.id === personId);
      if (person) {
        setName(person.name);
        setBirth(person.birth ? formatDateForInput(person.birth) : '');
        setDeath(person.death ? formatDateForInput(person.death) : '');
        setBirthCertainty(person.birthCertainty || 'exact');
        setDeathCertainty(person.deathCertainty || 'exact');
        setRole(person.role || '');
        setColor(person.color);
      }
    }
  }, [personId, isOpen, people]);

  function formatDateForInput(dateValue: DateValue): string {
    if (typeof dateValue === 'number') {
      // Integer year
      if (dateValue <= 0) {
        return `${Math.abs(dateValue)} BC`;
      }
      return String(dateValue);
    } else {
      // ISO string - try to format nicely
      return dateValue;
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personId) return;

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

    const updates: Partial<Person> = {
      name: name.trim(),
      birth: birthDate,
      death: deathDate,
      birthCertainty,
      deathCertainty,
      role: role.trim(),
      color,
    };

    updatePerson(personId, updates);
    handleClose();
  };

  const handleDelete = () => {
    if (!personId) return;
    deletePerson(personId);
    setShowDeleteConfirm(false);
    handleClose();
  };

  const handleClose = () => {
    setError('');
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!personId) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Person" size="md">
      {showDeleteConfirm ? (
        <div>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete this person? This will remove them from all
            associated events.
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
              Delete Person
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

'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface FieldDef {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'url';
}

interface FieldDefsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldDefs: FieldDef[];
  onSave: (fieldDefs: FieldDef[]) => void;
}

export function FieldDefsModal({
  isOpen,
  onClose,
  fieldDefs: initialFieldDefs,
  onSave,
}: FieldDefsModalProps) {
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>(initialFieldDefs);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'boolean' | 'url'>('text');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;

    const newField: FieldDef = {
      name: newFieldName.trim(),
      type: newFieldType,
    };

    setFieldDefs([...fieldDefs, newField]);
    setNewFieldName('');
    setNewFieldType('text');
  };

  const handleUpdateField = (index: number, updates: Partial<FieldDef>) => {
    setFieldDefs(
      fieldDefs.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const handleDeleteField = (index: number) => {
    if (confirm('Delete this field definition? Existing data will not be removed.')) {
      setFieldDefs(fieldDefs.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave(fieldDefs);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Custom Fields" size="md">
      <div className="space-y-4">
        {/* Existing field definitions */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {fieldDefs.map((field, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
            >
              {/* Field name */}
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  handleUpdateField(index, { name: e.target.value })
                }
                onFocus={() => setEditingIndex(index)}
                onBlur={() => setEditingIndex(null)}
                className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Field name"
              />

              {/* Field type */}
              <select
                value={field.type}
                onChange={(e) =>
                  handleUpdateField(index, {
                    type: e.target.value as 'text' | 'number' | 'boolean' | 'url',
                  })
                }
                className="bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="url">URL</option>
              </select>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteField(index)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          ))}

          {fieldDefs.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No custom fields defined yet.
            </p>
          )}
        </div>

        {/* Add new field */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Add New Field</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddField();
              }}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="Field name"
            />

            <select
              value={newFieldType}
              onChange={(e) =>
                setNewFieldType(e.target.value as 'text' | 'number' | 'boolean' | 'url')
              }
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="url">URL</option>
            </select>

            <button
              onClick={handleAddField}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newFieldName.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

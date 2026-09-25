'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';
import type { Category } from '@/lib/types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (categories: Category[]) => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories: initialCategories,
  onSave,
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      color: '#6366f1',
      icon: '📌',
    };
    setCategories([...categories, newCategory]);
    setEditingId(newCategory.id);
  };

  const handleUpdateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)));
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category? Events using it will become uncategorized.')) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const handleSave = () => {
    onSave(categories);
    onClose();
  };

  const colorPresets = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#84cc16', '#f97316', '#64748b',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories" size="lg">
      <div className="space-y-4">
        {/* Category list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
            >
              {/* Icon */}
              <input
                type="text"
                value={category.icon}
                onChange={(e) => handleUpdateCategory(category.id, { icon: e.target.value })}
                className="w-12 text-center bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                maxLength={2}
              />

              {/* Name */}
              <input
                type="text"
                value={category.name}
                onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                onFocus={() => setEditingId(category.id)}
                onBlur={() => setEditingId(null)}
                className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
              />

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border-2 border-gray-500"
                  style={{ backgroundColor: category.color }}
                />
                {editingId === category.id && (
                  <div className="absolute right-20 mt-32 p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
                    <div className="grid grid-cols-6 gap-1">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleUpdateCategory(category.id, { color })}
                          className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => handleUpdateCategory(category.id, { color: e.target.value })}
                      className="mt-2 w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Add category button */}
        <button
          onClick={handleAddCategory}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border-2 border-dashed border-gray-600"
        >
          + Add Category
        </button>

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

'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface Era {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number;
  accentColor: string;
  bg: {
    type: 'solid' | 'gradient' | 'photo';
    color1?: string;
    color2?: string;
    direction?: string;
    photoUrl?: string;
  };
}

interface EraEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eras: Era[];
  onSave: (eras: Era[]) => void;
  defaultBg?: Era['bg'];
  onSaveDefaultBg?: (bg: Era['bg']) => void;
}

export function EraEditorModal({
  isOpen,
  onClose,
  eras: initialEras,
  onSave,
  defaultBg,
  onSaveDefaultBg,
}: EraEditorModalProps) {
  const [eras, setEras] = useState<Era[]>(initialEras);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const presets = [
    { name: 'Ancient', yearStart: -3000, yearEnd: 476, color: '#92400e' },
    { name: 'Medieval', yearStart: 476, yearEnd: 1453, color: '#1e3a8a' },
    { name: 'Renaissance', yearStart: 1453, yearEnd: 1650, color: '#7c2d12' },
    { name: 'Industrial', yearStart: 1760, yearEnd: 1914, color: '#374151' },
    { name: 'Modern', yearStart: 1914, yearEnd: 2100, color: '#065f46' },
  ];

  const handleAddEra = () => {
    const newEra: Era = {
      id: `era-${Date.now()}`,
      name: 'New Era',
      yearStart: 1900,
      yearEnd: 2000,
      accentColor: '#6366f1',
      bg: { type: 'solid', color1: '#1f2937' },
    };
    setEras([...eras, newEra]);
    setExpandedId(newEra.id);
  };

  const handleAddPreset = (preset: typeof presets[0]) => {
    const newEra: Era = {
      id: `era-${Date.now()}`,
      name: preset.name,
      yearStart: preset.yearStart,
      yearEnd: preset.yearEnd,
      accentColor: preset.color,
      bg: { type: 'solid', color1: preset.color },
    };
    setEras([...eras, newEra]);
  };

  const handleUpdateEra = (id: string, updates: Partial<Era>) => {
    setEras(eras.map((era) => (era.id === id ? { ...era, ...updates } : era)));
  };

  const handleDeleteEra = (id: string) => {
    if (confirm('Delete this era?')) {
      setEras(eras.filter((era) => era.id !== id));
    }
  };

  const handleSave = () => {
    onSave(eras);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Background Sections (Eras)" size="lg">
      <div className="space-y-4">
        {/* Quick-add presets */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Quick add presets</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleAddPreset(preset)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Era list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {eras
            .sort((a, b) => a.yearStart - b.yearStart)
            .map((era) => (
              <div key={era.id} className="bg-gray-700 rounded-lg overflow-hidden">
                {/* Era header row */}
                <div className="flex items-center gap-3 p-3">
                  <input
                    type="text"
                    value={era.name}
                    onChange={(e) => handleUpdateEra(era.id, { name: e.target.value })}
                    className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Era name"
                  />

                  <input
                    type="number"
                    value={era.yearStart}
                    onChange={(e) =>
                      handleUpdateEra(era.id, { yearStart: parseInt(e.target.value) })
                    }
                    className="w-24 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Start"
                  />

                  <span className="text-gray-400">→</span>

                  <input
                    type="number"
                    value={era.yearEnd}
                    onChange={(e) =>
                      handleUpdateEra(era.id, { yearEnd: parseInt(e.target.value) })
                    }
                    className="w-24 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="End"
                  />

                  <button
                    onClick={() =>
                      setExpandedId(expandedId === era.id ? null : era.id)
                    }
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    title="Edit background"
                  >
                    🎨
                  </button>

                  <button
                    onClick={() => handleDeleteEra(era.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    🗑
                  </button>
                </div>

                {/* Expanded background editor */}
                {expandedId === era.id && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-600 pt-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Accent color
                      </label>
                      <input
                        type="color"
                        value={era.accentColor}
                        onChange={(e) =>
                          handleUpdateEra(era.id, { accentColor: e.target.value })
                        }
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Background type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateEra(era.id, {
                              bg: { ...era.bg, type: 'solid' },
                            })
                          }
                          className={`flex-1 px-3 py-1 rounded transition-colors ${
                            era.bg.type === 'solid'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          Solid
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateEra(era.id, {
                              bg: { ...era.bg, type: 'gradient' },
                            })
                          }
                          className={`flex-1 px-3 py-1 rounded transition-colors ${
                            era.bg.type === 'gradient'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          Gradient
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateEra(era.id, {
                              bg: { ...era.bg, type: 'photo' },
                            })
                          }
                          className={`flex-1 px-3 py-1 rounded transition-colors ${
                            era.bg.type === 'photo'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          Photo
                        </button>
                      </div>
                    </div>

                    {era.bg.type === 'solid' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Color</label>
                        <input
                          type="color"
                          value={era.bg.color1 || '#1f2937'}
                          onChange={(e) =>
                            handleUpdateEra(era.id, {
                              bg: { ...era.bg, color1: e.target.value },
                            })
                          }
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    )}

                    {era.bg.type === 'gradient' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Start
                          </label>
                          <input
                            type="color"
                            value={era.bg.color1 || '#1f2937'}
                            onChange={(e) =>
                              handleUpdateEra(era.id, {
                                bg: { ...era.bg, color1: e.target.value },
                              })
                            }
                            className="w-full h-10 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">End</label>
                          <input
                            type="color"
                            value={era.bg.color2 || '#4b5563'}
                            onChange={(e) =>
                              handleUpdateEra(era.id, {
                                bg: { ...era.bg, color2: e.target.value },
                              })
                            }
                            className="w-full h-10 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

          {eras.length === 0 && (
            <p className="text-gray-500 text-center py-4">No eras defined yet.</p>
          )}
        </div>

        {/* Add era button */}
        <button
          onClick={handleAddEra}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border-2 border-dashed border-gray-600"
        >
          + Add Era
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

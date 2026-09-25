'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface Marker {
  id: string;
  name: string;
  date: string | number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  labelPos: 'top' | 'bottom';
  visible: boolean;
  builtIn?: boolean;
}

interface MarkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  markers: Marker[];
  onSave: (markers: Marker[]) => void;
}

export function MarkersModal({
  isOpen,
  onClose,
  markers: initialMarkers,
  onSave,
}: MarkersModalProps) {
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerDate, setNewMarkerDate] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#6366f1');
  const [newMarkerStyle, setNewMarkerStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [newMarkerLabelPos, setNewMarkerLabelPos] = useState<'top' | 'bottom'>('top');

  const colorPresets = [
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#14b8a6',
    '#84cc16',
    '#f97316',
    '#64748b',
  ];

  const handleAddMarker = () => {
    if (!newMarkerName.trim() || !newMarkerDate.trim()) return;

    const newMarker: Marker = {
      id: `marker-${Date.now()}`,
      name: newMarkerName.trim(),
      date: newMarkerDate.trim(),
      color: newMarkerColor,
      style: newMarkerStyle,
      labelPos: newMarkerLabelPos,
      visible: true,
    };

    setMarkers([...markers, newMarker]);
    setNewMarkerName('');
    setNewMarkerDate('');
    setNewMarkerColor('#6366f1');
    setNewMarkerStyle('solid');
    setNewMarkerLabelPos('top');
  };

  const handleUpdateMarker = (id: string, updates: Partial<Marker>) => {
    setMarkers(
      markers.map((marker) => (marker.id === id ? { ...marker, ...updates } : marker))
    );
  };

  const handleDeleteMarker = (id: string) => {
    if (confirm('Delete this marker?')) {
      setMarkers(markers.filter((marker) => marker.id !== id));
    }
  };

  const handleToggleVisible = (id: string) => {
    setMarkers(
      markers.map((marker) =>
        marker.id === id ? { ...marker, visible: !marker.visible } : marker
      )
    );
  };

  const handleSave = () => {
    onSave(markers);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calendar Markers" size="lg">
      <div className="space-y-4">
        {/* Marker list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
            >
              {/* Visibility toggle */}
              <button
                onClick={() => handleToggleVisible(marker.id)}
                className="text-lg"
                title={marker.visible ? 'Hide marker' : 'Show marker'}
              >
                {marker.visible ? '👁' : ''}
              </button>

              {/* Name */}
              <input
                type="text"
                value={marker.name}
                onChange={(e) =>
                  handleUpdateMarker(marker.id, { name: e.target.value })
                }
                onFocus={() => setEditingId(marker.id)}
                onBlur={() => setEditingId(null)}
                className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Marker name"
                disabled={marker.builtIn}
              />

              {/* Date */}
              <input
                type="text"
                value={marker.date}
                onChange={(e) =>
                  handleUpdateMarker(marker.id, { date: e.target.value })
                }
                className="w-32 bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Date"
                disabled={marker.builtIn}
              />

              {/* Color */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border-2 border-gray-500 cursor-pointer"
                  style={{ backgroundColor: marker.color }}
                  onClick={() => setEditingId(marker.id)}
                />
                {editingId === marker.id && !marker.builtIn && (
                  <div className="absolute right-20 mt-32 p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
                    <div className="grid grid-cols-6 gap-1">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            handleUpdateMarker(marker.id, { color })
                          }
                          className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={marker.color}
                      onChange={(e) =>
                        handleUpdateMarker(marker.id, { color: e.target.value })
                      }
                      className="mt-2 w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Style */}
              <select
                value={marker.style}
                onChange={(e) =>
                  handleUpdateMarker(marker.id, {
                    style: e.target.value as 'solid' | 'dashed' | 'dotted',
                  })
                }
                className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                disabled={marker.builtIn}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>

              {/* Label position */}
              <select
                value={marker.labelPos}
                onChange={(e) =>
                  handleUpdateMarker(marker.id, {
                    labelPos: e.target.value as 'top' | 'bottom',
                  })
                }
                className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>

              {/* Delete button */}
              {!marker.builtIn && (
                <button
                  onClick={() => handleDeleteMarker(marker.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  🗑
                </button>
              )}
            </div>
          ))}

          {markers.length === 0 && (
            <p className="text-gray-500 text-center py-4">No markers defined yet.</p>
          )}
        </div>

        {/* Add marker form */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Add New Marker</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMarkerName}
                onChange={(e) => setNewMarkerName(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Marker name"
              />
              <input
                type="text"
                value={newMarkerDate}
                onChange={(e) => setNewMarkerDate(e.target.value)}
                className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Date"
              />
            </div>

            <div className="flex gap-3">
              <input
                type="color"
                value={newMarkerColor}
                onChange={(e) => setNewMarkerColor(e.target.value)}
                className="w-20 h-10 rounded cursor-pointer"
              />

              <select
                value={newMarkerStyle}
                onChange={(e) =>
                  setNewMarkerStyle(e.target.value as 'solid' | 'dashed' | 'dotted')
                }
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>

              <select
                value={newMarkerLabelPos}
                onChange={(e) =>
                  setNewMarkerLabelPos(e.target.value as 'top' | 'bottom')
                }
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>

              <button
                onClick={handleAddMarker}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMarkerName.trim() || !newMarkerDate.trim()}
              >
                Add
              </button>
            </div>
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

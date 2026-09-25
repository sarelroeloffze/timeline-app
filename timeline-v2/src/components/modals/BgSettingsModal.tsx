'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface BgSettings {
  type: 'solid' | 'gradient' | 'photo';
  color1?: string;
  color2?: string;
  direction?: string;
  photoUrl?: string;
}

interface BgSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bgSettings: BgSettings;
  onSave: (settings: BgSettings) => void;
}

export function BgSettingsModal({
  isOpen,
  onClose,
  bgSettings: initialBgSettings,
  onSave,
}: BgSettingsModalProps) {
  const [bgSettings, setBgSettings] = useState<BgSettings>(initialBgSettings);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const gradientDirections = [
    { value: 'to right', label: '→ Right' },
    { value: 'to left', label: '← Left' },
    { value: 'to bottom', label: '↓ Down' },
    { value: 'to top', label: '↑ Up' },
    { value: 'to bottom right', label: '↘ Bottom Right' },
    { value: 'to bottom left', label: '↙ Bottom Left' },
    { value: 'to top right', label: '↗ Top Right' },
    { value: 'to top left', label: '↖ Top Left' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setBgSettings({
        ...bgSettings,
        type: 'photo',
        photoUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave(bgSettings);
    onClose();
  };

  const getPreviewStyle = (): React.CSSProperties => {
    if (bgSettings.type === 'solid') {
      return { backgroundColor: bgSettings.color1 || '#1f2937' };
    } else if (bgSettings.type === 'gradient') {
      return {
        background: `linear-gradient(${bgSettings.direction || 'to right'}, ${
          bgSettings.color1 || '#1f2937'
        }, ${bgSettings.color2 || '#4b5563'})`,
      };
    } else if (bgSettings.type === 'photo' && bgSettings.photoUrl) {
      return {
        backgroundImage: `url(${bgSettings.photoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Background Settings" size="md">
      <div className="space-y-4">
        {/* Background type selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Background type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setBgSettings({ ...bgSettings, type: 'solid' })}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                bgSettings.type === 'solid'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Solid Color
            </button>
            <button
              onClick={() => setBgSettings({ ...bgSettings, type: 'gradient' })}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                bgSettings.type === 'gradient'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Gradient
            </button>
            <button
              onClick={() => setBgSettings({ ...bgSettings, type: 'photo' })}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                bgSettings.type === 'photo'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Photo
            </button>
          </div>
        </div>

        {/* Solid color picker */}
        {bgSettings.type === 'solid' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Color</label>
            <input
              type="color"
              value={bgSettings.color1 || '#1f2937'}
              onChange={(e) =>
                setBgSettings({ ...bgSettings, color1: e.target.value })
              }
              className="w-full h-12 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Gradient settings */}
        {bgSettings.type === 'gradient' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start color</label>
                <input
                  type="color"
                  value={bgSettings.color1 || '#1f2937'}
                  onChange={(e) =>
                    setBgSettings({ ...bgSettings, color1: e.target.value })
                  }
                  className="w-full h-12 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End color</label>
                <input
                  type="color"
                  value={bgSettings.color2 || '#4b5563'}
                  onChange={(e) =>
                    setBgSettings({ ...bgSettings, color2: e.target.value })
                  }
                  className="w-full h-12 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Direction</label>
              <select
                value={bgSettings.direction || 'to right'}
                onChange={(e) =>
                  setBgSettings({ ...bgSettings, direction: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {gradientDirections.map((dir) => (
                  <option key={dir.value} value={dir.value}>
                    {dir.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Photo upload */}
        {bgSettings.type === 'photo' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Upload photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
            />
            {bgSettings.photoUrl && (
              <p className="text-xs text-gray-500 mt-1">Photo uploaded successfully</p>
            )}
          </div>
        )}

        {/* Preview */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Preview</label>
          <div
            className="w-full h-32 rounded-lg border border-gray-600"
            style={getPreviewStyle()}
          />
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
            Save Background
          </button>
        </div>
      </div>
    </Modal>
  );
}

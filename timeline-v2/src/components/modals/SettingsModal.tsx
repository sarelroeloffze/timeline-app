'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState('en');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [showTutorials, setShowTutorials] = useState(true);
  const [defaultView, setDefaultView] = useState('horizontal');

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('tl_settings', JSON.stringify({
      theme,
      language,
      autoSave,
      autoSaveInterval,
      showTutorials,
      defaultView,
    }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Appearance</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'system' | 'light' | 'dark')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Behavior</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Auto-save</label>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSave ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoSave && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Auto-save interval (seconds)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Show tutorials</label>
              <button
                onClick={() => setShowTutorials(!showTutorials)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showTutorials ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTutorials ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Default view</label>
              <select
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="data">Data</option>
                <option value="flow">Flow</option>
                <option value="thread">Thread</option>
                <option value="map">Map</option>
                <option value="report">Report</option>
                <option value="slide">Slide</option>
                <option value="canvas">Canvas</option>
                <option value="gantt">Gantt</option>
                <option value="tree">Tree</option>
                <option value="radial">Radial</option>
                <option value="subway">Subway</option>
              </select>
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
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
}

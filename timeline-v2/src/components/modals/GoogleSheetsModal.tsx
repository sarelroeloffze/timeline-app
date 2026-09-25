'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, sheetType: 'events' | 'people', mapping: Record<string, string>, mode: 'merge' | 'replace', autoSync: string) => Promise<void>;
}

export function GoogleSheetsModal({
  isOpen,
  onClose,
  onImport,
}: GoogleSheetsModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetType, setSheetType] = useState<'events' | 'people'>('events');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [autoSync, setAutoSync] = useState('off');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const eventFields = [
    'Title',
    'Start Date',
    'End Date',
    'Description',
    'Category',
    'People',
    'Location',
    'Tags',
  ];

  const peopleFields = ['Name', 'Birth', 'Death', 'Role', 'Color'];

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return;

    setLoading(true);
    try {
      // Simulate fetching sheet data
      // In production, this would call a backend endpoint to fetch the CSV
      const mockData = [
        ['Title', 'Start Date', 'End Date', 'Description', 'Category'],
        ['Event 1', '2020-01-01', '2020-01-02', 'First event', 'Work'],
        ['Event 2', '2020-02-01', '', 'Second event', 'Personal'],
      ];

      setPreviewData(mockData);

      // Auto-detect column mapping
      const autoMapping: Record<string, string> = {};
      const headers = mockData[0];
      const fields = sheetType === 'events' ? eventFields : peopleFields;

      fields.forEach((field) => {
        const normalizedField = field.toLowerCase().replace(/\s+/g, '');
        const matchedCol = headers.findIndex((h) =>
          h.toLowerCase().replace(/\s+/g, '').includes(normalizedField)
        );
        if (matchedCol !== -1) {
          autoMapping[field] = headers[matchedCol];
        }
      });

      setMapping(autoMapping);
      setStep(2);
    } catch (error) {
      alert('Failed to fetch sheet. Make sure it is published to the web.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await onImport(sheetUrl, sheetType, mapping, importMode, autoSync);
      setStep(3);
    } catch (error) {
      alert('Import failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSheetUrl('');
    setSheetType('events');
    setMapping({});
    setImportMode('merge');
    setAutoSync('off');
    setPreviewData([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📊 Google Sheets Sync" size="xl">
      <div className="space-y-4">
        {/* Step 1: Enter URL */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Google Sheets URL
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Make sure your sheet is published to the web (File → Share → Publish to web)
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Sheet type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSheetType('events')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    sheetType === 'events'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setSheetType('people')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    sheetType === 'people'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  People
                </button>
              </div>
            </div>

            <button
              onClick={handleFetchSheet}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={!sheetUrl.trim() || loading}
            >
              {loading ? 'Fetching sheet...' : 'Fetch Sheet'}
            </button>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Map Columns</h3>
              <p className="text-sm text-gray-400 mb-4">
                Match your sheet columns to timeline fields
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(sheetType === 'events' ? eventFields : peopleFields).map((field) => (
                  <div key={field} className="flex items-center gap-3">
                    <label className="w-32 text-sm text-gray-400">{field}</label>
                    <select
                      value={mapping[field] || ''}
                      onChange={(e) =>
                        setMapping({ ...mapping, [field]: e.target.value })
                      }
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Skip --</option>
                      {previewData[0]?.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-2">
                Preview (first 3 rows)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {previewData[0]?.map((col, i) => (
                        <th key={i} className="text-left p-2 text-gray-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1, 4).map((row, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2 text-gray-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Import mode</label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="merge">Merge (add new rows)</option>
                  <option value="replace">Replace (clear all)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Auto-sync</label>
                <select
                  value={autoSync}
                  onChange={(e) => setAutoSync(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="off">Off</option>
                  <option value="1">Every 1 minute</option>
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold">Import Complete</h3>
            <p className="text-gray-400">
              {importMode === 'merge'
                ? 'New rows have been added to your timeline'
                : 'Your timeline has been replaced with the sheet data'}
            </p>
            {autoSync !== 'off' && (
              <p className="text-sm text-indigo-400">
                Auto-sync enabled: Updates every {autoSync} minute(s)
              </p>
            )}

            <button
              onClick={handleClose}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

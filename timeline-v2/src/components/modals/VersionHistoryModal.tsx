'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface TimelineVersion {
  id: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
  auto: boolean;
  eventCount?: number;
  personCount?: number;
  dateRange?: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: TimelineVersion[];
  onRestore: (versionId: string) => Promise<void>;
  onCreateNamed: (label: string) => Promise<void>;
  onLabel: (versionId: string, label: string) => Promise<void>;
  onDelete: (versionId: string) => Promise<void>;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  onRestore,
  onCreateNamed,
  onLabel,
  onDelete,
}: VersionHistoryModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    versions.length > 0 ? versions[0].id : null
  );
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [namedSnapshotLabel, setNamedSnapshotLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVersion = versions.find((v) => v.id === selectedId);

  const handleRestore = async () => {
    if (!selectedId) return;

    if (
      !confirm(
        'Restore this version? This will create a backup of the current state before restoring.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await onRestore(selectedId);
      alert('Version restored successfully');
      onClose();
    } catch (error) {
      alert('Failed to restore version');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNamed = async () => {
    if (!namedSnapshotLabel.trim()) return;

    setLoading(true);
    try {
      await onCreateNamed(namedSnapshotLabel.trim());
      setNamedSnapshotLabel('');
      alert('Named snapshot created');
    } catch (error) {
      alert('Failed to create snapshot');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLabel = async (versionId: string) => {
    if (!labelInput.trim()) return;

    setLoading(true);
    try {
      await onLabel(versionId, labelInput.trim());
      setEditingLabelId(null);
      setLabelInput('');
    } catch (error) {
      alert('Failed to update label');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm('Delete this snapshot?')) return;

    setLoading(true);
    try {
      await onDelete(versionId);
      if (selectedId === versionId && versions.length > 0) {
        setSelectedId(versions[0].id);
      }
    } catch (error) {
      alert('Failed to delete snapshot');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version History" size="xl">
      <div className="flex gap-4 h-[600px]">
        {/* Left panel - version list */}
        <div className="w-1/2 border-r border-gray-700 pr-4 overflow-y-auto">
          <div className="space-y-2">
            {/* Create named snapshot */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 mb-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-2">
                📌 Save named snapshot
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={namedSnapshotLabel}
                  onChange={(e) => setNamedSnapshotLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNamed();
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Snapshot name"
                  disabled={loading}
                />
                <button
                  onClick={handleCreateNamed}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
                  disabled={!namedSnapshotLabel.trim() || loading}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Version list */}
            {versions.map((version) => (
              <div
                key={version.id}
                onClick={() => setSelectedId(version.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedId === version.id
                    ? 'bg-indigo-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  {editingLabelId === version.id ? (
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveLabel(version.id);
                        if (e.key === 'Escape') setEditingLabelId(null);
                      }}
                      onBlur={() => handleSaveLabel(version.id)}
                      className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {version.label || `Version ${version.versionNumber}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 ml-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        version.auto
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {version.auto ? 'Auto' : 'Named'}
                    </span>
                    {!version.auto && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLabelId(version.id);
                            setLabelInput(version.label || '');
                          }}
                          className="px-2 py-0.5 text-xs hover:bg-gray-500 rounded"
                        >
                          ✏
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(version.id);
                          }}
                          className="px-2 py-0.5 text-xs hover:bg-red-600 rounded"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {versions.length === 0 && (
              <p className="text-gray-500 text-center py-8">No versions saved yet.</p>
            )}
          </div>
        </div>

        {/* Right panel - preview */}
        <div className="w-1/2 pl-4">
          {selectedVersion ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedVersion.label || `Version ${selectedVersion.versionNumber}`}
                </h3>
                <p className="text-sm text-gray-400">
                  Created {formatDate(selectedVersion.createdAt)}
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-200 mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  {selectedVersion.personCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">People:</span>
                      <span>{selectedVersion.personCount}</span>
                    </div>
                  )}
                  {selectedVersion.eventCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Events:</span>
                      <span>{selectedVersion.eventCount}</span>
                    </div>
                  )}
                  {selectedVersion.dateRange && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date range:</span>
                      <span>{selectedVersion.dateRange}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRestore}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                ↩ Restore this version
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a version to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Close button */}
      <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

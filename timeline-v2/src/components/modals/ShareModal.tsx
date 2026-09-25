'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { currentTimeline } = useTimelineStore();
  const [shareMethod, setShareMethod] = useState<'link' | 'export' | 'email'>('link');
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  const generateShareLink = () => {
    if (!currentTimeline) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/timeline/${currentTimeline.id}?permission=${permission}`;
  };

  const handleCopyLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!currentTimeline) return;

    const dataStr = JSON.stringify(currentTimeline, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTimeline.name || 'timeline'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Timeline">
      <div className="space-y-6">
        {/* Share method selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Share method</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShareMethod('link')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                shareMethod === 'link'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🔗 Link
            </button>
            <button
              onClick={() => setShareMethod('export')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                shareMethod === 'export'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              💾 Export
            </button>
            <button
              onClick={() => setShareMethod('email')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                shareMethod === 'email'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ✉️ Email
            </button>
          </div>
        </div>

        {/* Share link */}
        {shareMethod === 'link' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Permission level</label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="view">View only</option>
                <option value="edit">Can edit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Share link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateShareLink()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Anyone with this link can {permission === 'view' ? 'view' : 'edit'} your timeline
              </p>
            </div>
          </div>
        )}

        {/* Export */}
        {shareMethod === 'export' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Export your timeline as a JSON file to share offline or import into another account.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Download JSON File
            </button>
          </div>
        )}

        {/* Email */}
        {shareMethod === 'email' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Send an invitation email to collaborate on this timeline.
            </p>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email address</label>
              <input
                type="email"
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Permission</label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
            </div>
            <button
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Send Invitation
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsed: string | null;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  createdAt: string;
}

interface APIModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: APIKey[];
  webhooks: Webhook[];
  onCreateKey: (name: string) => Promise<{ key: string }>;
  onRevokeKey: (keyId: string) => Promise<void>;
  onCreateWebhook: (url: string, secret: string | null) => Promise<void>;
  onDeleteWebhook: (webhookId: string) => Promise<void>;
}

export function APIModal({
  isOpen,
  onClose,
  apiKeys,
  webhooks,
  onCreateKey,
  onRevokeKey,
  onCreateWebhook,
  onDeleteWebhook,
}: APIModalProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setLoading(true);
    try {
      const result = await onCreateKey(newKeyName.trim());
      setNewKeyResult(result.key);
      setNewKeyName('');
    } catch (error) {
      alert('Failed to create API key');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Revoke API key "${keyName}"? Applications using it will stop working.`)) {
      return;
    }

    setLoading(true);
    try {
      await onRevokeKey(keyId);
    } catch (error) {
      alert('Failed to revoke API key');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;

    setLoading(true);
    try {
      await onCreateWebhook(
        newWebhookUrl.trim(),
        newWebhookSecret.trim() || null
      );
      setNewWebhookUrl('');
      setNewWebhookSecret('');
    } catch (error) {
      alert('Failed to create webhook');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string, webhookUrl: string) => {
    if (!confirm(`Delete webhook for ${webhookUrl}?`)) return;

    setLoading(true);
    try {
      await onDeleteWebhook(webhookId);
    } catch (error) {
      alert('Failed to delete webhook');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔑 API & Webhooks" size="lg">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'keys'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'webhooks'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🪝 Webhooks
          </button>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {/* New key result */}
            {newKeyResult && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-400 mb-2">
                  ✓ API Key Created
                </h4>
                <p className="text-xs text-gray-400 mb-2">
                  Copy this key now — it won't be shown again.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyResult}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newKeyResult);
                      alert('Copied to clipboard');
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => setNewKeyResult(null)}
                  className="mt-2 text-sm text-gray-400 hover:text-gray-300"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Existing keys */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{key.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {key.keyPrefix}••••••••
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Last used: {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id, key.name)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                    disabled={loading}
                  >
                    Revoke
                  </button>
                </div>
              ))}
              {apiKeys.length === 0 && (
                <p className="text-gray-500 text-center py-8">No API keys yet.</p>
              )}
            </div>

            {/* Create new key */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-3">
                Generate New Key
              </h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateKey();
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Key name (e.g., Production API)"
                  disabled={loading}
                />
                <button
                  onClick={handleCreateKey}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
                  disabled={!newKeyName.trim() || loading}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* API Docs link */}
            <div className="border-t border-gray-700 pt-4">
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                📖 API Documentation ↗
              </a>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {/* Existing webhooks */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm break-all">{webhook.url}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Events: {webhook.events.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {webhook.secret ? '🔒 Signed' : '⚠ Not signed'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id, webhook.url)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm ml-3"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {webhooks.length === 0 && (
                <p className="text-gray-500 text-center py-8">No webhooks yet.</p>
              )}
            </div>

            {/* Create new webhook */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-3">
                Register Webhook
              </h4>
              <div className="space-y-3">
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://your-server.com/webhook"
                  disabled={loading}
                />
                <input
                  type="password"
                  value={newWebhookSecret}
                  onChange={(e) => setNewWebhookSecret(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Signing secret (optional)"
                  disabled={loading}
                />
                <button
                  onClick={handleCreateWebhook}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
                  disabled={!newWebhookUrl.trim() || loading}
                >
                  Register Webhook
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
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

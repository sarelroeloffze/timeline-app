'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared';

interface NarrativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (tone: string, length: string, focus: string, language: string) => Promise<string>;
}

export function NarrativeModal({
  isOpen,
  onClose,
  onGenerate,
}: NarrativeModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tone, setTone] = useState('narrative');
  const [length, setLength] = useState('standard');
  const [focus, setFocus] = useState('all');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  const tones = [
    { value: 'academic', label: 'Academic', description: 'Formal, scholarly tone' },
    { value: 'narrative', label: 'Narrative', description: 'Story-like, engaging' },
    { value: 'journalistic', label: 'Journalistic', description: 'News-style reporting' },
    { value: 'simple', label: 'Simple', description: 'Clear, accessible language' },
  ];

  const lengths = [
    { value: 'brief', label: 'Brief', description: '~300 words' },
    { value: 'standard', label: 'Standard', description: '~800 words' },
    { value: 'detailed', label: 'Detailed', description: '~1500 words' },
  ];

  const focuses = [
    { value: 'all', label: 'Everything', description: 'All people and events' },
    { value: 'people', label: 'People-focused', description: 'Emphasize biographical details' },
    { value: 'events', label: 'Events-focused', description: 'Emphasize what happened' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const narrative = await onGenerate(tone, length, focus, language);
      setGeneratedText(narrative);
      setStep(2);
    } catch (error) {
      alert('Failed to generate narrative');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('Copied to clipboard');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline-narrative.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setStep(1);
    setTone('narrative');
    setLength('standard');
    setFocus('all');
    setLanguage('en');
    setGeneratedText('');
    onClose();
  };

  // Simple markdown-lite renderer
  const renderText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headings
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-xl font-bold mt-6 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-8 mb-3">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      // Paragraphs
      return (
        <p key={i} className="mb-3 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📖 Narrative Export" size="xl">
      <div className="space-y-4">
        {/* Step 1: Configuration */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      tone === t.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs opacity-80 mt-1">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Length</label>
              <div className="grid grid-cols-3 gap-2">
                {lengths.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLength(l.value)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      length === l.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{l.label}</div>
                    <div className="text-xs opacity-80 mt-1">{l.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Focus</label>
              <div className="grid grid-cols-3 gap-2">
                {focuses.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFocus(f.value)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      focus === f.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs opacity-80 mt-1">{f.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Generating narrative...' : 'Generate Narrative'}
            </button>
          </div>
        )}

        {/* Step 2: Generated Text */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-invert max-w-none">
              {renderText(generatedText)}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Regenerate
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Download .txt
              </button>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

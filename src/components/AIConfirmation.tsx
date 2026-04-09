import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface AIConfirmationProps {
  isOpen: boolean;
  proposedResolutions: Record<string, string>;
  officialNames: string[];
  onClose: () => void;
  onConfirm: (updatedResolutions: Record<string, string>) => void;
}

export function AIConfirmation({
  isOpen,
  proposedResolutions,
  officialNames,
  onClose,
  onConfirm,
}: AIConfirmationProps) {
  const [workingResolutions, setWorkingResolutions] = useState<Record<string, string>>(proposedResolutions);

  useEffect(() => {
    setWorkingResolutions(proposedResolutions);
  }, [proposedResolutions, isOpen]);

  const availableNames = useMemo(() => {
    return Array.from(new Set([...officialNames, ...Object.values(proposedResolutions)])).sort((a, b) => a.localeCompare(b));
  }, [officialNames, proposedResolutions]);

  if (!isOpen) return null;

  const updateResolution = (rawName: string, canonicalName: string) => {
    setWorkingResolutions(prev => ({ ...prev, [rawName]: canonicalName }));
  };

  const handleConfirm = () => {
    onConfirm(workingResolutions);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirm AI Name Matches</h2>
            <p className="text-sm text-gray-500 mt-1">Review and adjust the AI-suggested mappings before saving.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="text-sm text-gray-600">
            The AI has proposed matches for your raw names. Edit any suggestion by choosing a different official name or keeping the raw name.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.keys(workingResolutions).sort((a, b) => a.localeCompare(b)).map(rawName => (
              <div key={rawName} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Raw name</div>
                <div className="font-semibold text-gray-900">{rawName}</div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Suggested match</label>
                  <select
                    value={workingResolutions[rawName] || rawName}
                    onChange={e => updateResolution(rawName, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={rawName}>{rawName}</option>
                    {availableNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-sm text-gray-500">
            Tip: choose the official name that best matches the attendance list if the AI suggestion looks wrong.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm AI Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

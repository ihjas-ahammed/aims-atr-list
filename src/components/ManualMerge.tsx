import React, { useEffect, useState, useMemo } from 'react';
import { Search, Merge, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface ManualMergeProps {
  rawNames: string[];
  initialResolutions: Record<string, string>;
  onComplete: (resolutions: Record<string, string>) => void;
}

export function ManualMerge({ rawNames, initialResolutions, onComplete }: ManualMergeProps) {
  const [resolutions, setResolutions] = useState<Record<string, string>>(initialResolutions);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [primaryChoice, setPrimaryChoice] = useState<string>('');

  React.useEffect(() => {
    setResolutions(initialResolutions);
  }, [initialResolutions]);

  const availableNames = useMemo(() => {
    const canonicals = new Set<string>();
    rawNames.forEach(n => {
      canonicals.add(resolutions[n] || n);
    });
    return Array.from(canonicals).sort((a, b) => a.localeCompare(b));
  }, [rawNames, resolutions]);

  const filtered = availableNames.filter(n => n.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) {
      next.delete(name);
      if (primaryChoice === name) setPrimaryChoice('');
    } else {
      next.add(name);
      if (next.size === 1) setPrimaryChoice(name);
    }
    setSelected(next);
  };

  const handleMerge = () => {
    if (selected.size < 2 || !primaryChoice) return;
    const newRes = { ...resolutions };
    
    rawNames.forEach(n => {
      const currentCanonical = newRes[n] || n;
      if (selected.has(currentCanonical)) {
        newRes[n] = primaryChoice;
      }
    });
    
    setResolutions(newRes);
    setSelected(new Set());
    setPrimaryChoice('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manual Name Merge</h2>
            <p className="text-gray-500 text-sm">Select multiple names to merge them into one student record.</p>
          </div>
          <button
            onClick={() => onComplete(resolutions)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search names..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {selected.size >= 2 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">Primary Name:</span>
              <select
                value={primaryChoice}
                onChange={e => setPrimaryChoice(e.target.value)}
                className="px-3 py-1.5 border border-blue-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select primary name</option>
                {Array.from(selected).sort((a, b) => String(a).localeCompare(String(b))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleMerge}
              disabled={!primaryChoice}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-sm font-medium"
            >
              <Merge className="w-4 h-4" />
              Merge {selected.size} Names
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
          {filtered.map(name => {
            const isSelected = selected.has(name);
            return (
              <div
                key={name}
                onClick={() => toggleSelect(name)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                  {name}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No names found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

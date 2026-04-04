import React, { useState } from 'react';
import { Users, Check, AlertCircle } from 'lucide-react';

interface DuplicateGroup {
  key: string;
  rawNames: string[];
}

interface DuplicateResolverProps {
  groups: DuplicateGroup[];
  onResolve: (resolutions: Record<string, string>) => void;
}

export function DuplicateResolver({ groups, onResolve }: DuplicateResolverProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const currentGroup = groups[currentIndex];

  const handleResolve = (isSame: boolean) => {
    const newResolutions = { ...resolutions };
    
    if (isSame) {
      // Group them all under the first name
      const canonical = currentGroup.rawNames[0];
      currentGroup.rawNames.forEach(name => {
        newResolutions[name] = canonical;
      });
    } else {
      // Keep them separate
      currentGroup.rawNames.forEach(name => {
        newResolutions[name] = name;
      });
    }

    setResolutions(newResolutions);

    if (currentIndex < groups.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onResolve(newResolutions);
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 mt-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-amber-900">Similar Names Detected</h2>
            <p className="text-amber-700 text-sm mt-1">
              We found multiple students with similar names. Are these the same person?
              ({currentIndex + 1} of {groups.length})
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Matched Key: {currentGroup.key}
            </div>
            <ul className="space-y-2">
              {currentGroup.rawNames.map((name, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-900 font-medium bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => handleResolve(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              <Check className="w-5 h-5" />
              Yes, they are the same person
            </button>
            <button
              onClick={() => handleResolve(false)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-xl transition-colors"
            >
              No, keep them separate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

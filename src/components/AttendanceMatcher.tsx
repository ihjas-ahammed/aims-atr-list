import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, ArrowRight } from 'lucide-react';

interface AttendanceMatcherProps {
  isOpen: boolean;
  onClose: () => void;
  rawNames: string[];
  attendanceNames: string[];
  currentResolutions: Record<string, string>;
  onConfirm: (newResolutions: Record<string, string>) => void;
}

export function AttendanceMatcher({
  isOpen,
  onClose,
  rawNames,
  attendanceNames,
  currentResolutions,
  onConfirm,
}: AttendanceMatcherProps) {
  const [selectedRawName, setSelectedRawName] = useState<string | null>(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [searchAttendance, setSearchAttendance] = useState('');
  const [tempResolutions, setTempResolutions] = useState<Record<string, string>>({});

  // Find unmatched raw names (not in attendance sheet)
  const unmatchedRawNames = useMemo(() => {
    const attendanceSet = new Set(attendanceNames.map(name => name.toUpperCase()));
    
    return rawNames.filter(rawName => {
      const currentCanonical = currentResolutions[rawName] || rawName;
      return !attendanceSet.has(currentCanonical.toUpperCase());
    }).sort((a, b) => a.localeCompare(b));
  }, [rawNames, attendanceNames, currentResolutions]);

  const filteredRawNames = unmatchedRawNames.filter(name =>
    name.toLowerCase().includes(searchRaw.toLowerCase())
  );

  const filteredAttendanceNames = attendanceNames.filter(name =>
    name.toLowerCase().includes(searchAttendance.toLowerCase())
  );

  const handleMatch = (attendanceName: string) => {
    if (!selectedRawName) return;
    
    setTempResolutions(prev => ({
      ...prev,
      [selectedRawName]: attendanceName
    }));
    
    // Move to next unmatched name
    const currentIndex = filteredRawNames.indexOf(selectedRawName);
    if (currentIndex < filteredRawNames.length - 1) {
      setSelectedRawName(filteredRawNames[currentIndex + 1]);
    } else {
      setSelectedRawName(null);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempResolutions);
    onClose();
  };

  const getResolvedName = (rawName: string) => {
    return tempResolutions[rawName] || currentResolutions[rawName] || rawName;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Match Names with Attendance Sheet</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select unmatched names on the left and match them with attendance sheet names on the right.
              {unmatchedRawNames.length} unmatched names found.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-6 p-6 h-full">
            {/* Left side: Unmatched raw names */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Unmatched Names</h3>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search unmatched names..."
                    value={searchRaw}
                    onChange={e => setSearchRaw(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {filteredRawNames.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {unmatchedRawNames.length === 0 ? 'All names are matched!' : 'No names match your search.'}
                    </div>
                  ) : (
                    filteredRawNames.map(rawName => {
                      const isSelected = selectedRawName === rawName;
                      const isMatched = tempResolutions[rawName];
                      return (
                        <div
                          key={rawName}
                          onClick={() => !isMatched && setSelectedRawName(rawName)}
                          className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 
                            isMatched ? 'bg-green-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm ${isMatched ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                            {rawName}
                          </span>
                          {isMatched && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedRawName && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="text-sm text-blue-900">
                    <strong>Selected:</strong> {selectedRawName}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    Current resolution: {getResolvedName(selectedRawName)}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Attendance sheet names */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance Sheet Names</h3>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search attendance names..."
                    value={searchAttendance}
                    onChange={e => setSearchAttendance(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {filteredAttendanceNames.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No names match your search.
                    </div>
                  ) : (
                    filteredAttendanceNames.map(attendanceName => (
                      <div
                        key={attendanceName}
                        onClick={() => selectedRawName && handleMatch(attendanceName)}
                        className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedRawName ? 'hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-sm text-gray-700">{attendanceName}</span>
                        {selectedRawName && <ArrowRight className="w-4 h-4 text-blue-600" />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {!selectedRawName && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-sm text-gray-600">
                    Select a name from the left side to start matching.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-sm text-gray-500">
            {Object.keys(tempResolutions).length} names matched. Click names on the left to select, then click attendance names on the right to match.
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
              disabled={Object.keys(tempResolutions).length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm {Object.keys(tempResolutions).length} Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

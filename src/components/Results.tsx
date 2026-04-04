import React, { useState, useEffect } from 'react';
import { DayResult, Top20Entry } from '../types';
import { Printer, Trophy, TrendingUp, TrendingDown, Minus, Award, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { AvatarCropper } from './AvatarCropper';
import { getAvatar, saveAvatar } from '../lib/db';

interface ResultsProps {
  results: DayResult[];
}

export function Results({ results }: ResultsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [headerTitle, setHeaderTitle] = useState('AIMS PLUS Track Record');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedTitle = localStorage.getItem('aims_header_title');
    if (savedTitle) setHeaderTitle(savedTitle);
  }, []);

  useEffect(() => {
    // Load avatars for current top 20
    if (!results || results.length === 0) return;
    const currentResult = results[activeTab];
    
    const loadAvatars = async () => {
      const newAvatars: Record<string, string> = { ...avatars };
      for (const student of currentResult.top20) {
        if (!newAvatars[student.canonicalName]) {
          const img = await getAvatar(student.canonicalName);
          if (img) newAvatars[student.canonicalName] = img;
        }
      }
      setAvatars(newAvatars);
    };
    loadAvatars();
  }, [results, activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const saveTitle = () => {
    setHeaderTitle(tempTitle);
    localStorage.setItem('aims_header_title', tempTitle);
    setIsEditingTitle(false);
  };

  const openCropper = (name: string) => {
    setSelectedStudent(name);
    setCropperOpen(true);
  };

  const handleSaveAvatar = async (base64Image: string) => {
    await saveAvatar(selectedStudent, base64Image);
    setAvatars(prev => ({ ...prev, [selectedStudent]: base64Image }));
  };

  if (!results || results.length === 0) return null;

  const currentResult = results[activeTab];

  const getRankStyle = (rank: number, status: string) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-400 shadow-yellow-200/50 shadow-lg scale-105 z-10";
    if (rank === 2) return "bg-gradient-to-br from-gray-100 to-gray-300 border-gray-400 shadow-gray-200/50 shadow-md scale-[1.02] z-10";
    if (rank === 3) return "bg-gradient-to-br from-orange-100 to-orange-300 border-orange-400 shadow-orange-200/50 shadow-md scale-[1.02] z-10";
    if (status === 'added') return "bg-green-50 border-green-200 shadow-green-100 shadow-sm";
    return "bg-white border-gray-200 hover:border-blue-200 hover:shadow-md";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-white";
    if (rank === 2) return "bg-gray-400 text-white";
    if (rank === 3) return "bg-orange-500 text-white";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3 group">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="text-3xl font-bold tracking-tight text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent px-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              />
              <button onClick={saveTitle} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{headerTitle}</h1>
              <button 
                onClick={() => { setTempTitle(headerTitle); setIsEditingTitle(true); }}
                className="p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{headerTitle}</h1>
        <p className="text-xl text-gray-600 mt-2">{currentResult.examName}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="flex overflow-x-auto border-b border-gray-200 print:hidden hide-scrollbar">
          {results.map((result, idx) => (
            <button
              key={result.examId}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                activeTab === idx
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {result.examName}
            </button>
          ))}
        </div>

        <div className="p-6 print:p-0 bg-gray-50/50 print:bg-transparent">
          <div className="mb-6 print:hidden">
            <h2 className="text-xl font-bold text-gray-900">{currentResult.examName} - Top {currentResult.top20.length}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:gap-4">
            {currentResult.top20.map((student) => (
              <div 
                key={student.canonicalName}
                className={cn(
                  "relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300",
                  getRankStyle(student.rank, student.status)
                )}
              >
                <div className={cn(
                  "absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white",
                  getRankBadge(student.rank)
                )}>
                  {student.rank}
                </div>
                
                {student.status === 'added' && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 shadow-sm" title="New to List">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                )}

                <div 
                  className="w-24 h-24 rounded-full mb-4 cursor-pointer relative group overflow-hidden border-4 border-white shadow-md bg-white"
                  onClick={() => openCropper(student.canonicalName)}
                >
                  {avatars[student.canonicalName] ? (
                    <img src={avatars[student.canonicalName]} alt={student.canonicalName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl font-bold text-blue-700">
                      {student.canonicalName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 text-center leading-tight mb-1">
                  {student.canonicalName}
                </h3>
                
                <div className="text-2xl font-black text-blue-600 mb-4">
                  {student.currentAverage.toFixed(2)}
                </div>

                <div className="w-full grid grid-cols-2 gap-2 text-sm border-t border-black/5 pt-4 mt-auto">
                  <div className="flex flex-col items-center p-2 bg-black/5 rounded-lg">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Exams</span>
                    <span className="font-bold text-gray-700">{student.totalExamsAttended}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-black/5 rounded-lg">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Hat-tricks</span>
                    <span className="font-bold text-gray-700 flex items-center gap-1">
                      {student.hatTricks > 0 ? (
                        <>
                          <Award className="w-3 h-3 text-amber-500" />
                          {student.hatTricks}
                        </>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {currentResult.top20.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                No data available for this exam.
              </div>
            )}
          </div>

          {currentResult.removed.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Dropped from List
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {currentResult.removed.map(student => (
                  <div key={student.canonicalName} className="flex flex-col items-center p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="w-12 h-12 rounded-full mb-2 overflow-hidden border-2 border-white shadow-sm">
                      {avatars[student.canonicalName] ? (
                        <img src={avatars[student.canonicalName]} alt={student.canonicalName} className="w-full h-full object-cover grayscale opacity-80" />
                      ) : (
                        <div className="w-full h-full bg-red-100 flex items-center justify-center text-lg font-bold text-red-400">
                          {student.canonicalName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 text-sm text-center line-clamp-1 w-full" title={student.canonicalName}>
                      {student.canonicalName}
                    </span>
                    <span className="text-xs font-bold text-red-500 mt-1">
                      Avg: {student.currentAverage.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AvatarCropper 
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onSave={handleSaveAvatar}
        studentName={selectedStudent}
      />
    </div>
  );
}

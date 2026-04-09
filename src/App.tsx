import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Setup } from './components/Setup';
import { ManualMerge } from './components/ManualMerge';
import { DuplicateResolver } from './components/DuplicateResolver';
import { Results } from './components/Results';
import { AISettings, defaultNameList } from './components/AISettings';
import { AIConfirmation } from './components/AIConfirmation';
import { AttendanceMatcher } from './components/AttendanceMatcher';
import { ExamFile, SubjectType, RawRecord, ProcessedRecord, StudentState, DayResult, Top20Entry } from './types';
import { GoogleGenAI, Type } from '@google/genai';
import { Settings, Zap, FileText } from 'lucide-react';

type Step = 'setup' | 'manual_merge' | 'resolve_duplicates' | 'results';

export default function App() {
  const [step, setStep] = useState<Step>('setup');
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [rightMarks, setRightMarks] = useState(4);
  const [wrongMarks, setWrongMarks] = useState(1);
  
  const [rawNames, setRawNames] = useState<string[]>([]);
  const [pendingGroups, setPendingGroups] = useState<{ key: string; rawNames: string[] }[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DayResult[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMatchingAI, setIsMatchingAI] = useState(false);
  const [aiProposals, setAIProposals] = useState<Record<string, string> | null>(null);
  const [isAIConfirmationOpen, setIsAIConfirmationOpen] = useState(false);
  const [aiOfficialNames, setAIOfficialNames] = useState<string[]>([]);
  const [isAttendanceMatcherOpen, setIsAttendanceMatcherOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('aims_name_resolutions');
    if (saved) {
      try {
        setResolutions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved resolutions');
      }
    }
  }, []);

  const getCanonicalKey = (name: string) => {
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  const normalizeName = (name: string) =>
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9 ]+/g, '')
      .replace(/\s+/g, ' ');

  const getNameParts = (name: string) => normalizeName(name).split(' ').filter(Boolean);

  const longestCommonSubstring = (a: string, b: string) => {
    const n = a.length;
    const m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    let best = 0;
    for (let i = 1; i <= n; i += 1) {
      for (let j = 1; j <= m; j += 1) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          best = Math.max(best, dp[i][j]);
        }
      }
    }
    return best;
  };

  const guessLogicMatch = (rawName: string, officialNames: string[]) => {
    const rawNorm = normalizeName(rawName);
    const rawParts = getNameParts(rawNorm);
    if (rawParts.length === 0) return null;

    const rawFirst = rawParts[0] || '';
    const rawSecond = rawParts[1] || '';
    const rawConcat = rawParts.join('');

    let bestMatch: { name: string; score: number } | null = null;

    for (const officialName of officialNames) {
      const offNorm = normalizeName(officialName);
      if (rawNorm === offNorm) continue;

      const offParts = getNameParts(offNorm);
      const offFirst = offParts[0] || '';
      const offSecond = offParts[1] || '';
      const offConcat = offParts.join('');

      let score = 0;
      if (rawSecond && offSecond && rawSecond === offSecond) score += 35;
      if (rawFirst && offFirst && rawFirst === offFirst) score += 20;
      if (rawFirst?.[0] && offFirst?.[0] && rawFirst[0] === offFirst[0]) score += 10;
      if (rawSecond && offSecond && rawSecond[0] === offSecond[0]) score += 5;
      if (rawFirst === offFirst && rawSecond && offSecond && rawSecond[0] === offSecond[0]) score += 15;
      const lcs = longestCommonSubstring(rawConcat, offConcat);
      if (lcs >= 4) score += lcs * 3;
      if (offNorm.includes(rawNorm) || rawNorm.includes(offNorm)) score += 10;

      if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && offNorm.length < normalizeName(bestMatch.name).length)) {
        bestMatch = { name: officialName, score };
      }
    }

    return bestMatch && bestMatch.score >= 45 ? bestMatch.name : null;
  };

  const chunkArray = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const handleProcess = async (selectedExams: ExamFile[], right: number, wrong: number) => {
    setExams(selectedExams);
    setRightMarks(right);
    setWrongMarks(wrong);

    // 1. Read all files
    const parsedExams: ExamFile[] = [];
    const allRawNames = new Set<string>();

    for (const exam of selectedExams) {
      const data = await readExcelFile(exam.file);
      parsedExams.push({ ...exam, data });
      
      data.forEach(row => {
        if (row.NAME) {
          allRawNames.add(row.NAME.trim().toUpperCase());
        }
      });
    }

    setExams(parsedExams);
    setRawNames(Array.from(allRawNames));

    // 2. Group names to find duplicates using current canonical names
    const groups = new Map<string, Set<string>>();
    allRawNames.forEach(rawName => {
      const currentCanonical = resolutions[rawName] || rawName;
      const key = getCanonicalKey(currentCanonical);
      if (!groups.has(key)) {
        groups.set(key, new Set());
      }
      groups.get(key)!.add(currentCanonical);
    });

    // 3. Find groups that need resolution
    const needsResolution: { key: string; rawNames: string[] }[] = [];
    groups.forEach((namesSet, key) => {
      if (namesSet.size > 1) {
        const names = Array.from(namesSet);
        // Check if all names in this group are already resolved
        const allResolved = names.every(name => resolutions[name] !== undefined);
        if (!allResolved) {
          needsResolution.push({ key, rawNames: names });
        }
      }
    });

    if (needsResolution.length > 0) {
      setPendingGroups(needsResolution);
      setStep('resolve_duplicates');
    } else {
      handleResolutionComplete({});
    }
  };

  const handleResolutionComplete = (newResolutions: Record<string, string>) => {
    const combinedResolutions = { ...resolutions, ...newResolutions };
    
    // Auto-resolve singletons
    rawNames.forEach(rawName => {
      if (!combinedResolutions[rawName]) {
        combinedResolutions[rawName] = rawName;
      }
    });

    setResolutions(combinedResolutions);
    localStorage.setItem('aims_name_resolutions', JSON.stringify(combinedResolutions));
    
    // Move to manual merge step
    setStep('manual_merge');
  };

  const handleManualMergeComplete = (mergedResolutions: Record<string, string>) => {
    const combinedResolutions = { ...resolutions, ...mergedResolutions };
    setResolutions(combinedResolutions);
    localStorage.setItem('aims_name_resolutions', JSON.stringify(combinedResolutions));
    
    calculateResults(exams, combinedResolutions, rightMarks, wrongMarks);
  };

  const handleAIMatch = async () => {
    const apiKey = localStorage.getItem('aims_ai_api_key');
    const modelName = localStorage.getItem('aims_ai_model') || 'gemini-3.1-flash-preview';
    const nameList = localStorage.getItem('aims_ai_name_list') || defaultNameList;
    const batchSize = Math.max(1, parseInt(localStorage.getItem('aims_ai_batch_size') || '20', 10));

    if (!apiKey) {
      alert("Please configure AI settings first by clicking the settings icon in the header.");
      setIsSettingsOpen(true);
      return;
    }

    if (rawNames.length === 0) {
      alert('No raw names are available for AI matching. Process exam files first.');
      return;
    }

    setIsMatchingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const officialNames = Array.from(
        new Set([
          ...nameList.split(',').map(name => name.trim()).filter(Boolean),
          ...rawNames
        ])
      ).sort((a, b) => a.localeCompare(b));

      const batches = chunkArray(rawNames, batchSize);
      const allChanged: Record<string, string> = {};

      for (const batch of batches) {
        const currentResolutions = batch.map(rawName => {
          const resolved = resolutions[rawName] || rawName;
          return `${rawName}: ${resolved}`;
        }).join('\n');

        const prompt = `You are an expert at matching student names.
I have a master list of official student names:
${nameList}

I have a batch of raw names extracted from exam sheets:
${batch.join(', ')}

Current resolved names for this batch are:
${currentResolutions}

For each raw name in this batch, choose the best matching canonical name from the master list.
Only return a JSON object containing entries for raw names where the final canonical name should be different from the raw name.
Do not include unchanged names.
Return only valid JSON without extra text.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              description: "A dictionary mapping only changed raw names to official names.",
              additionalProperties: {
                type: Type.STRING
              }
            }
          }
        });

        if (response.text) {
          const mapping = JSON.parse(response.text.trim());
          Object.entries(mapping).forEach(([rawName, canonicalName]) => {
            if (!rawName) return;
            const normalized = String(canonicalName).trim();
            if (normalized && normalized !== rawName) {
              allChanged[rawName] = normalized;
            }
          });
        }
      }

      if (Object.keys(allChanged).length === 0) {
        setAIProposals(null);
        alert('AI completed matching and found no changed mappings.');
      } else {
        setAIOfficialNames(officialNames);
        setAIProposals(allChanged);
        setIsAIConfirmationOpen(true);
      }
    } catch (error: any) {
      console.error(error);
      alert("AI Matching failed: " + error.message);
    } finally {
      setIsMatchingAI(false);
    }
  };

  const handleLogicMatch = () => {
    const nameList = localStorage.getItem('aims_ai_name_list') || defaultNameList;
    const officialNames = Array.from(
      new Set([
        ...nameList.split(',').map(name => name.trim()).filter(Boolean),
        ...Object.values(resolutions),
        ...rawNames
      ])
    ).sort((a, b) => a.localeCompare(b));

    const changedMatches: Record<string, string> = {};

    rawNames.forEach(rawName => {
      const currentCanonical = resolutions[rawName] || rawName;
      const guess = guessLogicMatch(rawName, officialNames);
      if (guess && guess !== currentCanonical) {
        changedMatches[rawName] = guess;
      }
    });

    if (Object.keys(changedMatches).length === 0) {
      alert('Logic matching found no changed mappings.');
      return;
    }

    setAIOfficialNames(officialNames);
    setAIProposals(changedMatches);
    setIsAIConfirmationOpen(true);
  };

  const handleFixWithAttendance = () => {
    const nameList = localStorage.getItem('aims_ai_name_list') || defaultNameList;
    if (!nameList.trim()) {
      alert('Please configure the attendance sheet names in AI settings first.');
      setIsSettingsOpen(true);
      return;
    }

    const officialNames = nameList.split(',').map(name => name.trim()).filter(Boolean);
    if (officialNames.length === 0) {
      alert('No names found in attendance sheet. Please add names in AI settings.');
      setIsSettingsOpen(true);
      return;
    }

    setAIOfficialNames(officialNames);
    setIsAttendanceMatcherOpen(true);
  };

  const handleConfirmAIMapping = (updatedMappings: Record<string, string>) => {
    const combinedResolutions = { ...resolutions, ...updatedMappings };
    setResolutions(combinedResolutions);
    localStorage.setItem('aims_name_resolutions', JSON.stringify(combinedResolutions));
    setAIProposals(null);
    setIsAIConfirmationOpen(false);
    alert('AI matches confirmed. You can continue reviewing or merge manually.');
  };

  const handleCancelAIMapping = () => {
    setAIProposals(null);
    setIsAIConfirmationOpen(false);
  };

  const handleAttendanceMatcherConfirm = (newResolutions: Record<string, string>) => {
    const combinedResolutions = { ...resolutions, ...newResolutions };
    setResolutions(combinedResolutions);
    localStorage.setItem('aims_name_resolutions', JSON.stringify(combinedResolutions));
    setIsAttendanceMatcherOpen(false);
    alert(`Successfully matched ${Object.keys(newResolutions).length} names with attendance sheet.`);
  };

  const readExcelFile = (file: File): Promise<RawRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);
          
          // Normalize column names to uppercase and trim spaces
          const normalized = json.map(row => {
            const norm: any = {};
            Object.keys(row).forEach(k => {
              norm[k.trim().toUpperCase()] = row[k];
            });
            return norm as RawRecord;
          });
          
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const calculateResults = (
    parsedExams: ExamFile[], 
    currentResolutions: Record<string, string>,
    rightM: number,
    wrongM: number
  ) => {
    const students: Record<string, StudentState> = {};
    const dayResults: DayResult[] = [];
    let previousTop20: Set<string> = new Set();

    parsedExams.forEach((exam, examIndex) => {
      const isMZB = ['Maths', 'Zoology', 'Botany'].includes(exam.subject);
      
      // Process current exam data
      const currentExamScores = new Map<string, number>();
      
      exam.data?.forEach(row => {
        if (!row.NAME) return;
        const rawName = row.NAME.trim().toUpperCase();
        const canonicalName = currentResolutions[rawName] || rawName;
        
        const right = Number(row.RIGHT) || 0;
        const wrong = Number(row.WRONG) || 0;
        const score = (right * rightM) - (wrong * wrongM);
        
        currentExamScores.set(canonicalName, score);
      });

      // Update student states
      Object.keys(students).forEach(canonicalName => {
        const student = students[canonicalName];
        const attendedToday = currentExamScores.has(canonicalName);
        const wasAbsentYesterday = examIndex > 0 && student.lastAttendedExamIndex < examIndex - 1;

        if (!isMZB && wasAbsentYesterday) {
          // Reset score history if absent yesterday and today is not MZB
          student.scores = [];
        }
      });

      // Add new scores and update attendance
      currentExamScores.forEach((score, canonicalName) => {
        if (!students[canonicalName]) {
          students[canonicalName] = {
            canonicalName,
            scores: [],
            totalExamsAttended: 0,
            lastAttendedExamIndex: -1,
            hatTricks: 0,
            consecutiveTop20: 0,
            currentAverage: 0
          };
        }
        
        const student = students[canonicalName];
        student.scores.push(score);
        student.totalExamsAttended++;
        student.lastAttendedExamIndex = examIndex;
      });

      // Calculate averages
      const currentRankings: StudentState[] = Object.values(students)
        .filter(s => s.scores.length > 0) // Only rank students with active scores
        .map(s => {
          const sum = s.scores.reduce((a, b) => a + b, 0);
          s.currentAverage = sum / s.scores.length;
          return s;
        })
        .sort((a, b) => b.currentAverage - a.currentAverage);

      // Take Top N (Day 1: Top 10, Day 2+: Top 20)
      const limit = examIndex === 0 ? 10 : 20;
      const topN = currentRankings.slice(0, limit);
      const currentTopNSet = new Set(topN.map(s => s.canonicalName));

      // Update Hat-tricks and Consecutive counts
      Object.values(students).forEach(student => {
        if (currentTopNSet.has(student.canonicalName)) {
          student.consecutiveTop20++;
          if (student.consecutiveTop20 > 0 && student.consecutiveTop20 % 3 === 0) {
            student.hatTricks++;
          }
        } else {
          student.consecutiveTop20 = 0;
        }
      });

      // Determine Added/Removed status
      const topNEntries: Top20Entry[] = topN.map((student, idx) => {
        let status: 'added' | 'removed' | 'same' = 'same';
        if (examIndex > 0 && !previousTop20.has(student.canonicalName)) {
          status = 'added';
        }
        return { ...student, rank: idx + 1, status };
      });

      const removedEntries: Top20Entry[] = [];
      if (examIndex > 0) {
        previousTop20.forEach(canonicalName => {
          if (!currentTopNSet.has(canonicalName)) {
            const student = students[canonicalName];
            if (student) {
              removedEntries.push({ ...student, rank: 0, status: 'removed' });
            }
          }
        });
      }

      dayResults.push({
        examId: exam.id,
        examName: exam.name,
        top20: topNEntries,
        removed: removedEntries.sort((a, b) => b.currentAverage - a.currentAverage)
      });

      previousTop20 = currentTopNSet;
    });

    setResults(dayResults);
    setStep('results');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">AIMS PLUS</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="AI Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {step !== 'setup' && (
              <button
                onClick={() => {
                  setStep('setup');
                  setExams([]);
                  setResults([]);
                  setPendingGroups([]);
                  setRawNames([]);
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">
        {step === 'setup' && (
          <Setup onProcess={handleProcess} />
        )}

        {step === 'manual_merge' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-end gap-3 px-6">
              <button
                onClick={handleAIMatch}
                disabled={isMatchingAI}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium shadow-sm"
              >
                {isMatchingAI ? (
                  <span className="animate-pulse">Matching with AI...</span>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Auto-Match with AI
                  </>
                )}
              </button>
              <button
                onClick={handleLogicMatch}
                disabled={isMatchingAI}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 transition-colors font-medium shadow-sm"
              >
                <Zap className="w-4 h-4" />
                Logic Match
              </button>
              <button
                onClick={handleFixWithAttendance}
                disabled={isMatchingAI}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Fix with Attendance
              </button>
            </div>
            <ManualMerge 
              rawNames={rawNames}
              initialResolutions={resolutions}
              onComplete={handleManualMergeComplete}
            />
          </div>
        )}
        
        {step === 'resolve_duplicates' && (
          <DuplicateResolver 
            groups={pendingGroups} 
            onResolve={handleResolutionComplete} 
          />
        )}

        {step === 'results' && (
          <Results results={results} />
        )}
      </main>

      {aiProposals && (
        <AIConfirmation
          isOpen={isAIConfirmationOpen}
          proposedResolutions={aiProposals}
          officialNames={aiOfficialNames}
          onClose={handleCancelAIMapping}
          onConfirm={handleConfirmAIMapping}
        />
      )}

      <AISettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <AttendanceMatcher
        isOpen={isAttendanceMatcherOpen}
        onClose={() => setIsAttendanceMatcherOpen(false)}
        rawNames={rawNames}
        attendanceNames={aiOfficialNames}
        currentResolutions={resolutions}
        onConfirm={handleAttendanceMatcherConfirm}
      />
    </div>
  );
}

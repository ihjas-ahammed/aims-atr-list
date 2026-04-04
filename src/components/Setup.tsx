import React, { useState, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, Settings } from 'lucide-react';
import { ExamFile, SubjectType } from '../types';
import { cn } from '../lib/utils';

interface SetupProps {
  onProcess: (exams: ExamFile[], rightMarks: number, wrongMarks: number) => void;
}

export function Setup({ onProcess }: SetupProps) {
  const [exams, setExams] = useState<ExamFile[]>([]);
  const [rightMarks, setRightMarks] = useState<number>(4);
  const [wrongMarks, setWrongMarks] = useState<number>(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        subject: 'General' as SubjectType,
      }));
      setExams((prev) => [...prev, ...newFiles]);
    }
  };

  const removeExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  const updateSubject = (id: string, subject: SubjectType) => {
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, subject } : e))
    );
  };

  const moveExam = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exams.length - 1)
    ) {
      return;
    }
    
    const newExams = [...exams];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newExams[index], newExams[swapIndex]] = [newExams[swapIndex], newExams[index]];
    setExams(newExams);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AIMS PLUS ATR Setup</h1>
        <p className="text-gray-500">Upload your rank lists to generate the Track Record.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Marking Scheme</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Marks for Right Answer</label>
            <input
              type="number"
              value={rightMarks}
              onChange={(e) => setRightMarks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Marks Deducted for Wrong Answer</label>
            <input
              type="number"
              value={wrongMarks}
              onChange={(e) => setWrongMarks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Rank Lists</h2>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
            <Upload className="w-4 h-4" />
            Upload Excel Files
            <input
              type="file"
              multiple
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p className="text-gray-500">No files uploaded yet. Upload Day 1 to Day N rank lists.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam, index) => (
              <div key={exam.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200 text-gray-500 font-medium text-sm">
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                </div>
                <div className="flex-shrink-0 w-48">
                  <select
                    value={exam.subject}
                    onChange={(e) => updateSubject(exam.id, e.target.value as SubjectType)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Maths">Maths</option>
                    <option value="Zoology">Zoology</option>
                    <option value="Botany">Botany</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveExam(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-md transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveExam(index, 'down')}
                    disabled={index === exams.length - 1}
                    className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400 rounded-md transition-colors"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeExam(exam.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onProcess(exams, rightMarks, wrongMarks)}
          disabled={exams.length === 0}
          className={cn(
            "px-6 py-3 rounded-xl font-medium text-white transition-all shadow-sm",
            exams.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95"
          )}
        >
          Process Rank Lists
        </button>
      </div>
    </div>
  );
}

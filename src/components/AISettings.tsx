import React, { useState, useEffect } from 'react';
import { X, Settings, RefreshCw, Save, Upload } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const defaultNameList = `ADIL MARZOOQUE, ADISANKAR, ADITHYA RAJ, ADWAID, AHAMED IRFAN K, AHAMED JUNAID, AHLAM HASAN K, AMAL CHANDRA N, ANJANA K, ANSHIA P, ANSILA KADOORAN, APARNA C, ARSHA FATHIMA M, ARSHIN PC, ASWATHY E, ATHUL VB, AVANI PS, AZAL MHD, DIYA AK, DIYA MEHRIN K, DIYA V, FAHMA VP, FARHA P, FATHIMA FIZA M, FATHIMA HIBA PP, FATHIMA HUDA N, FATHIMA LIYA A, FATHIMA MINHA PE, FATHIMA MISBHA VA, FATHIMA NASHA, FATHIMA RIFNA A, FATHIMA SHAHNA PK, FIDA THASNIM, GOURI NANDA C, HAMNA FATHIMA, HANIYYA V, HASNA SHARI VP, HIBA FATHIMA KP, HIBA FATHIMA PA, HISHAM MHD, KRISHNA PRIYA PC, LASIN ABDULLA, LISNA K, LIYA FATHIMA A, MAJID A, MAZIN MHD, MHD ADNAN K, MHD AHANN TK, MHD ANAS P, MHD ANFAS TK, MHD ASHFAQUE, MHD DANISH, MHD DIYAN, MHD FAIROOZ, MHD FARHAN K, MHD FATHIN ALI, MHD LIYAN P, MHD MUFLIH A, MHD NAJADH, MHD RAZAL T, MHD RISHAN P, MHD SABITH P, MHD SABITH TK, MHD SADHIL V, MHD SHAFEEQ KK, MHD SHAHABAS K, MHD SINAN A, MILHA RAZACK A, MINHA PK, MISHAL AHAMED, NAIRA ABDUL LATHEEF, NAJIYA NASRIN C, NASHA FATHIMA P, NIDHA FATHIMA K, NIDHA SHIRIN N, NITHIN RAJ, RAJEEBA K, RANA FATHIMA K, REHAN ABDUL RAHEEM, REVATHY K, RIDHA K, RIFA CP, RIFA P, RINSHA JALIDHA P, RINSHA SHERIN T, RIYA SUNEER, SHABANA JASMIN, SILNA FATHIMA, SITHARA BASHEER P, SIYA TP, THANHA FATHIMA`;

export function AISettings({ isOpen, onClose }: AISettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-3.1-flash-preview');
  const [nameList, setNameList] = useState(defaultNameList);
  const [batchSize, setBatchSize] = useState(20);
  const [models, setModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('aims_ai_api_key') || '';
    const savedModel = localStorage.getItem('aims_ai_model') || 'gemini-3.1-flash-preview';
    const savedList = localStorage.getItem('aims_ai_name_list') || defaultNameList;
    const savedBatch = parseInt(localStorage.getItem('aims_ai_batch_size') || '20', 10);
    
    setApiKey(savedKey);
    setModelName(savedModel);
    setNameList(savedList);
    setBatchSize(Number.isNaN(savedBatch) || savedBatch < 1 ? 20 : savedBatch);
  }, [isOpen]);

  const fetchModels = async () => {
    if (!apiKey) {
      setError('Please enter an API key first.');
      return;
    }
    setIsFetching(true);
    setError('');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch models');
      }

      if (data.models) {
        const modelNames = data.models
          .filter((m: any) => m.name.includes('gemini'))
          .map((m: any) => m.name.replace('models/', ''));
        setModels(modelNames);
        if (modelNames.length > 0 && !modelNames.includes(modelName)) {
          setModelName(modelNames[0]);
        }
      } else {
        throw new Error('No models found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('aims_ai_api_key', apiKey);
    localStorage.setItem('aims_ai_model', modelName);
    localStorage.setItem('aims_ai_name_list', nameList);
    localStorage.setItem('aims_ai_batch_size', String(batchSize));
    onClose();
  };

  const handleAttendanceSheetUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);
          
          // Try to find name column - common variations
          const possibleColumns = ['NAME', 'STUDENT NAME', 'STUDENT_NAME', 'FULL NAME', 'FULL_NAME', 'NAME'];
          let nameColumn = '';
          
          // Check headers
          if (json.length > 0) {
            const firstRow = json[0];
            const headers = Object.keys(firstRow).map(k => k.trim().toUpperCase());
            
            for (const col of possibleColumns) {
              if (headers.includes(col)) {
                nameColumn = Object.keys(firstRow).find(k => k.trim().toUpperCase() === col) || '';
                break;
              }
            }
          }
          
          if (!nameColumn) {
            // Try to find a column that looks like names
            if (json.length > 0) {
              const firstRow = json[0];
              for (const [key, value] of Object.entries(firstRow)) {
                if (typeof value === 'string' && value.trim().length > 0) {
                  // Check if it looks like a name (contains spaces or is alphabetic)
                  const val = value.trim();
                  if (val.includes(' ') || /^[A-Z\s]+$/i.test(val)) {
                    nameColumn = key;
                    break;
                  }
                }
              }
            }
          }
          
          if (!nameColumn) {
            throw new Error('Could not find a name column in the attendance sheet. Please ensure the file has a column with student names.');
          }
          
          // Extract names
          const names = json
            .map((row: any) => row[nameColumn])
            .filter((name: any) => name && typeof name === 'string')
            .map((name: string) => name.trim().toUpperCase())
            .filter((name: string) => name.length > 0);
          
          if (names.length === 0) {
            throw new Error('No valid names found in the attendance sheet.');
          }
          
          // Remove duplicates and sort
          const uniqueNames = Array.from(new Set(names)).sort();
          const nameListString = uniqueNames.join(', ');
          
          setNameList(nameListString);
          setError(`Successfully imported ${uniqueNames.length} names from attendance sheet.`);
        } catch (error: any) {
          setError('Failed to parse attendance sheet: ' + error.message);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsUploading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      setError('Failed to process file: ' + error.message);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Matching Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Model Name</label>
              <button 
                onClick={fetchModels}
                disabled={isFetching}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                Fetch Models
              </button>
            </div>
            {models.length > 0 ? (
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">AI Batch Size</label>
            <input
              type="number"
              min={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500">Split raw names into smaller AI batches to reduce latency and improve reliability.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Master Name List (Attendance Sheet)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAttendanceSheetUpload(file);
                  }
                }}
                className="hidden"
                id="attendance-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="attendance-upload"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors text-sm"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Importing...' : 'Import from Excel'}
              </label>
              <span className="text-xs text-gray-500 self-center">Upload attendance sheet to auto-populate names</span>
            </div>
            <textarea
              value={nameList}
              onChange={(e) => setNameList(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              placeholder="Comma separated list of official names..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

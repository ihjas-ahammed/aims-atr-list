import React, { useState, useEffect } from 'react';
import { X, Settings, RefreshCw, Save } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const defaultNameList = `ADIL MARZOOQUE, ADISANKAR, ADITHYA RAJ, ADWAID, AHAMED IRFAN K, AHAMED JUNAID, AHLAM HASAN K, AMAL CHANDRA N, ANJANA K, ANSHIA P, ANSILA KADOORAN, APARNA C, ARSHA FATHIMA M, ARSHIN PC, ASWATHY E, ATHUL VB, AVANI PS, AZAL MHD, DIYA AK, DIYA MEHRIN K, DIYA V, FAHMA VP, FARHA P, FATHIMA FIZA M, FATHIMA HIBA PP, FATHIMA HUDA N, FATHIMA LIYA A, FATHIMA MINHA PE, FATHIMA MISBHA VA, FATHIMA NASHA, FATHIMA RIFNA A, FATHIMA SHAHNA PK, FIDA THASNIM, GOURI NANDA C, HAMNA FATHIMA, HANIYYA V, HASNA SHARI VP, HIBA FATHIMA KP, HIBA FATHIMA PA, HISHAM MHD, KRISHNA PRIYA PC, LASIN ABDULLA, LISNA K, LIYA FATHIMA A, MAJID A, MAZIN MHD, MHD ADNAN K, MHD AHANN TK, MHD ANAS P, MHD ANFAS TK, MHD ASHFAQUE, MHD DANISH, MHD DIYAN, MHD FAIROOZ, MHD FARHAN K, MHD FATHIN ALI, MHD LIYAN P, MHD MUFLIH A, MHD NAJADH, MHD RAZAL T, MHD RISHAN P, MHD SABITH P, MHD SABITH TK, MHD SADHIL V, MHD SHAFEEQ KK, MHD SHAHABAS K, MHD SINAN A, MILHA RAZACK A, MINHA PK, MISHAL AHAMED, NAIRA ABDUL LATHEEF, NAJIYA NASRIN C, NASHA FATHIMA P, NIDHA FATHIMA K, NIDHA SHIRIN N, NITHIN RAJ, RAJEEBA K, RANA FATHIMA K, REHAN ABDUL RAHEEM, REVATHY K, RIDHA K, RIFA CP, RIFA P, RINSHA JALIDHA P, RINSHA SHERIN T, RIYA SUNEER, SHABANA JASMIN, SILNA FATHIMA, SITHARA BASHEER P, SIYA TP, THANHA FATHIMA`;

export function AISettings({ isOpen, onClose }: AISettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-3.1-flash-preview');
  const [nameList, setNameList] = useState(defaultNameList);
  const [models, setModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('aims_ai_api_key') || '';
    const savedModel = localStorage.getItem('aims_ai_model') || 'gemini-3.1-flash-preview';
    const savedList = localStorage.getItem('aims_ai_name_list') || defaultNameList;
    
    setApiKey(savedKey);
    setModelName(savedModel);
    setNameList(savedList);
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
    onClose();
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
            <label className="text-sm font-medium text-gray-700">Master Name List (Attendance Sheet)</label>
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

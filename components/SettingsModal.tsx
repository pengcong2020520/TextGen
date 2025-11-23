import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../types';
import { validateConnection } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
}

// Preset configurations for popular OpenAI-compatible APIs
const PRESETS = [
  { 
    name: 'Moonshot (Kimi)', 
    baseUrl: 'https://api.moonshot.cn/v1', 
    model: 'moonshot-v1-8k',
    desc: 'High quality Chinese context'
  },
  { 
    name: 'DeepSeek', 
    baseUrl: 'https://api.deepseek.com', 
    model: 'deepseek-chat',
    desc: 'Coding & reasoning specialist'
  },
  { 
    name: 'Qwen (Aliyun)', 
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    model: 'qwen-plus',
    desc: 'Alibaba Cloud Qwen models'
  },
  { 
    name: 'Doubao (Volcengine)', 
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', 
    model: 'ep-2024...',
    desc: 'Note: Model Name requires Endpoint ID'
  },
  {
    name: 'OpenAI (Official)',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    desc: 'Standard OpenAI API'
  }
];

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setLocalConfig(config);
    setStatus('idle');
    setErrorMessage('');
  }, [config, isOpen]);

  // When switching providers or changing critical fields, reset status
  useEffect(() => {
    if (status !== 'idle') {
        setStatus('idle');
        setErrorMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localConfig.provider, localConfig.baseUrl, localConfig.apiKey, localConfig.modelName]);

  const handleTestConnection = async () => {
    setStatus('testing');
    setErrorMessage('');
    try {
      await validateConnection(localConfig);
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || "Connection failed");
    }
  };

  const handleSave = async () => {
    // If user hasn't tested yet, and it's a custom provider, we could optionally test automatically.
    // For now, we just save and close, assuming user might be offline or confident.
    onConfigChange(localConfig);
    onClose();
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLocalConfig({
      ...localConfig,
      baseUrl: preset.baseUrl,
      modelName: preset.model,
      // Keep API key empty or existing if user wants
      apiKey: localConfig.apiKey || '' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 m-4 transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">AI Configuration</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Provider Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setLocalConfig({ ...localConfig, provider: 'gemini', modelName: 'gemini-2.5-flash' })}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                localConfig.provider === 'gemini'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Google Gemini
            </button>
            <button
              onClick={() => setLocalConfig({ ...localConfig, provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '' })}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                localConfig.provider === 'openai'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Custom / OpenAI
            </button>
          </div>

          {/* Gemini Config */}
          {localConfig.provider === 'gemini' && (
            <div className="space-y-4 animate-fade-in">
              <label className="block text-sm font-semibold text-slate-700">Select Model</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setLocalConfig({ ...localConfig, modelName: 'gemini-2.5-flash' })}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    localConfig.modelName === 'gemini-2.5-flash'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-sm">Gemini 2.5 Flash</div>
                    <div className="text-xs opacity-75">Fast & Efficient (Default)</div>
                  </div>
                  {localConfig.modelName === 'gemini-2.5-flash' && (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>

                <button
                  onClick={() => setLocalConfig({ ...localConfig, modelName: 'gemini-3-pro-preview' })}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    localConfig.modelName === 'gemini-3-pro-preview'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-sm">Gemini 3 Pro</div>
                    <div className="text-xs opacity-75">Reasoning & High Quality</div>
                  </div>
                  {localConfig.modelName === 'gemini-3-pro-preview' && (
                     <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Custom Config */}
          {localConfig.provider === 'openai' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-800 font-semibold mb-2 uppercase tracking-wide">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                      title={p.desc}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Base URL</label>
                <input 
                  type="text" 
                  value={localConfig.baseUrl || ''}
                  onChange={(e) => setLocalConfig({...localConfig, baseUrl: e.target.value})}
                  placeholder="e.g., https://api.moonshot.cn/v1"
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">API Key / Token</label>
                <input 
                  type="password" 
                  value={localConfig.apiKey || ''}
                  onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Model Name</label>
                <input 
                  type="text" 
                  value={localConfig.modelName}
                  onChange={(e) => setLocalConfig({...localConfig, modelName: e.target.value})}
                  placeholder="e.g., moonshot-v1-8k"
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Connection Status Area */}
        <div className="mt-6 mb-2">
             {status === 'testing' && (
                 <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                    <svg className="animate-spin h-4 w-4 text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying connection with model...
                 </div>
             )}
             {status === 'success' && (
                 <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Successfully connected to <strong>{localConfig.modelName}</strong>!
                 </div>
             )}
             {status === 'error' && (
                 <div className="flex flex-col gap-1 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 font-semibold">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Connection Failed
                    </div>
                    <p className="text-xs opacity-90">{errorMessage}</p>
                 </div>
             )}
        </div>

        <div className="mt-4 flex gap-3">
           <button
             onClick={handleTestConnection}
             disabled={status === 'testing'}
             className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 py-3 rounded-xl font-semibold transition-colors"
           >
             Test Connection
           </button>
           <button
            onClick={handleSave}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-100"
           >
            Save & Use
           </button>
        </div>
      </div>
    </div>
  );
};
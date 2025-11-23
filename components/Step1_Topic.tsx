import React, { useState } from 'react';
import { OutlineOption, AIConfig } from '../types';
import { generateOutlines } from '../services/geminiService';

interface Props {
  topic: string;
  setTopic: (t: string) => void;
  onNext: (selectedStyleName: string, selectedStyleDesc: string, chapters: string[]) => void;
  config: AIConfig;
}

export const Step1_Topic: React.FC<Props> = ({ topic, setTopic, onNext, config }) => {
  const [loading, setLoading] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState("");
  const [outlines, setOutlines] = useState<OutlineOption[]>([]);
  const [selectedOutlineIndex, setSelectedOutlineIndex] = useState<number | null>(null);
  
  // State for editing the selected outline
  const [editableChapters, setEditableChapters] = useState<string[]>([]);
  const [editableStyleName, setEditableStyleName] = useState<string>("");
  const [editableStyleDesc, setEditableStyleDesc] = useState<string>("");
  
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedOutlineIndex(null);
    setEditableChapters([]); 
    setEditableStyleName("");
    setEditableStyleDesc("");
    
    try {
      const response = await generateOutlines(topic, customStyleInput, config);
      const options = response.outlines.map((o, i) => ({
        id: i.toString(),
        style: o.style,
        description: o.description,
        chapters: o.chapters,
      }));
      setOutlines(options);
    } catch (err: any) {
      setError(err.message || "Failed to generate outlines");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index: number) => {
    setSelectedOutlineIndex(index);
    setEditableChapters([...outlines[index].chapters]);
    setEditableStyleName(outlines[index].style);
    // Use the generated description, or valid fallback
    setEditableStyleDesc(outlines[index].description || customStyleInput || "Professional and clear tone.");
  };

  const handleChapterChange = (chapterIndex: number, value: string) => {
    const newChapters = [...editableChapters];
    newChapters[chapterIndex] = value;
    setEditableChapters(newChapters);
  };

  const addChapter = () => {
    setEditableChapters([...editableChapters, "New Chapter"]);
  };

  const removeChapter = (index: number) => {
    setEditableChapters(editableChapters.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Topic & Style Input */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">1. What do you want to write about?</h2>
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., A comprehensive guide to starting a coffee shop..."
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                    Desired Style / Tone (Optional)
                </label>
                <input
                    type="text"
                    value={customStyleInput}
                    onChange={(e) => setCustomStyleInput(e.target.value)}
                    placeholder="e.g., Humorous and witty, Strictly academic, Corporate Professional..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
            </div>
            <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                </span>
                ) : outlines.length > 0 ? "Regenerate" : "Generate Outlines"}
            </button>
        </div>

        {error && <p className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}
      </div>

      {/* Outline Selection */}
      {outlines.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Select an Approach</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {outlines.map((outline, idx) => (
              <div
                key={outline.id}
                onClick={() => handleSelect(idx)}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all hover:shadow-md
                  ${selectedOutlineIndex === idx 
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100' 
                    : 'border-slate-100 bg-white hover:border-indigo-200'}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase truncate
                    ${selectedOutlineIndex === idx ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {outline.style}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed min-h-[60px]">{outline.description}</p>
                <ul className="space-y-2">
                  {outline.chapters.slice(0, 4).map((c, i) => (
                    <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                      <span className="truncate">{c}</span>
                    </li>
                  ))}
                  {outline.chapters.length > 4 && (
                    <li className="text-xs text-slate-400 italic pl-3.5">
                      + {outline.chapters.length - 4} more chapters
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customize Outline */}
      {selectedOutlineIndex !== null && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Customize Outline</h2>
                <p className="text-sm text-slate-500">Review chapters and refine your writing instructions.</p>
            </div>
            <button
              onClick={addChapter}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 bg-indigo-50 px-3 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Add Chapter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Style Name</label>
                <input 
                    type="text" 
                    value={editableStyleName}
                    onChange={(e) => setEditableStyleName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-indigo-700 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                     Detailed Style Instructions
                     <span className="ml-2 text-indigo-500 font-normal normal-case text-xs">(Edit to customize tone)</span>
                 </label>
                 <textarea
                    value={editableStyleDesc}
                    onChange={(e) => setEditableStyleDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe how the AI should write (e.g., 'Use metaphors', 'Keep it strictly professional')..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none resize-none"
                 />
             </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase">Chapters</label>
            {editableChapters.map((chapter, idx) => (
              <div key={idx} className="flex gap-3 group">
                <span className="flex items-center justify-center w-8 h-10 text-slate-400 font-mono text-sm">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => handleChapterChange(idx, e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none text-slate-700"
                />
                <button 
                  onClick={() => removeChapter(idx)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => onNext(editableStyleName, editableStyleDesc, editableChapters)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
            >
              Next: Plan Content &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ChapterDetail, AIConfig } from '../types';
import { generateChapterDetails } from '../services/geminiService';

interface Props {
  topic: string;
  chapters: string[];
  onBack: () => void;
  onNext: (details: ChapterDetail[]) => void;
  config: AIConfig;
}

export const Step2_Details: React.FC<Props> = ({ topic, chapters, onBack, onNext, config }) => {
  const [details, setDetails] = useState<ChapterDetail[]>(() => 
    chapters.map((title, i) => ({
      id: i.toString(),
      title,
      points: [],
      isGenerating: false,
    }))
  );
  
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Auto-generate details for the first chapter on load if empty, purely for UX
  useEffect(() => {
    // Optional: Could trigger auto-generation here, but let's let user control it or do it batch
  }, []);

  const handleGeneratePoints = async (index: number) => {
    const chapter = details[index];
    
    // Update state to loading
    const newDetails = [...details];
    newDetails[index].isGenerating = true;
    setDetails(newDetails);
    setActiveChapterId(chapter.id);

    try {
      // Pass other titles as context
      const context = chapters.filter((_, i) => i !== index);
      const points = await generateChapterDetails(topic, chapter.title, context, config);
      
      const updatedDetails = [...details];
      updatedDetails[index] = {
        ...updatedDetails[index],
        points: points,
        isGenerating: false
      };
      setDetails(updatedDetails);
    } catch (e) {
      console.error(e);
      const updatedDetails = [...details];
      updatedDetails[index].isGenerating = false;
      setDetails(updatedDetails);
    }
  };

  const handlePointChange = (chapterIndex: number, pointIndex: number, val: string) => {
    const newDetails = [...details];
    newDetails[chapterIndex].points[pointIndex] = val;
    setDetails(newDetails);
  };

  const addPoint = (chapterIndex: number) => {
    const newDetails = [...details];
    newDetails[chapterIndex].points.push("New point");
    setDetails(newDetails);
  };

  const removePoint = (chapterIndex: number, pointIndex: number) => {
    const newDetails = [...details];
    newDetails[chapterIndex].points = newDetails[chapterIndex].points.filter((_, i) => i !== pointIndex);
    setDetails(newDetails);
  };

  const isAllPlanned = details.every(d => d.points.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">2. Plan Chapter Content</h2>
          <p className="text-slate-500">Define the key talking points for each section before writing.</p>
        </div>
        <div className="space-x-3">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2">
                Back
            </button>
            <button
            onClick={() => onNext(details)}
            disabled={!isAllPlanned}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
            Next: Start Writing &rarr;
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {details.map((chapter, idx) => (
          <div key={chapter.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100"
                onClick={() => setActiveChapterId(activeChapterId === chapter.id ? null : chapter.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${chapter.points.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}
                `}>
                    {idx + 1}
                </div>
                <h3 className="font-semibold text-slate-800">{chapter.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-xs text-slate-500">
                    {chapter.points.length} points
                 </span>
                 <svg 
                    className={`w-5 h-5 text-slate-400 transform transition-transform ${activeChapterId === chapter.id ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                 >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
              </div>
            </div>

            {activeChapterId === chapter.id && (
              <div className="p-6 bg-white border-t border-slate-100">
                 {chapter.points.length === 0 && !chapter.isGenerating ? (
                    <div className="text-center py-8">
                        <p className="text-slate-400 mb-4">No content points defined yet.</p>
                        <button
                            onClick={() => handleGeneratePoints(idx)}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            ✨ Generate Points with AI
                        </button>
                    </div>
                 ) : (
                    <div className="space-y-3">
                        {chapter.isGenerating && (
                            <div className="flex items-center gap-2 text-indigo-600 text-sm mb-4">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Brainstorming details...
                            </div>
                        )}
                        {chapter.points.map((point, pIdx) => (
                            <div key={pIdx} className="flex gap-2">
                                <span className="text-slate-400 mt-2">•</span>
                                <textarea
                                    value={point}
                                    onChange={(e) => handlePointChange(idx, pIdx, e.target.value)}
                                    className="flex-1 p-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none text-sm text-slate-700 resize-none h-16 sm:h-12"
                                />
                                <button onClick={() => removePoint(idx, pIdx)} className="text-slate-300 hover:text-red-500 px-2">
                                    &times;
                                </button>
                            </div>
                        ))}
                         <div className="flex justify-between mt-4 border-t border-slate-50 pt-4">
                            <button onClick={() => handleGeneratePoints(idx)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                ↻ Regenerate
                            </button>
                            <button onClick={() => addPoint(idx)} className="text-xs text-slate-600 hover:text-slate-900 font-medium bg-slate-100 px-3 py-1.5 rounded-md">
                                + Add Point
                            </button>
                         </div>
                    </div>
                 )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
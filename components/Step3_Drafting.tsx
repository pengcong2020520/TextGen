
import React, { useState, useEffect, useRef } from 'react';
import { ChapterDetail, AIConfig } from '../types';
import { generateChapterContent, refineContent } from '../services/geminiService';

interface Props {
  topic: string;
  tone: string;
  chaptersDetails: ChapterDetail[];
  onBack: () => void;
  onNext: (finalContent: string) => void;
  config: AIConfig;
}

export const Step3_Drafting: React.FC<Props> = ({ topic, tone, chaptersDetails, onBack, onNext, config }) => {
  const [data, setData] = useState<ChapterDetail[]>(chaptersDetails);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Start generating the first chapter if not present
  useEffect(() => {
    const processGeneration = async () => {
      // Check if current active chapter needs content
      const chapter = data[activeChapterIndex];
      if (!chapter.content && !chapter.isGenerating) {
        await generateContentForIndex(activeChapterIndex);
      }
    };
    processGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterIndex]);

  const generateContentForIndex = async (index: number) => {
    const updated = [...data];
    updated[index].isGenerating = true;
    setData(updated);

    try {
      const content = await generateChapterContent(
        topic, 
        updated[index].title, 
        updated[index].points, 
        tone,
        config,
        updated[index].chartImage // Pass the image if it exists
      );
      
      const doneUpdate = [...data];
      doneUpdate[index] = {
        ...doneUpdate[index],
        content,
        isGenerating: false
      };
      setData(doneUpdate);
    } catch (e) {
      console.error(e);
      const errUpdate = [...data];
      errUpdate[index].isGenerating = false;
      setData(errUpdate);
    }
  };

  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setIsRefining(true);
    const chapter = data[activeChapterIndex];
    if (chapter.content) {
        try {
            const newContent = await refineContent(chapter.content, refineInput, config);
            const updated = [...data];
            updated[activeChapterIndex].content = newContent;
            setData(updated);
            setRefineInput("");
        } catch (e) {
            console.error(e);
        }
    }
    setIsRefining(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        const updated = [...data];
        updated[activeChapterIndex].chartImage = base64String;
        // If content was already generated, we might want to prompt user to regenerate,
        // but for now just setting it allows them to click "Rewrite".
        setData(updated);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
      const updated = [...data];
      updated[activeChapterIndex].chartImage = undefined;
      setData(updated);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const currentChapter = data[activeChapterIndex];
  const progress = Math.round((data.filter(c => !!c.content).length / data.length) * 100);

  const assembleFinal = () => {
    // Combine all
    return data.map(c => `# ${c.title}\n\n${c.content || '(No content generated)'}`).join('\n\n');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-200px)] min-h-[600px] flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-1/4 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-full overflow-hidden">
        <div className="mb-2">
            <h3 className="font-bold text-slate-700">Writing Progress</h3>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {data.map((chap, idx) => (
                <button
                    key={chap.id}
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between
                        ${activeChapterIndex === idx 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'}
                    `}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{idx + 1}. {chap.title}</span>
                        {chap.chartImage && (
                            <svg className="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <title>Has chart</title>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        )}
                    </div>
                    {chap.content ? (
                        <span className="text-emerald-500">✓</span>
                    ) : chap.isGenerating ? (
                        <span className="block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    )}
                </button>
            ))}
        </div>
        <div className="pt-4 border-t border-slate-100">
            <button
                onClick={() => onNext(assembleFinal())}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold shadow-md transition-all"
            >
                Finish Draft
            </button>
            <button onClick={onBack} className="w-full mt-2 text-slate-500 hover:text-slate-800 py-2 text-sm">
                Back to Plan
            </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-slate-800 truncate max-w-[60%]">{currentChapter.title}</h2>
            <div className="flex items-center gap-3">
                 {currentChapter.content && !currentChapter.isGenerating && (
                    <button 
                        onClick={() => generateContentForIndex(activeChapterIndex)}
                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 border border-slate-200 bg-white px-2 py-1 rounded hover:border-indigo-300 transition-all"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-write
                    </button>
                 )}
            </div>
         </div>

         <div className="flex-1 p-8 overflow-y-auto bg-white font-serif leading-relaxed text-lg text-slate-800">
            {/* Chart Upload/Preview Area */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Chart Analysis
                    </label>
                    {!currentChapter.chartImage ? (
                       <div className="relative">
                           <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                                className="hidden" 
                                id={`file-upload-${activeChapterIndex}`}
                           />
                           <label 
                                htmlFor={`file-upload-${activeChapterIndex}`}
                                className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                           >
                               + Upload Chart
                           </label>
                       </div>
                    ) : (
                        <button 
                            onClick={removeImage}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Remove Image
                        </button>
                    )}
                </div>

                {currentChapter.chartImage ? (
                    <div className="relative group w-full max-w-md">
                        <img 
                            src={currentChapter.chartImage} 
                            alt="Chapter Chart" 
                            className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-white"
                        />
                        <div className="mt-2 text-xs text-slate-500 italic">
                            AI will analyze this chart when generating content.
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 italic">
                        Upload a chart or diagram here to have the AI analyze and incorporate it into this chapter.
                    </div>
                )}
            </div>

            {currentChapter.isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="animate-pulse">Writing content for "{currentChapter.title}"...</p>
                    {currentChapter.chartImage && (
                        <p className="text-sm text-indigo-500 font-medium">Analyzing chart data...</p>
                    )}
                    <div className="text-xs max-w-md text-center text-slate-300">
                        Using context: {currentChapter.points.slice(0, 3).join(', ')}...
                    </div>
                </div>
            ) : currentChapter.content ? (
                <div className="whitespace-pre-wrap">{currentChapter.content}</div>
            ) : (
                <div className="flex items-center justify-center py-12 text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                    Waiting for content generation...
                </div>
            )}
         </div>

         {/* Refinement Bar */}
         {currentChapter.content && !currentChapter.isGenerating && (
             <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                        disabled={isRefining}
                        placeholder="Tell AI to tweak this section (e.g., 'Make it more persuasive', 'Add an example')..."
                        className="flex-1 p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none text-sm"
                    />
                    <button 
                        onClick={handleRefine}
                        disabled={isRefining || !refineInput.trim()}
                        className="bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isRefining ? 'Refining...' : 'Refine'}
                    </button>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

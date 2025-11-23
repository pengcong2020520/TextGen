import React, { useState } from 'react';
import { AppStep, ChapterDetail, AIConfig } from './types';
import { StepIndicator } from './components/StepIndicator';
import { Step1_Topic } from './components/Step1_Topic';
import { Step2_Details } from './components/Step2_Details';
import { Step3_Drafting } from './components/Step3_Drafting';
import { Step4_Export } from './components/Step4_Export';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.TopicAndOutline);
  
  // App State
  const [topic, setTopic] = useState("");
  // Style Name (e.g., "Professional")
  const [styleName, setStyleName] = useState("");
  // Detailed Style Instructions (e.g., "Use active voice, focus on data...")
  const [styleInstructions, setStyleInstructions] = useState("");
  
  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterDetails, setChapterDetails] = useState<ChapterDetail[]>([]);
  const [finalContent, setFinalContent] = useState("");
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
  });

  const handleStep1Complete = (selectedStyleName: string, selectedStyleDesc: string, selectedChapters: string[]) => {
    setStyleName(selectedStyleName);
    setStyleInstructions(selectedStyleDesc);
    setChapters(selectedChapters);
    setStep(AppStep.ChapterDetails);
  };

  const handleStep2Complete = (details: ChapterDetail[]) => {
    setChapterDetails(details);
    setStep(AppStep.Drafting);
  };

  const handleStep3Complete = (content: string) => {
    setFinalContent(content);
    setStep(AppStep.Finalize);
  };

  const handleRestart = () => {
     if(window.confirm("Are you sure? All current progress will be lost.")) {
        setTopic("");
        setChapters([]);
        setChapterDetails([]);
        setFinalContent("");
        setStyleName("");
        setStyleInstructions("");
        setStep(AppStep.TopicAndOutline);
     }
  };

  // Helper to get display name for header
  const getModelDisplayName = () => {
      if (aiConfig.provider === 'gemini') {
          return aiConfig.modelName.includes('pro') ? 'Gemini Pro' : 'Gemini Flash';
      }
      // Clean up model name for display (e.g., "moonshot-v1-8k" -> "moonshot-v1...")
      return aiConfig.modelName.length > 15 ? aiConfig.modelName.substring(0, 12) + '...' : aiConfig.modelName;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              DocGenius
            </h1>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Model Switcher Button */}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="group flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all"
                title="Switch AI Model"
            >
                <span className={`relative flex h-2 w-2`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 truncate max-w-[120px]">
                    {getModelDisplayName()}
                </span>
                <svg className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div className="text-sm text-slate-500 hidden sm:block border-l border-slate-200 pl-4">
               AI Document Assistant
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <StepIndicator currentStep={step} />

        <div className="transition-all duration-500 ease-in-out">
          {step === AppStep.TopicAndOutline && (
            <Step1_Topic 
                topic={topic} 
                setTopic={setTopic} 
                onNext={handleStep1Complete} 
                config={aiConfig}
            />
          )}

          {step === AppStep.ChapterDetails && (
            <Step2_Details 
                topic={topic} 
                chapters={chapters} 
                onBack={() => setStep(AppStep.TopicAndOutline)}
                onNext={handleStep2Complete}
                config={aiConfig}
            />
          )}

          {step === AppStep.Drafting && (
            <Step3_Drafting 
                topic={topic}
                // Pass the combined style info as the tone parameter
                tone={`${styleName}: ${styleInstructions}`}
                chaptersDetails={chapterDetails}
                onBack={() => setStep(AppStep.ChapterDetails)}
                onNext={handleStep3Complete}
                config={aiConfig}
            />
          )}

          {step === AppStep.Finalize && (
            <Step4_Export 
                initialContent={finalContent}
                onRestart={handleRestart}
            />
          )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onConfigChange={setAiConfig}
      />
    </div>
  );
};

export default App;
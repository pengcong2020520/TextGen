import React, { useState } from 'react';

interface Props {
  initialContent: string;
  onRestart: () => void;
}

export const Step4_Export: React.FC<Props> = ({ initialContent, onRestart }) => {
  const [content, setContent] = useState(initialContent);

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "generated_document.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Document is Ready! 🎉</h2>
            <p className="text-slate-500">Review the final text below. You can make manual edits before exporting.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={onRestart}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium"
            >
                Start New
            </button>
            <button 
                onClick={copyToClipboard}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
                Copy Text
            </button>
            <button 
                onClick={downloadFile}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download (.md)
            </button>
        </div>
       </div>

       <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] p-8 outline-none text-lg leading-relaxed text-slate-800 font-serif resize-none"
            />
       </div>
    </div>
  );
};

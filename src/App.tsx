import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  HelpCircle, 
  Upload, 
  Send, 
  Sparkles, 
  ChevronRight, 
  MessageSquare,
  RefreshCcw,
  GraduationCap,
  Download
} from 'lucide-react';
import { processNotes, solveDoubt } from './lib/gemini';
import { Markdown } from './components/Markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import html2pdf from 'html2pdf.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [tone, setTone] = useState<'academic' | 'eli10'>('academic');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const output = await processNotes(input, tone);
      setResult(output || 'Failed to process notes.');
    } catch (error) {
      console.error(error);
      setResult('An error occurred while processing your notes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInput(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const response = await solveDoubt(userMsg, input, tone);
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'I am not sure how to answer that.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleExportPDF = () => {
    if (!resultRef.current || isExporting) return;
    setIsExporting(true);

    const element = resultRef.current;
    const opt = {
      margin: 15,
      filename: 'Lumina-Study-Module.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          // Remove oklch colors from all style tags to prevent html2canvas parsing errors
          const styleElements = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleElements.length; i++) {
            const style = styleElements[i];
            if (style.innerHTML.includes('oklch')) {
              style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#334155');
            }
          }
          // Also check inline styles
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#334155');
            }
          }
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as any }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsExporting(false);
      console.log('PDF download triggered successfully');
    }).catch((err: any) => {
      console.error('PDF Export Error:', err);
      setIsExporting(false);
      alert('Failed to export PDF. Please try again.');
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-900 tracking-tight">Lumina</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 -mt-1">AI Study Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setTone('academic')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  tone === 'academic' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Academic
              </button>
              <button 
                onClick={() => setTone('eli10')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  tone === 'eli10' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                ELI10
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="input-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-serif font-bold text-slate-900">What are we learning today?</h2>
                <p className="text-slate-500">Paste your lecture notes, textbook chapters, or syllabus below.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your study material here..."
                  className="w-full h-64 p-6 resize-none focus:outline-none text-slate-700 leading-relaxed"
                />
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".txt,.md"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <Upload size={16} />
                      Upload Text File
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleProcess}
                    disabled={!input.trim() || isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-100"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCcw size={18} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Study Module
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: <BookOpen className="text-blue-500" />, title: "Subject Explainer", desc: "Hierarchical breakdowns with analogies." },
                  { icon: <Brain className="text-purple-500" />, title: "Active Recall", desc: "Flashcards and quizzes for retention." },
                  { icon: <Zap className="text-amber-500" />, title: "Revision Sheet", desc: "Last-minute summaries and key terms." }
                ].map((feature, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 pb-24"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setResult(null)}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  Back to Input
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? (
                      <RefreshCcw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Export PDF
                  </button>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Sparkles size={14} className="text-indigo-500" />
                    Lumina Analysis Complete
                  </div>
                </div>
              </div>

              <div ref={resultRef} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 pdf-export-container">
                <Markdown content={result} />
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
                >
                  <RefreshCcw size={18} />
                  Process New Material
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Doubt Solver Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={20} />
                  <span className="font-semibold">Doubt Solver</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare size={24} />
                    </div>
                    <p className="text-sm text-slate-500 px-4">Ask me anything about your study material. I'll use first principles to explain.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "ml-auto bg-indigo-600 text-white rounded-tr-none" 
                      : "mr-auto bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                ))}
                {isChatting && (
                  <div className="mr-auto bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatting}
                    className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95",
            chatOpen ? "bg-slate-800" : "bg-indigo-600"
          )}
        >
          {chatOpen ? <ChevronRight size={24} className="rotate-90" /> : <MessageSquare size={24} />}
        </button>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <GraduationCap size={20} />
            <span className="text-sm font-semibold tracking-tight">Lumina AI</span>
          </div>
          <p className="text-xs text-slate-400">Built for high-retention learning. Stay curious.</p>
          <div className="flex gap-6 text-xs font-medium text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

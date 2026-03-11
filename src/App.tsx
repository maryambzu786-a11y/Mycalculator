import React, { useState, useRef, useEffect } from 'react';
import { evaluate } from 'mathjs';
import { GoogleGenAI } from '@google/genai';
import { Calculator, Sparkles, CornerDownLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BUTTONS = [
  { label: 'sin', value: 'sin(' },
  { label: 'cos', value: 'cos(' },
  { label: 'tan', value: 'tan(' },
  { label: 'AC', value: 'AC', className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  { label: 'DEL', value: 'DEL', className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  { label: 'asin', value: 'asin(' },
  { label: 'acos', value: 'acos(' },
  { label: 'atan', value: 'atan(' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: 'sqrt', value: 'sqrt(' },
  { label: '^', value: '^' },
  { label: 'log', value: 'log10(' },
  { label: 'ln', value: 'log(' },
  { label: '÷', value: '/' },
  { label: 'π', value: 'pi' },
  { label: '7', value: '7', className: 'bg-white/5 font-medium text-xl' },
  { label: '8', value: '8', className: 'bg-white/5 font-medium text-xl' },
  { label: '9', value: '9', className: 'bg-white/5 font-medium text-xl' },
  { label: '×', value: '*' },
  { label: 'e', value: 'e' },
  { label: '4', value: '4', className: 'bg-white/5 font-medium text-xl' },
  { label: '5', value: '5', className: 'bg-white/5 font-medium text-xl' },
  { label: '6', value: '6', className: 'bg-white/5 font-medium text-xl' },
  { label: '-', value: '-' },
  { label: 'ANS', value: 'ANS' },
  { label: '1', value: '1', className: 'bg-white/5 font-medium text-xl' },
  { label: '2', value: '2', className: 'bg-white/5 font-medium text-xl' },
  { label: '3', value: '3', className: 'bg-white/5 font-medium text-xl' },
  { label: '+', value: '+' },
  { label: 'EXP', value: 'E' },
  { label: '0', value: '0', className: 'bg-white/5 font-medium text-xl' },
  { label: '.', value: '.', className: 'bg-white/5 font-medium text-xl' },
  { label: '=', value: '=', className: 'col-span-2 bg-indigo-500 text-white hover:bg-indigo-600 font-medium text-xl' },
];

export default function App() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [ans, setAns] = useState('0');

  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiLoading]);

  const handleButtonClick = (btn: string) => {
    if (btn === 'AC') {
      setExpression('');
      setResult('');
    } else if (btn === 'DEL') {
      setExpression(prev => prev.slice(0, -1));
    } else if (btn === '=') {
      if (!expression) return;
      try {
        let evalExpr = expression.replace(/ANS/g, `(${ans})`);
        evalExpr = evalExpr.replace(/pi/g, 'pi');
        evalExpr = evalExpr.replace(/e/g, 'e');
        
        const res = evaluate(evalExpr);
        
        // Format the result nicely
        let resStr = String(res);
        if (typeof res === 'number') {
          // Round to 10 decimal places to avoid floating point issues
          resStr = String(Math.round(res * 1e10) / 1e10);
        }
        
        setResult(resStr);
        setAns(resStr);
      } catch (err) {
        setResult('Error');
      }
    } else {
      setExpression(prev => prev + btn);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an AI mathematical assistant integrated into a scientific calculator. 
The user will ask you a math problem, to perform a calculation, or explain a concept.
Provide a clear, step-by-step solution. If it's a direct calculation, provide the final answer clearly.
Use LaTeX formatting for math equations (e.g., $x^2 + y^2 = z^2$ or $$ \\frac{a}{b} $$).
User query: ${userMsg}`,
      });

      setAiMessages(prev => [...prev, { role: 'ai', content: response.text || 'No response generated.' }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col md:flex-row p-4 md:p-8 gap-6 font-sans">
      {/* Left: Calculator */}
      <div className="flex-1 flex flex-col bg-[#141414] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl max-w-xl mx-auto w-full">
        {/* Display */}
        <div className="p-8 bg-[#0a0a0a]/50 border-b border-white/5 flex flex-col items-end justify-end min-h-[220px] relative">
          <div className="absolute top-6 left-6 text-zinc-600 flex items-center gap-2">
            <Calculator size={18} />
            <span className="text-xs font-medium tracking-widest uppercase">Scientific</span>
          </div>
          
          <div className="text-zinc-400 text-2xl font-mono tracking-wider break-all text-right mb-4 min-h-[32px]">
            {expression || '0'}
          </div>
          <div className="text-6xl font-light tracking-tight break-all text-right min-h-[72px] text-white">
            {result || ''}
          </div>
        </div>
        
        {/* Keypad */}
        <div className="p-6 grid grid-cols-5 gap-3 flex-1 bg-[#141414]">
          {BUTTONS.map((btn, i) => (
            <button
              key={i}
              onClick={() => handleButtonClick(btn.value)}
              className={`
                flex items-center justify-center h-16 rounded-2xl text-lg transition-all active:scale-95
                ${btn.className || 'bg-white/5 hover:bg-white/10 text-zinc-300 font-mono'}
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: AI Assistant */}
      <div className="flex-1 flex flex-col bg-[#141414] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl max-w-xl mx-auto w-full h-[800px] md:h-auto">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-[#0a0a0a]/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="font-medium text-zinc-100 text-lg">AI Math Assistant</h2>
            <p className="text-sm text-zinc-500">Powered by Gemini 3.1 Pro</p>
          </div>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {aiMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <Calculator size={48} className="text-zinc-600" />
              </div>
              <p className="text-center max-w-xs leading-relaxed">
                Ask me to solve complex equations, explain mathematical concepts, or perform step-by-step calculations.
              </p>
            </div>
          )}
          
          {aiMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-indigo-500 text-white rounded-tr-sm' 
                  : 'bg-white/5 text-zinc-200 rounded-tl-sm border border-white/5'}
              `}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isAiLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 text-zinc-300 rounded-3xl rounded-tl-sm px-6 py-5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input */}
        <form onSubmit={handleAiSubmit} className="p-6 border-t border-white/5 bg-[#0a0a0a]/50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask a math question... (e.g. 'Solve x^2 - 4 = 0')"
              className="w-full bg-[#141414] border border-white/10 rounded-full pl-6 pr-14 py-4 text-[15px] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || isAiLoading}
              className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 text-white disabled:opacity-50 disabled:bg-zinc-800 transition-colors hover:bg-indigo-400"
            >
              <CornerDownLeft size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

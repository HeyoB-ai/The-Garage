import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot, ShieldCheck, User } from "lucide-react";

export default function AdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: "Hello! I am your AI Automotive Specialist for **The Garage Jávea**. How may I assist you today? Feel free to ask me about Spanish import registration taxes (matriculación), classic vehicle sourcing, closed trailer shipping routes, or scheduling a diagnostic service in Costa Blanca!" }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = inputText;
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to our AI Advisor backend.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "My apologies, we are experiencing a brief network connection issue with our AI Server. Please feel free to call our meertalige team directly at +34 965 020 442 or contact us via email." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Toggle Call To Action */}
      {!isOpen && (
        <button
          id="toggle-ai-chat"
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold px-4 py-3 rounded-full shadow-2xl shadow-amber-500/25 hover:scale-105 transition-all text-sm tracking-wide"
        >
          <Bot className="w-5 h-5" />
          <span>Ask our AI Advisor</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-950 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-950"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div id="ai-advisor-window" className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-neutral-950">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-1">
                  <span>AI Advisor</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" aria-label="Officially Verified" />
                </h4>
                <span className="text-[10px] text-amber-400 font-mono font-bold tracking-wider">The Garage Jávea</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  
                  {/* Icon */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    m.role === 'user' ? 'bg-neutral-800 text-white' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  }`}>
                    {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Body Text */}
                  <div className={`rounded-xl px-3.5 py-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-amber-500 text-neutral-950 font-medium' 
                      : 'bg-neutral-900 text-neutral-200 border border-neutral-850'
                  }`}>
                    {/* Elementary markdown parsing */}
                    {m.text.split("\n").map((line, lineIdx) => {
                      let content = line;
                      let isList = false;
                      if (line.trim().startsWith("- ")) {
                        isList = true;
                        content = line.trim().substring(2);
                      }

                      // Replace bold asterisks
                      const parts = content.split("**");
                      const parsed = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-white text-amber-300">{part}</strong> : part);

                      return (
                        <div key={lineIdx} className={isList ? "ml-3 list-item list-disc list-inside mt-0.5" : "mt-1 first:mt-0"}>
                          {parsed}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
                    <Bot className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className="bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2 text-xs text-neutral-400">
                    Formulating expert advice...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask e.g. How do I import from UK?"
              className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-amber-500 hover:bg-amber-600 rounded text-neutral-950 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

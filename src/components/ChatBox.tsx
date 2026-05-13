"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status === "submitted" || status === "streaming") return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  };

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors z-50 flex items-center justify-center"
        aria-label="Abrir asistente"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-50 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Bot size={20} />
          <div>
            <h3 className="font-semibold text-sm">Asistente Hidrológico</h3>
            <p className="text-xs text-slate-300">Conectado a SAIH</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-300 hover:text-white transition-colors"
          aria-label="Cerrar asistente"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">
            <Bot size={32} className="mx-auto mb-3 opacity-20" />
            <p>¡Hola! Soy tu asistente de caudales.</p>
            <p className="mt-1">Pregúntame por el estado de las estaciones o datos históricos.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                m.role === "user" ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
              }`}
            >
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] flex flex-col gap-1`}>
              {m.parts?.map((part, index) => {
                if (part.type === 'text') {
                  return (
                    <div
                      key={index}
                      className={`px-4 py-3 rounded-2xl text-sm ${
                        m.role === "user"
                          ? "bg-slate-900 text-white rounded-tr-sm"
                          : "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm"
                      }`}
                    >
                      {part.text}
                    </div>
                  );
                }
                return null;
              })}
              
              {/* Tool call indicator */}
              {m.parts?.some(part => part.type.startsWith('tool-') || part.type === 'dynamic-tool') && (
                <div className="text-xs text-slate-400 flex flex-col gap-1 mt-1">
                  {Array.from(
                    m.parts
                      .filter(part => part.type.startsWith('tool-') || part.type === 'dynamic-tool')
                      .reduce((acc, part: any) => {
                        const id = part.toolCallId || part.id;
                        if (!id) return acc;
                        
                        const existing = acc.get(id) || {};
                        const toolName = part.toolName || (part.type === 'dynamic-tool' ? part.toolName : (part.type.startsWith('tool-') && part.type !== 'tool-result' ? part.type.slice(5) : null));
                        
                        acc.set(id, {
                          ...existing,
                          toolName: toolName || existing.toolName,
                          isFinished: existing.isFinished || 'result' in part || part.state === 'result' || part.state === 'result-available' || part.type === 'tool-result',
                        });
                        return acc;
                      }, new Map<string, any>())
                      .values()
                  ).map((tool: any, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <Loader2 size={10} className={!tool.isFinished ? "animate-spin" : ""} />
                      {tool.toolName === "get_stations_overview" && "Consultando estaciones..."}
                      {tool.toolName === "get_station_details" && "Consultando detalles de estación..."}
                      {tool.toolName === "get_station_history" && "Consultando historial..."}
                      {tool.isFinished ? " ✅" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-sm rounded-tl-sm text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Pensando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 relative"
        >
          <input
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Pregunta algo sobre las estaciones..."
            className="flex-1 pl-4 pr-12 py-3 rounded-full border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="absolute right-1 w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
          >
            <Send size={16} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Chatbot.jsx - Interfaz del Asistente Analítico IA del GADMR
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../services/api.js';

export const Chatbot = () => {
  const [chatConversation, setChatConversation] = useState([
    { 
      sender: 'assistant', 
      text: '¡Hola! Soy el asistente analítico inteligente del GADMR. Estoy listo para ayudarte a analizar la ejecución de los 15 proyectos presupuestarios POA/PAC. ¿De qué proyecto o mora deseas obtener información?' 
    }
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatTyping, setChatTyping] = useState(false);

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;

    const userMsg = chatInputText;
    const updatedConversation = [...chatConversation, { sender: 'user', text: userMsg }];
    setChatConversation(updatedConversation);
    setChatInputText('');
    setChatTyping(true);

    try {
      const response = await api.post('/ai/chatbot', { query: userMsg });
      setChatConversation([
        ...updatedConversation,
        { sender: 'assistant', text: response.data.response }
      ]);
    } catch (error) {
      setChatConversation([
        ...updatedConversation,
        { sender: 'assistant', text: `Lo siento, ocurrió un error al procesar tu consulta: ${error.message}` }
      ]);
    } finally {
      setChatTyping(false);
    }
  };

  const handleSuggestionClick = (queryText) => {
    setChatInputText(queryText);
  };

  return (
    <div className="h-[calc(100vh-220px)] flex flex-col">
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Cabecera */}
        <div className="bg-[#0B2545] dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-750 flex items-center gap-3.5 shrink-0">
          <div className="h-10 w-10 bg-[#134074] text-white rounded-xl flex items-center justify-center font-bold relative shrink-0">
            AI
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-[#10B981] rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
          </div>
          <div>
            <h3 className="font-title font-bold text-sm text-slate-800 dark:text-white">
              Asistente Analítico de POA/PAC del GADMR
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Motor de inteligencia artificial en español. Analiza datos financieros de proyectos.
            </p>
          </div>
        </div>

        {/* Mensajes del chat */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20 text-xs">
          {chatConversation.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-xl ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}>
              {msg.sender === 'assistant' && (
                <div className="h-8 w-8 bg-[#0B2545] text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  AI
                </div>
              )}
              
              <div 
                className={`p-3.5 rounded-2xl shadow-sm leading-relaxed ${
                  msg.sender === 'assistant' 
                    ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200' 
                    : 'bg-[#134074] text-white rounded-tr-none'
                }`}
              >
                <div className="prose max-w-none dark:prose-invert">
                  {msg.text.split('\n').map((line, i) => (
                    <p 
                      key={i} 
                      className="mb-1" 
                      dangerouslySetInnerHTML={{ 
                        __html: line
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/- (.*?)/g, '• $1')
                      }} 
                    />
                  ))}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="h-8 w-8 bg-[#8DA9C4] text-[#0B2545] rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  YO
                </div>
              )}
            </div>
          ))}

          {chatTyping && (
            <div className="flex gap-3 max-w-xl items-center">
              <div className="h-8 w-8 bg-[#0B2545] text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-pulse">
                AI
              </div>
              <span className="text-xs text-slate-400 font-medium animate-pulse">
                Consultando base de datos municipal...
              </span>
            </div>
          )}
        </div>

        {/* Sugerencias de preguntas rápidas */}
        <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 shrink-0">
          <span className="text-[10px] font-bold text-slate-450 uppercase">Preguntas Sugeridas:</span>
          {[
            '¿Qué proyectos tienen pagos vencidos?',
            '¿Cuál dirección tiene la mejor ejecución presupuestaria?',
            '¿Cuánto falta por pagar del total devengado?',
            'Muéstrame proyectos en riesgo y sus causas'
          ].map((q, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(q)}
              className="px-3 py-1 text-[11px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 font-medium transition-all"
            >
              {q.substring(0, 25)}...
            </button>
          ))}
        </div>

        {/* Formulario de entrada */}
        <form 
          onSubmit={handleSendChatMessage}
          className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 items-center bg-white dark:bg-slate-900 shrink-0"
        >
          <input 
            type="text" 
            value={chatInputText} 
            onChange={(e) => setChatInputText(e.target.value)}
            placeholder="Pregunta algo sobre el POA/PAC..."
            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
          />
          <button 
            type="submit"
            className="p-2.5 bg-[#134074] hover:bg-[#0B2545] text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Chatbot;

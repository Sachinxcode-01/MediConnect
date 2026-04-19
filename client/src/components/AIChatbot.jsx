import React, { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const AIChatbot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am MediConnect AI. How can I assist you with your health today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Only show the chatbot for patients (doctors have triage)
  if (!user || user.role !== 'patient') return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
        const response = await api.post('/api/chat', { messages: newHistory });
        setMessages([...newHistory, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
        setMessages([...newHistory, { role: 'assistant', content: "I'm having trouble connecting to the Gemini servers right now. Please try again later." }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-geist">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-themeMedium/50 overflow-hidden flex flex-col mb-4 transform origin-bottom-right animate-in zoom-in-95 duration-200" style={{ height: '500px' }}>
          
          {/* Header */}
          <div className="bg-themePrimary p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">Gemini Health API</h3>
                <p className="text-xs text-white/80 font-medium">24/7 Virtual Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 bg-white/10 rounded-full hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto bg-themeLight space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${msg.role === 'user' ? 'bg-themePrimary text-white rounded-br-sm' : 'bg-white text-themeDeep border border-themeMedium/30 rounded-bl-sm'}`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-themePrimary border border-themeMedium/30 rounded-2xl rounded-bl-sm p-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-bold">Gemini is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-themeMedium/30 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a medical question..."
              className="flex-1 bg-themeLight border border-themeMedium/50 rounded-xl px-4 py-2.5 text-sm font-medium text-themeDeep focus:outline-none focus:border-themePrimary focus:ring-1 focus:ring-themePrimary/50 transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="bg-themePrimary text-white p-2.5 rounded-xl shadow-sm hover:shadow-neon transition-all disabled:opacity-50 flex-shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-themePrimary text-white p-4 rounded-full shadow-neon hover:shadow-neon-hover transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 animate-in fade-in zoom-in"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;

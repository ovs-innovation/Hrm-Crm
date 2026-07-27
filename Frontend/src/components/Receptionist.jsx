import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Receptionist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI receptionist. Tell me what you need, and I can execute tasks, draft emails, or redirect you instantly.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/agent/command', { userInput: userText });
      setMessages((prev) => [...prev, { sender: 'ai', text: res.data.chatResponse || res.data.chatReply || 'Executed command successfully.' }]);
      
      if (res.data.redirectUrl) {
        toast.success(`Redirecting you to ${res.data.redirectUrl}...`);
        setTimeout(() => {
          navigate(res.data.redirectUrl);
          setIsOpen(false);
        }, 1200);
      }
    } catch (err) {
      toast.error('Receptionist error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[990] flex flex-col items-end">
      {/* Expanded chat window */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 rounded border border-line bg-surface shadow-lg flex flex-col overflow-hidden animate-fade-in text-ink text-[13px]">
          {/* Header */}
          <div className="bg-brand px-4 py-2.5 flex justify-between items-center text-white">
            <span className="font-bold flex items-center gap-1.5">
              <FiCpu className="h-4 w-4" /> AI Receptionist
            </span>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-soft/10">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded p-2.5 leading-relaxed text-[12px] border ${
                  m.sender === 'user'
                    ? 'bg-brand text-white border-brand self-end rounded-tr-none'
                    : 'bg-surface border-line text-ink self-start rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted self-start bg-soft border border-line p-2 rounded">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
                Processing request...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick task action chips */}
          <div className="px-3 py-1.5 flex gap-1 border-t border-line overflow-x-auto max-w-full bg-soft/20">
            {[
              'Check leaves',
              'Check tasks',
              'Check-in info'
            ].map(chip => (
              <button
                key={chip}
                onClick={() => setInput(chip)}
                className="bg-surface border border-line hover:border-brand px-2 py-0.5 rounded text-[10px] text-muted hover:text-ink transition-all whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-line bg-surface flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to do something..."
              className="app-input h-9 w-full text-[13px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-brand px-3 text-white flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <FiSend className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Receptionist Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="rounded-full bg-brand p-3.5 shadow-lg text-white hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/10"
      >
        <FiMessageSquare className="h-5.5 w-5.5" />
      </button>
    </div>
  );
};

export default Receptionist;

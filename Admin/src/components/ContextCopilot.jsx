import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCpu, FiChevronLeft, FiChevronRight, FiSend, FiCopy, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const ContextCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState({ page: 'Dashboard', prompts: [] });
  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();

  // Detect context on path changes
  useEffect(() => {
    const path = location.pathname;
    let pageName = 'Dashboard';
    let promptsList = [
      'Summarize current pipeline values',
      'Explain key staff presence rates',
      'Suggest tasks to perform today'
    ];

    if (path.includes('/crm/leads')) {
      pageName = 'Leads Management';
      promptsList = [
        'Recommend re-engagement templates',
        'Analyze lead capture leaks',
        'Suggest lead conversion strategies'
      ];
    } else if (path.includes('/hrm/employees')) {
      pageName = 'Employees Roster';
      promptsList = [
        'Draft standard employee warning letter',
        'Generate performance appraisal review template',
        'Summarize staff retention scores'
      ];
    } else if (path.includes('/hrm/attendance')) {
      pageName = 'Attendance Register';
      promptsList = [
        'Diagnose late arrival anomalies',
        'Summarize today\'s absence triggers',
        'Draft attendance correction warning'
      ];
    } else if (path.includes('/crm/deals')) {
      pageName = 'Sales Deals Pipeline';
      promptsList = [
        'Identify deal close bottlenecks',
        'Draft negotiation proposal email',
        'Forecast pipeline sales next quarter'
      ];
    } else if (path.includes('/crm/invoices')) {
      pageName = 'Quotes & Invoices';
      promptsList = [
        'Draft overdue payment notification',
        'Analyze invoice collection latency',
        'Create professional payment quote draft'
      ];
    }

    setContext({ page: pageName, prompts: promptsList });
    setChatLog([
      { sender: 'ai', text: `Hi! I'm your contextual Co-Pilot. I see you're viewing the ${pageName} screen. Here are some quick actions I can help with:` }
    ]);
  }, [location]);

  const handlePromptClick = async (prompt) => {
    setChatLog((prev) => [...prev, { sender: 'user', text: prompt }]);
    setLoading(true);
    try {
      const res = await api.post('/ai/agent/command', { userInput: `Page: ${context.page}. Command: ${prompt}` });
      setChatLog((prev) => [...prev, { sender: 'ai', text: res.data.chatResponse || res.data.chatReply || 'Task executed successfully.' }]);
    } catch {
      toast.error('Co-Pilot was unable to process that task.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    const userText = userInput;
    setUserInput('');
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/agent/command', { userInput: `Page Context: ${context.page}. User command: ${userText}` });
      setChatLog((prev) => [...prev, { sender: 'ai', text: res.data.chatResponse || res.data.chatReply || 'Task executed successfully.' }]);
    } catch {
      toast.error('Co-Pilot request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied text to clipboard!');
  };

  return (
    <div className="fixed top-24 right-0 z-[900] flex items-start">
      {/* Small floating trigger tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand text-white border-l border-y border-white/10 p-2 rounded-l shadow-lg flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
      >
        <FiCpu className="h-4.5 w-4.5 animate-pulse" />
        {isOpen ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      {/* Expanded sidebar panel */}
      {isOpen && (
        <div className="w-80 h-[80vh] border-l border-line bg-surface p-4 shadow-lg flex flex-col justify-between overflow-hidden text-ink text-[13px] animate-fade-in">
          {/* Header */}
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-ink">
              <FiCpu className="text-brand h-4 w-4" /> AI Page Co-Pilot
            </h3>
            <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">Context: {context.page}</span>
          </div>

          {/* Quick Actions List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 flex flex-col scrollbar-thin bg-soft/10 p-2 rounded border border-line/40 my-2">
            {chatLog.map((log, i) => (
              <div
                key={i}
                className={`p-2.5 rounded border leading-relaxed text-[12px] ${
                  log.sender === 'user'
                    ? 'bg-brand/10 border-brand/20 text-ink self-end rounded-tr-none max-w-[85%]'
                    : 'bg-surface border-line text-ink self-start rounded-tl-none max-w-[90%]'
                }`}
              >
                <div className="whitespace-pre-wrap">{log.text}</div>
                {log.sender === 'ai' && i > 0 && (
                  <button
                    onClick={() => handleCopy(log.text)}
                    className="mt-2 text-[10px] text-muted hover:text-ink flex items-center gap-1 font-bold"
                    title="Copy response text"
                  >
                    <FiCopy /> Copy text
                  </button>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted self-start bg-soft border border-line p-2 rounded">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
                Analyzing page state...
              </div>
            )}

            {/* Quick chips */}
            {chatLog.length === 1 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Suggested Actions</p>
                <div className="flex flex-col gap-1.5">
                  {context.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(p)}
                      className="w-full text-left bg-surface hover:bg-soft border border-line hover:border-brand/40 px-3 py-2 rounded text-[11px] text-muted hover:text-ink transition-all flex items-center gap-1.5"
                    >
                      <FiFileText className="flex-shrink-0 text-brand" /> {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chat Form Input */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-line flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask anything about this page..."
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
    </div>
  );
};

export default ContextCopilot;

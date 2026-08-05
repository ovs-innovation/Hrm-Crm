import React, { useState, useEffect } from 'react';
import { FiPlay, FiSend, FiCompass, FiZap, FiSmartphone, FiMail } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const ExecutiveCommandCenter = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    { role: 'assistant', text: 'Welcome to Vastora OS Command Console. Execute system directives using natural language.' }
  ]);
  const [briefHtml, setBriefHtml] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    fetchBrief();
  }, []);

  const fetchBrief = async () => {
    setBriefLoading(true);
    try {
      const { data } = await api.get('/executive/daily-brief');
      if (data.success) {
        setBriefHtml(data.briefHtml);
      }
    } catch (err) {
      toast.error('Failed to load Executive Daily Briefing');
    } finally {
      setBriefLoading(false);
    }
  };

  const handleSendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const userMsg = command;
    setCommand('');
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/executive/command', { queryText: userMsg });
      if (data.success) {
        setChatLog(prev => [
          ...prev,
          { 
            role: 'assistant', 
            text: data.chatReply,
            actions: data.actions
          }
        ]);
      }
    } catch (err) {
      toast.error('Failed to execute command directive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Daily Brief Column */}
      <div className="lg:col-span-2 flex flex-col gap-4 border border-line rounded bg-surface p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">Executive Daily Briefing</h2>
            <p className="text-xs text-muted">Daily operations summary & alerts</p>
          </div>
          <button 
            onClick={fetchBrief} 
            className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
          >
            <FiZap className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {briefLoading ? (
          <div className="flex flex-col gap-3 py-12 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-xs text-muted">Compiling business health snapshot...</p>
          </div>
        ) : (
          <div 
            className="prose prose-sm max-w-none text-ink text-sm overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: briefHtml || '<p className="text-muted text-xs">No active briefing calculated yet.</p>' }}
          />
        )}
      </div>

      {/* Command Console Box */}
      <div className="flex flex-col border border-line rounded bg-ink text-surface p-6 h-[500px]">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <FiCompass className="h-4 w-4 text-brand-light" />
          <div>
            <h3 className="text-sm font-bold text-white">AI Command Console</h3>
            <p className="text-[10px] text-white/50">Direct system query execution</p>
          </div>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs font-mono">
          {chatLog.map((log, index) => (
            <div key={index} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-lg max-w-[85%] ${log.role === 'user' ? 'bg-brand text-white' : 'bg-white/5 text-white/90'}`}>
                {log.text}
                {log.actions && log.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {log.actions.map((act, i) => (
                      <button 
                        key={i} 
                        className="flex items-center gap-1 rounded bg-white/20 hover:bg-white/35 px-2 py-1 text-[10px]"
                        onClick={() => toast.success(`Triggered Action: ${act.name}`)}
                      >
                        <FiPlay className="h-2 w-2" />
                        {act.label || act.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-white/40 italic">Agent Orchestrator planning actions...</div>
          )}
        </div>

        <form onSubmit={handleSendCommand} className="flex gap-2 border-t border-white/10 pt-4">
          <input 
            type="text" 
            placeholder="Type directive (e.g. Approve pending leaves)..." 
            className="flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-brand focus:outline-none"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <button type="submit" className="rounded bg-brand px-3 text-white hover:bg-brand/90">
            <FiSend className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExecutiveCommandCenter;

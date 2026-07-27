import React, { useEffect, useState, useRef } from 'react';
import PageShell from '../components/PageShell';
import { FiSend, FiCpu } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Policies = () => {
  const [announcements, setAnnouncements] = useState([]);
  
  // RAG HR Chatbot states
  const [kbQuestion, setKbQuestion] = useState('');
  const [kbChatHistory, setKbChatHistory] = useState([
    { sender: 'ai', text: 'Hello! I am your AI HR Assistant. Ask me anything about holidays, leave policies, or employee SOPs.' }
  ]);
  const [kbSources, setKbSources] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get('/announcements').then((res) => setAnnouncements(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kbChatHistory]);

  const handleKbQuery = async (e) => {
    e.preventDefault();
    if (!kbQuestion.trim() || loadingChat) return;

    const userMsg = kbQuestion;
    setKbQuestion('');
    setKbChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoadingChat(true);

    try {
      const res = await api.post('/ai/kb/query', { question: userMsg });
      setKbChatHistory(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
      setKbSources(res.data.sources || []);
    } catch (err) {
      toast.error('AI Assistant did not respond. Check connection.');
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <PageShell title="Announcements & Policies" description="Company updates and interactive AI Helpdesk" count={announcements.length}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        
        {/* Left Hand: Announcements Feed */}
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-[13px] text-muted">No announcements published.</p>
          ) : announcements.map((a) => (
            <article key={a._id} className="rounded border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium text-ink">{a.title}</h2>
                <span className="shrink-0 rounded bg-soft px-2 py-0.5 text-xs text-muted">{a.type}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{a.description}</p>
              <p className="mt-2 text-xs text-muted">{new Date(a.date).toLocaleDateString('en-IN')}</p>
            </article>
          ))}
        </div>

        {/* Right Hand: AI HR Policy Advisor Chat */}
        <div className="rounded-2xl border border-line bg-surface p-4 flex flex-col h-[480px]">
          <div className="flex items-center gap-2 border-b border-line pb-3 mb-3">
            <FiCpu className="text-brand h-4.5 w-4.5" />
            <div>
              <h3 className="text-xs font-bold text-ink">AI Policy Advisor</h3>
              <p className="text-[10px] text-muted">Trained on HR Handbooks</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-1 flex flex-col">
            {kbChatHistory.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl p-2.5 text-[12px] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-brand text-white self-end rounded-tr-none'
                    : 'bg-soft border border-line self-start rounded-tl-none text-ink'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loadingChat && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted p-2 bg-soft rounded-lg self-start">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-brand"></div>
                Analyzing policies...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sources cited */}
          {kbSources.length > 0 && (
            <div className="text-[9px] text-muted p-1 border-t border-line mt-2 flex flex-wrap gap-1 items-center">
              <strong>Source:</strong>
              {kbSources.map((s, idx) => (
                <span key={idx} className="bg-brand/10 text-brand px-1 py-0.5 rounded">
                  {s.title}
                </span>
              ))}
            </div>
          )}

          {/* Prompt input Form */}
          <form onSubmit={handleKbQuery} className="flex gap-2 border-t border-line pt-3 mt-2">
            <input
              type="text"
              value={kbQuestion}
              onChange={e => setKbQuestion(e.target.value)}
              placeholder="Ask, e.g. 'How to request casual leaves?'"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand/35 text-ink"
            />
            <button
              type="submit"
              disabled={loadingChat}
              className="rounded-xl bg-brand px-3 text-white flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <FiSend className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </div>
    </PageShell>
  );
};

export default Policies;

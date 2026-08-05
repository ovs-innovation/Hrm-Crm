import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiCpu,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiPlay,
  FiRefreshCw,
  FiZap,
  FiX,
  FiCompass,
  FiMessageSquare,
  FiActivity,
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'ask', label: 'Ask', icon: FiMessageSquare },
  { id: 'pulse', label: 'Pulse', icon: FiActivity },
  { id: 'actions', label: 'Actions', icon: FiZap },
];

const formatAiText = (text = '') => {
  const lines = String(text).split('\n');
  return lines.map((line, idx) => {
    const withBold = [];
    let rest = line;
    let key = 0;
    while (rest.length) {
      const m = rest.match(/\*\*(.+?)\*\*|\*(.+?)\*/);
      if (!m) {
        withBold.push(<span key={`${idx}-${key++}`}>{rest}</span>);
        break;
      }
      const i = m.index || 0;
      if (i > 0) withBold.push(<span key={`${idx}-${key++}`}>{rest.slice(0, i)}</span>);
      withBold.push(
        <strong key={`${idx}-${key++}`} className="font-semibold text-ink">
          {m[1] || m[2]}
        </strong>
      );
      rest = rest.slice(i + m[0].length);
    }
    const bullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
    return (
      <p key={idx} className={`leading-relaxed ${bullet ? 'pl-2' : ''} ${idx > 0 ? 'mt-1.5' : ''}`}>
        {withBold}
      </p>
    );
  });
};

const ContextCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('ask');
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackPrompt, setFeedbackPrompt] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loading, tab]);

  const loadBriefing = async (path) => {
    setBriefingLoading(true);
    try {
      const { data } = await api.get('/ai/copilot/briefing', { params: { path } });
      setBriefing(data);
      setChatLog([
        {
          sender: 'ai',
          kind: 'welcome',
          text:
            `You're on **${data.page}**. I pulled live numbers for this screen.\n\n` +
            (data.highlights || []).map((h) => `• ${h}`).join('\n') +
            '\n\nAsk anything, or tap a suggested action below.',
        },
      ]);
    } catch {
      setBriefing({
        page: 'Workspace',
        module: 'General',
        metrics: [],
        highlights: ['Live briefing unavailable — you can still ask me anything.'],
        prompts: [
          'What needs my attention right now?',
          'Summarize today’s priorities',
          'Draft a short status update',
        ],
      });
      setChatLog([
        {
          sender: 'ai',
          kind: 'welcome',
          text: "Hi — I'm your page Co-Pilot. Ask about this screen, draft messages, or pick a suggested action.",
        },
      ]);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing(location.pathname);
    setTab('ask');
    setFeedbackPrompt(null);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const getContextPayload = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    const looksLikeId = lastPart && (lastPart.length === 24 || lastPart.startsWith('EMP') || lastPart.startsWith('NT-'));

    return {
      page: briefing?.page || 'Dashboard',
      module: briefing?.module || (path.includes('/crm') ? 'CRM' : path.includes('/hrm') ? 'HRM' : 'General'),
      path,
      selectedEmployeeId:
        sessionStorage.getItem('selectedEmployeeId') ||
        (path.includes('/employees') && looksLikeId ? lastPart : null),
      selectedLeadId:
        sessionStorage.getItem('selectedLeadId') ||
        (path.includes('/leads') && looksLikeId ? lastPart : null),
      selectedDealId:
        sessionStorage.getItem('selectedDealId') ||
        (path.includes('/deals') && looksLikeId ? lastPart : null),
      filters: JSON.parse(sessionStorage.getItem('activeFilters') || '{}'),
      liveMetrics: briefing?.metrics || [],
      highlights: briefing?.highlights || [],
    };
  };

  const pushAiResponse = (responseObj) => {
    const summary =
      responseObj.summary ||
      responseObj.chatResponse ||
      responseObj.chatReply ||
      'Done — I processed that against your live workspace context.';
    const confidence = Math.round((responseObj.confidence ?? 0.86) * 100);
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: summary,
        confidence,
        reasoning: responseObj.reasoning,
        actions: responseObj.actions || [],
        redirectUrl: responseObj.redirectUrl,
      },
    ]);
    if (responseObj.redirectUrl) {
      toast.success(`Opening ${responseObj.redirectUrl}`);
      setTimeout(() => navigate(responseObj.redirectUrl), 900);
    }
  };

  const runCommand = async (userText) => {
    if (!userText?.trim() || loading) return;
    setChatLog((prev) => [...prev, { sender: 'user', text: userText.trim() }]);
    setLoading(true);
    setTab('ask');
    try {
      const res = await api.post('/ai/agent/command', {
        userInput: userText.trim(),
        context: getContextPayload(),
      });
      pushAiResponse(res.data || {});
    } catch (err) {
      const msg = err.response?.data?.message || 'Co-Pilot could not complete that request.';
      setChatLog((prev) => [...prev, { sender: 'ai', text: msg, error: true }]);
      toast.error('Co-Pilot request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const text = userInput;
    setUserInput('');
    await runCommand(text);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text).replace(/\*\*/g, ''));
      toast.success('Copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleActionClick = async (action) => {
    await runCommand(`Run tool: ${action.name} with args: ${JSON.stringify(action.parameters || {})}`);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      await api.post('/ai/learning/feedback', {
        prompt: feedbackPrompt,
        feedback: feedbackText,
        correctedResponse: `Prefer format modification: ${feedbackText}`,
        status: 'Correction',
      });
      toast.success('Saved — Co-Pilot will learn from this');
      setFeedbackPrompt(null);
      setFeedbackText('');
    } catch {
      toast.error('Could not save feedback');
    }
  };

  const prompts = briefing?.prompts || [];
  const metrics = briefing?.metrics || [];
  const highlights = briefing?.highlights || [];

  return (
    <div className="fixed top-24 right-0 z-[900] flex items-start">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 rounded-l-lg border border-r-0 border-line bg-brand px-2.5 py-2 text-white shadow-md hover:bg-brand-hover"
        title="AI Co-Pilot"
      >
        <FiCpu className="h-4 w-4" />
        {isOpen ? <FiChevronRight className="h-3.5 w-3.5" /> : <FiChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {isOpen && (
        <div className="flex h-[min(82vh,720px)] w-[380px] flex-col overflow-hidden border border-line bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-line bg-soft px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-xlight text-brand">
                    <FiCpu className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-semibold text-ink">AI Co-Pilot</h3>
                    <p className="text-[11px] text-muted">
                      {briefingLoading ? 'Reading this page…' : `Context · ${briefing?.page || 'Workspace'}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadBriefing(location.pathname)}
                  className="rounded p-1.5 text-muted hover:bg-white hover:text-ink"
                  title="Refresh page pulse"
                >
                  <FiRefreshCw className={`h-3.5 w-3.5 ${briefingLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1.5 text-muted hover:bg-white hover:text-ink"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex rounded-lg border border-line bg-white p-0.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                      active ? 'bg-brand text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {tab === 'pulse' && (
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                  {briefingLoading && !metrics.length ? (
                    <div className="col-span-2 py-8 text-center text-[12px] text-muted">Loading live metrics…</div>
                  ) : metrics.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-[12px] text-muted">No metrics for this page yet.</div>
                  ) : (
                    metrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-line bg-soft p-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{m.label}</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{m.value}</p>
                        {m.hint && <p className="mt-0.5 text-[11px] text-muted">{m.hint}</p>}
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-lg border border-line bg-white p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <FiCompass className="h-3 w-3 text-brand" /> Attention
                  </p>
                  <ul className="space-y-2">
                    {highlights.map((h) => (
                      <li key={h} className="flex gap-2 text-[12px] text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => runCommand(`Using this page pulse: ${JSON.stringify(highlights)}. Give me a prioritized action plan for the next 2 hours.`)}
                    className="btn-primary mt-3 h-8 w-full text-[12px]"
                  >
                    Turn this into an action plan
                  </button>
                </div>
              </div>
            )}

            {tab === 'actions' && (
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                <p className="text-[11px] text-muted">
                  Suggested for <span className="font-medium text-ink">{briefing?.page || 'this page'}</span>
                </p>
                {prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={loading}
                    onClick={() => runCommand(p)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-left text-[12px] text-ink transition-colors hover:border-brand/40 hover:bg-brand-xlight disabled:opacity-60"
                  >
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      <FiZap className="h-3 w-3" /> Run
                    </span>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {tab === 'ask' && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                  {chatLog.map((log, i) => (
                    <div
                      key={`${i}-${log.sender}`}
                      className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-[12px] ${
                          log.sender === 'user'
                            ? 'rounded-br-md bg-brand text-white'
                            : log.error
                              ? 'rounded-bl-md border border-danger/20 bg-danger/5 text-ink'
                              : 'rounded-bl-md border border-line bg-soft text-ink'
                        }`}
                      >
                        <div className={log.sender === 'user' ? 'whitespace-pre-wrap' : ''}>
                          {log.sender === 'user' ? log.text : formatAiText(log.text)}
                        </div>

                        {typeof log.confidence === 'number' && (
                          <p className="mt-2 text-[10px] text-muted">Confidence {log.confidence}%</p>
                        )}

                        {log.actions?.length > 0 && (
                          <div className="mt-2 space-y-1.5 border-t border-line/60 pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                              Recommended actions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {log.actions.map((act, aIdx) => (
                                <button
                                  key={`${act.name}-${aIdx}`}
                                  type="button"
                                  onClick={() => handleActionClick(act)}
                                  className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[10px] font-medium text-white hover:bg-brand-hover"
                                >
                                  <FiPlay className="h-2.5 w-2.5" />
                                  {act.label || act.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.reasoning && (
                          <details className="mt-2 text-[10px] text-muted">
                            <summary className="cursor-pointer font-medium hover:text-brand">Why this answer</summary>
                            <pre className="mt-1 max-h-28 overflow-auto rounded border border-line bg-white p-2 font-mono text-[9px] whitespace-pre-wrap">
                              {typeof log.reasoning === 'object'
                                ? JSON.stringify(log.reasoning, null, 2)
                                : log.reasoning}
                            </pre>
                          </details>
                        )}

                        {log.sender === 'ai' && i > 0 && !log.error && (
                          <div className="mt-2 flex items-center justify-between border-t border-line/50 pt-2 text-[10px] text-muted">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 hover:text-brand"
                                onClick={() => {
                                  api
                                    .post('/ai/learning/feedback', {
                                      prompt: chatLog[i - 1]?.text,
                                      status: 'Success',
                                    })
                                    .catch(() => {});
                                  toast.success('Marked helpful');
                                }}
                              >
                                <FiThumbsUp className="h-3 w-3" /> Helpful
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 hover:text-danger"
                                onClick={() => setFeedbackPrompt(chatLog[i - 1]?.text)}
                              >
                                <FiThumbsDown className="h-3 w-3" /> Improve
                              </button>
                            </div>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-ink"
                              onClick={() => handleCopy(log.text)}
                            >
                              <FiCopy className="h-3 w-3" /> Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {feedbackPrompt && (
                    <form onSubmit={submitFeedback} className="rounded-lg border border-line bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                        <span>Teach Co-Pilot</span>
                        <button type="button" onClick={() => setFeedbackPrompt(null)} className="hover:text-ink">
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="How should this be answered next time?"
                        className="app-input h-8 w-full text-[12px]"
                        autoFocus
                      />
                      <button type="submit" className="btn-primary h-8 w-full text-[12px]">
                        Save correction
                      </button>
                    </form>
                  )}

                  {loading && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2 text-[11px] text-muted">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Thinking with live page context…
                    </div>
                  )}

                  {!loading && chatLog.length <= 1 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Try these</p>
                      {prompts.slice(0, 3).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => runCommand(p)}
                          className="w-full rounded-lg border border-dashed border-line px-3 py-2 text-left text-[11px] text-muted hover:border-brand/40 hover:bg-brand-xlight hover:text-ink"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleCustomSubmit} className="border-t border-line bg-white p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCustomSubmit(e);
                        }
                      }}
                      placeholder={`Ask about ${briefing?.page || 'this page'}…`}
                      disabled={loading}
                      className="app-input min-h-[44px] flex-1 resize-none py-2 text-[12px]"
                    />
                    <button
                      type="submit"
                      disabled={loading || !userInput.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiSend className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted">Enter to send · Shift+Enter for new line</p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextCopilot;

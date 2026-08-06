import React, { useState, useEffect, useRef } from 'react';
import PageShell from '../../components/PageShell';
import {
  FiMessageSquare,
  FiMail,
  FiAlertCircle,
  FiTag,
  FiSend,
  FiZap,
  FiUserPlus,
  FiClipboard,
  FiSearch,
  FiFilter,
  FiSmile,
  FiUser,
  FiPaperclip,
  FiClock,
  FiRefreshCw,
  FiPlus
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const AIInbox = () => {
  // Inbox data states
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('open');
  const [sentiment, setSentiment] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Interaction inputs
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Simulation modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simName, setSimName] = useState('John Doe');
  const [simEmail, setSimEmail] = useState('john@example.com');
  const [simPhone, setSimPhone] = useState('+919876543210');
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simSubject, setSimSubject] = useState('Pricing inquiry for Enterprise');
  const [simBody, setSimBody] = useState(
    'Hi! I would like to get a custom quote for 150 team members. We are interested in your HRM and CRM modules. Can we jump on a call?'
  );

  // Agents list for assignment
  const [agents, setAgents] = useState([]);

  // Socket connection
  const socketRef = useRef(null);

  useEffect(() => {
    fetchInbox();
    fetchAgents();

    // Socket.io connection setup
    const socket = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('newAIInboxMessage', (newMsg) => {
      setMessages((prev) => [newMsg, ...prev]);
      toast.success(`New ${newMsg.channel} message from ${newMsg.senderName}!`);
    });

    socket.on('updateAIInboxMessage', (updatedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
      setSelectedMsg((curr) => (curr && curr._id === updatedMsg._id ? updatedMsg : curr));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchInbox();
  }, [channel, status, sentiment, category, page]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        channel,
        status,
        sentiment,
        category,
        page,
        limit: 20
      };
      const { data } = await api.get('/ai-inbox', { params });
      if (data.success) {
        setMessages(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        if (data.data?.length && !selectedMsg) {
          setSelectedMsg(data.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load inbox feeds.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await api.get('/users');
      // Fallback or use standard list
      setAgents(data || []);
    } catch (e) {
      // Standard local backup
      setAgents([
        { _id: '1', name: 'Vikram Mehta', role: 'Sales' },
        { _id: '2', name: 'Ananya Iyer', role: 'HR' }
      ]);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMsg) return;
    setSendingReply(true);
    try {
      const { data } = await api.post(`/ai-inbox/${selectedMsg._id}/reply`, { text: replyText });
      if (data.success) {
        toast.success('Reply sent successfully!');
        setReplyText('');
      }
    } catch (err) {
      toast.error('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateLead = async () => {
    if (!selectedMsg) return;
    try {
      const { data } = await api.post(`/ai-inbox/${selectedMsg._id}/convert-lead`);
      if (data.success) {
        toast.success('Lead successfully created in CRM!');
      }
    } catch (err) {
      toast.error('Lead conversion failed.');
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedMsg) return;
    try {
      const { data } = await api.post(`/ai-inbox/${selectedMsg._id}/convert-ticket`);
      if (data.success) {
        toast.success('Support ticket created in Helpdesk!');
      }
    } catch (err) {
      toast.error('Ticket conversion failed.');
    }
  };

  const handleAssignAgent = async (userId) => {
    if (!selectedMsg || !userId) return;
    try {
      const { data } = await api.post(`/ai-inbox/${selectedMsg._id}/assign`, { userId });
      if (data.success) {
        toast.success('Thread reassigned.');
      }
    } catch (err) {
      toast.error('Assignment failed.');
    }
  };

  const handleSimulateInbound = async () => {
    try {
      const { data } = await api.post('/ai-inbox/simulate', {
        senderName: simName,
        senderEmail: simEmail,
        senderPhone: simPhone,
        channel: simChannel,
        subject: simSubject,
        body: simBody
      });
      if (data.success) {
        toast.success('Inbound message simulated successfully!');
        setShowSimulateModal(false);
        fetchInbox();
      }
    } catch (err) {
      toast.error('Simulation failed.');
    }
  };

  const loadSmartReply = () => {
    if (selectedMsg && selectedMsg.aiReplyDraft) {
      setReplyText(selectedMsg.aiReplyDraft);
      toast.success('Loaded AI suggested reply draft.');
    } else {
      toast.error('No AI reply draft generated for this message.');
    }
  };

  return (
    <PageShell
      title="AI Unified Inbox"
      description="Consolidated feeds (WhatsApp, Email, Website Chat) with real-time updates and automated AI classification."
    >
      <div className="flex flex-col space-y-4">
        {/* Top Controls: Search, Filters & Inbound Simulation */}
        <div className="bg-surface border border-line rounded-3xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <FiSearch className="absolute left-3 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search inbox..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInbox()}
                className="app-input pl-9 pr-4 h-9 w-full text-xs"
              />
            </div>
            
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="app-input h-9 text-xs py-1"
            >
              <option value="">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="website_chat">Website Chat</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="app-input h-9 text-xs py-1"
            >
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="app-input h-9 text-xs py-1"
            >
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="app-input h-9 text-xs py-1"
            >
              <option value="">All AI Categories</option>
              <option value="Sales">Sales</option>
              <option value="Support">Support</option>
              <option value="Billing">Billing</option>
              <option value="General">General</option>
            </select>

            <button onClick={fetchInbox} className="btn-outline h-9 px-3 text-xs flex items-center gap-1.5">
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="btn-primary h-9 px-4 text-xs font-bold flex items-center gap-1.5 bg-brand"
          >
            <FiPlus /> Simulate Inbound Msg
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start text-ink text-[13px] font-medium">
          
          {/* Left Panel: Stream List */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4 shadow-sm min-h-[500px]">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-line pb-2 mb-1">
              Live Stream
            </h3>

            {loading && messages.length === 0 ? (
              <div className="text-center py-10 text-muted">Scanning communications...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-muted">No messages found. Use 'Simulate Inbound' to seed one.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => {
                      setSelectedMsg(msg);
                      setReplyText('');
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedMsg?._id === msg._id
                        ? 'border-brand bg-brand/5'
                        : 'border-line bg-surface hover:border-line-hover'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-ink text-[12px] truncate max-w-[150px]">{msg.senderName}</span>
                      <span className="text-[9px] text-muted">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.subject && <p className="text-[11px] font-semibold truncate text-ink">{msg.subject}</p>}
                    <p className="text-[11px] text-muted truncate">{msg.body}</p>
                    
                    <div className="mt-2.5 flex flex-wrap gap-1.5 items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        msg.channel === 'whatsapp' ? 'bg-green-500/10 text-green-500' :
                        msg.channel === 'email' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {msg.channel}
                      </span>
                      
                      <div className="flex gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border border-line bg-soft text-ink flex items-center gap-0.5`}>
                          <FiTag className="h-2 w-2" /> {msg.aiCategory}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          msg.sentiment === 'Positive' ? 'bg-green-500/15 text-green-600' :
                          msg.sentiment === 'Negative' ? 'bg-red-500/15 text-red-600' :
                          'bg-gray-500/15 text-gray-600'
                        }`}>
                          {msg.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Detail & Reply View */}
          <div className="bg-surface border border-line rounded-3xl p-6 space-y-6 shadow-sm min-h-[500px]">
            {selectedMsg ? (
              <>
                {/* Header Profile */}
                <div className="border-b border-line pb-4 flex flex-wrap gap-4 justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-ink flex items-center gap-2">
                      {selectedMsg.senderName}
                      {selectedMsg.sentiment === 'Negative' && (
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">Urgently Escalated</span>
                      )}
                    </h2>
                    <p className="text-xs text-muted">
                      {selectedMsg.senderEmail && `Email: ${selectedMsg.senderEmail} | `}
                      {selectedMsg.senderPhone && `Phone: ${selectedMsg.senderPhone}`}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* MCP / AI Interactive Actions */}
                    <button
                      onClick={handleCreateLead}
                      disabled={selectedMsg.linkedLead}
                      className={`btn-outline h-8 px-3 text-xs inline-flex items-center gap-1.5 font-bold rounded-full ${
                        selectedMsg.linkedLead ? 'border-green-500/20 text-green-500 bg-green-500/5' : ''
                      }`}
                    >
                      <FiUserPlus /> {selectedMsg.linkedLead ? 'Linked CRM Lead' : 'Convert to Lead'}
                    </button>
                    <button
                      onClick={handleCreateTicket}
                      disabled={selectedMsg.linkedTicket}
                      className={`btn-outline h-8 px-3 text-xs inline-flex items-center gap-1.5 font-bold rounded-full ${
                        selectedMsg.linkedTicket ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : ''
                      }`}
                    >
                      <FiClipboard /> {selectedMsg.linkedTicket ? 'Linked Support Ticket' : 'Convert to Ticket'}
                    </button>
                  </div>
                </div>

                {/* AI Summary and Action Drawer */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-soft/40 border border-line rounded-2xl p-3 space-y-1.5 text-xs">
                    <span className="block text-[9px] uppercase font-bold text-muted">AI Intent Classification</span>
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <FiTag className="text-brand" /> {selectedMsg.aiCategory} Category
                    </p>
                  </div>
                  <div className="bg-soft/40 border border-line rounded-2xl p-3 space-y-1.5 text-xs">
                    <span className="block text-[9px] uppercase font-bold text-muted">Assign Agent</span>
                    <select
                      value={selectedMsg.assignedTo || ''}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      className="app-input h-7 py-0.5 text-xs w-full cursor-pointer bg-transparent border-0 font-bold text-brand"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-soft/40 border border-line rounded-2xl p-3 space-y-1.5 text-xs">
                    <span className="block text-[9px] uppercase font-bold text-muted">Sentiment Analyzer</span>
                    <p className={`font-bold ${
                      selectedMsg.sentiment === 'Positive' ? 'text-green-500' :
                      selectedMsg.sentiment === 'Negative' ? 'text-red-500' : 'text-ink'
                    }`}>
                      {selectedMsg.sentiment} Analysis
                    </p>
                  </div>
                </div>

                {/* Conversation Timeline & Thread */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                    <FiMessageSquare /> Conversation Thread
                  </h4>
                  
                  <div className="border border-line rounded-2xl bg-soft/10 p-4 space-y-4 max-h-[300px] overflow-y-auto">
                    {selectedMsg.messages?.map((m, idx) => (
                      <div key={idx} className={`flex flex-col ${m.sender === 'client' ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 ${
                          m.sender === 'client'
                            ? 'bg-surface border border-line text-ink'
                            : 'bg-brand text-white'
                        }`}>
                          <span className="block text-[9px] font-bold opacity-75 mb-1">{m.senderName}</span>
                          <p className="text-xs leading-relaxed whitespace-pre-line">{m.body}</p>
                        </div>
                        <span className="text-[9px] text-muted mt-1 px-1">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline and suggested follow-ups */}
                {selectedMsg.followUpSuggestions?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted">AI Suggested Follow-ups</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMsg.followUpSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setReplyText(suggestion)}
                          className="bg-brand/5 border border-brand/20 text-brand text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply drafting area */}
                <div className="border-t border-line pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted">Compose Reply Dispatch</span>
                    {selectedMsg.aiReplyDraft && (
                      <button
                        onClick={loadSmartReply}
                        className="btn-outline h-7 px-2.5 text-xs text-brand font-bold border-brand/20 bg-brand/5 hover:bg-brand/10 inline-flex items-center gap-1 rounded-full"
                      >
                        <FiZap /> AI Smart Reply Draft
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder={`Draft reply via ${selectedMsg.channel}...`}
                      className="app-input w-full p-3 text-[12px] h-24 focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <button className="btn-outline h-8 px-3 text-xs flex items-center gap-1">
                      <FiPaperclip /> Attachments
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="btn-primary h-8 px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                      <FiSend /> Dispatch Reply
                    </button>
                  </div>
                </div>

                {/* Activity log / timeline drawer */}
                <div className="border-t border-line pt-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                    <FiClock /> Thread Audit Timeline
                  </span>
                  <div className="space-y-1.5">
                    {selectedMsg.timeline?.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand"></span>
                        <span className="font-bold">{t.action}</span>
                        <span>•</span>
                        <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-muted">
                <FiMessageSquare className="h-10 w-10 mb-2 opacity-50 text-brand" />
                <p className="text-xs">No active thread selected.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Simulator Modal Popup */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-line rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FiPlus className="text-brand" /> Simulate Customer Message
              </h3>
              <button onClick={() => setShowSimulateModal(false)} className="text-muted hover:text-ink font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted mb-1">Customer Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="app-input h-8 w-full text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="app-input h-8 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Phone</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="app-input h-8 w-full text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Channel</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value)}
                    className="app-input h-8 w-full text-xs cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="website_chat">Website Chat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Subject</label>
                  <input
                    type="text"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="app-input h-8 w-full text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted mb-1">Message Body</label>
                <textarea
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  rows={3}
                  className="app-input w-full p-2 text-xs h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button onClick={() => setShowSimulateModal(false)} className="btn-outline h-8 px-4 text-xs">
                Cancel
              </button>
              <button onClick={handleSimulateInbound} className="btn-primary h-8 px-4 text-xs font-bold">
                Inject Inbound Message
              </button>
            </div>
          </div>
        </div>
      )}

    </PageShell>
  );
};

export default AIInbox;

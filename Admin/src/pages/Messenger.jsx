import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { getFileUrl } from '../services/api';
import {
  FiSearch,
  FiMoreVertical,
  FiSmile,
  FiPaperclip,
  FiSend,
  FiFileText,
  FiDownload,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const sameId = (a, b) => String(a || '') === String(b || '');

const Messenger = () => {
  const [tab, setTab] = useState('internal'); // internal | whatsapp
  const [internalContacts, setInternalContacts] = useState([]);
  const [whatsappContacts, setWhatsappContacts] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({ configured: false });
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [socketState, setSocketState] = useState('offline'); // online | offline | connecting
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState('');
  const [sendError, setSendError] = useState('');
  const [waPhoneDraft, setWaPhoneDraft] = useState('');

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeContactRef = useRef(null);

  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const loggedInUserId = adminInfo._id;

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Socket.IO — same-origin via Vite proxy (/socket.io → :5000)
  useEffect(() => {
    if (!loggedInUserId) return undefined;

    setSocketState('connecting');
    const socketInstance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 12,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => setSocketState('online'));
    socketInstance.on('disconnect', () => setSocketState('offline'));
    socketInstance.on('connect_error', () => setSocketState('offline'));

    socketInstance.on('getOnlineUsers', (users) => {
      setOnlineUsers((users || []).map(String));
    });

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.close();
    };
  }, [loggedInUserId]);

  // Contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data } = await api.get('/messages/contacts');
        setInternalContacts(data.internal || []);
        setWhatsappContacts(data.whatsapp || []);
        setWhatsappStatus(data.whatsappStatus || { configured: false });
        const list = tab === 'whatsapp' ? data.whatsapp : data.internal;
        if (list?.length && !activeContactRef.current) {
          setActiveContact(list[0]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Fallback to legacy /users for internal only
        try {
          const response = await api.get('/users');
          const mapped = (response.data || []).map((c) => ({ ...c, channel: 'internal' }));
          setInternalContacts(mapped);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchContacts();
  }, []);

  const contacts = (tab === 'whatsapp' ? whatsappContacts : internalContacts).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  // Load messages for active contact
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeContact) return;
      const channel = activeContact.channel || 'internal';
      try {
        let response;
        if (channel === 'whatsapp') {
          const phone = normalizeDigits(activeContact.phone || activeContact._id);
          response = await api.get(`/messages/whatsapp/${phone}`);
          await api.post(`/messages/whatsapp/seen/${phone}`, {});
        } else {
          response = await api.get(`/messages/${activeContact._id}`, { params: { channel } });
          if (socket?.connected) {
            socket.emit('markSeen', {
              senderId: activeContact._id,
              receiverId: loggedInUserId,
            });
          }
        }
        setMessages(response.data || []);
        setSendError('');
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (error.response?.status === 401) {
          setSendError('Session expired. Please refresh the page or sign in again.');
        }
      }
    };
    fetchMessages();
  }, [activeContact, socket, loggedInUserId]);

  // Live message events
  useEffect(() => {
    if (!socket) return undefined;

    const onNewMessage = (message) => {
      const contact = activeContactRef.current;
      if (!contact || (contact.channel || 'internal') !== 'internal') return;
      if (
        sameId(message.senderId, contact._id) ||
        sameId(message.receiverId, contact._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => sameId(m._id, message._id))) return prev;
          return [...prev, message];
        });
        if (sameId(message.senderId, contact._id)) {
          socket.emit('markSeen', {
            senderId: contact._id,
            receiverId: loggedInUserId,
          });
        }
      }
    };

    const onWhatsApp = (message) => {
      const contact = activeContactRef.current;
      if (!contact || contact.channel !== 'whatsapp') return;
      if (normalizeDigits(message.whatsappPhone) === normalizeDigits(contact.phone || contact._id)) {
        setMessages((prev) => {
          if (prev.some((m) => sameId(m._id, message._id))) return prev;
          return [...prev, message];
        });
      }
      // Refresh WA contact list if new phone
      setWhatsappContacts((prev) => {
        const phone = normalizeDigits(message.whatsappPhone);
        if (!phone || prev.some((c) => c.phone === phone)) return prev;
        return [
          {
            _id: `wa:${phone}`,
            name: message.contactName || phone,
            role: 'WhatsApp',
            phone,
            channel: 'whatsapp',
          },
          ...prev,
        ];
      });
    };

    const onDelivered = (receiverId) => {
      const contact = activeContactRef.current;
      if (contact && sameId(contact._id, receiverId)) {
        setMessages((prev) =>
          prev.map((msg) =>
            sameId(msg.receiverId, receiverId) && msg.status === 'sent'
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }
    };

    const onSeen = (receiverId) => {
      const contact = activeContactRef.current;
      if (contact && sameId(contact._id, receiverId)) {
        setMessages((prev) =>
          prev.map((msg) =>
            sameId(msg.receiverId, receiverId) &&
            (msg.status === 'sent' || msg.status === 'delivered')
              ? { ...msg, status: 'seen' }
              : msg
          )
        );
      }
    };

    socket.on('newMessage', onNewMessage);
    socket.on('newWhatsAppMessage', onWhatsApp);
    socket.on('messagesDelivered', onDelivered);
    socket.on('messagesSeen', onSeen);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('newWhatsAppMessage', onWhatsApp);
      socket.off('messagesDelivered', onDelivered);
      socket.off('messagesSeen', onSeen);
    };
  }, [socket, loggedInUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTab = (next) => {
    setTab(next);
    setSearch('');
    const list = next === 'whatsapp' ? whatsappContacts : internalContacts;
    setActiveContact(list[0] || null);
    setMessages([]);
  };

  const startWhatsAppChat = () => {
    const phone = normalizeDigits(waPhoneDraft);
    if (phone.length < 10) {
      setSendError('Enter a valid WhatsApp number with country code (e.g. 9198xxxxxxxx)');
      return;
    }
    const existing = whatsappContacts.find((c) => c.phone === phone);
    if (existing) {
      setActiveContact(existing);
      setWaPhoneDraft('');
      return;
    }
    const contact = {
      _id: `wa:${phone}`,
      name: phone,
      role: 'WhatsApp',
      phone,
      channel: 'whatsapp',
    };
    setWhatsappContacts((prev) => [contact, ...prev]);
    setActiveContact(contact);
    setWaPhoneDraft('');
    setSendError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!activeContact || (!newMessage.trim() && !selectedFile) || uploading) return;

    try {
      setUploading(true);
      setSendError('');
      let fileUrl = '';
      let fileType = '';

      if (selectedFile && (activeContact.channel || 'internal') === 'internal') {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrl = uploadRes.data.fileUrl;
        fileType = uploadRes.data.fileType;
      }

      const channel = activeContact.channel || 'internal';
      let response;
      if (channel === 'whatsapp') {
        const phone = normalizeDigits(activeContact.phone || activeContact._id);
        response = await api.post('/messages/whatsapp', {
          text: newMessage.trim(),
          whatsappPhone: phone,
          contactName: activeContact.name || phone,
          channel: 'whatsapp',
        });
      } else {
        response = await api.post(`/messages/send/${activeContact._id}`, {
          text: newMessage || (selectedFile ? selectedFile.name : ''),
          fileUrl,
          fileType,
          channel: 'internal',
        });
      }

      const saved = response.data?.data || response.data;
      if (saved?._id) {
        setMessages((prev) => {
          if (prev.some((m) => sameId(m._id, saved._id))) return prev;
          return [...prev, saved];
        });
      }
      if (response.data?.warning) setSendError(response.data.warning);
      setNewMessage('');
      removeSelectedFile();
    } catch (error) {
      const payload = error.response?.data;
      if (payload?.data?._id) {
        setMessages((prev) => [...prev, payload.data]);
      }
      const msg = payload?.message || error.message || 'Failed to send';
      if (error.response?.status === 401 || /not authorized/i.test(msg)) {
        setSendError('Session expired. Please refresh the page or sign in again.');
      } else {
        setSendError(msg);
      }
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const isOnline = (userId) => onlineUsers.includes(String(userId));

  const isMine = (msg) => {
    if (msg.channel === 'whatsapp') return msg.direction === 'outbound';
    return sameId(msg.senderId, loggedInUserId);
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] min-h-[480px] p-4 md:p-6">
      <div className="app-panel h-full overflow-hidden flex rounded-xl shadow-sm bg-white">
        {/* Contact list */}
        <aside
          className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[340px] shrink-0 border-r border-line flex-col bg-white`}
        >
          <div className="p-4 border-b border-line space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Conversations</h2>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  socketState === 'online'
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-line bg-soft text-muted'
                }`}
                title={`Socket ${socketState}`}
              >
                {socketState === 'online' ? <FiWifi className="w-3 h-3" /> : <FiWifiOff className="w-3 h-3" />}
                {socketState === 'online' ? 'Live' : socketState === 'connecting' ? '…' : 'Offline'}
              </span>
            </div>

            <div className="flex p-0.5 rounded-lg bg-soft border border-line">
              <button
                type="button"
                onClick={() => handleTab('internal')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  tab === 'internal' ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                Team
              </button>
              <button
                type="button"
                onClick={() => handleTab('whatsapp')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  tab === 'whatsapp' ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                WhatsApp
              </button>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === 'whatsapp' ? 'Search WhatsApp…' : 'Search people…'}
                className="app-input pl-9 py-2 text-sm rounded-lg"
              />
            </div>

            {tab === 'whatsapp' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={waPhoneDraft}
                    onChange={(e) => setWaPhoneDraft(e.target.value)}
                    placeholder="91xxxxxxxxxx"
                    className="app-input flex-1 py-2 text-sm rounded-lg"
                  />
                  <button type="button" onClick={startWhatsAppChat} className="btn-primary px-3 py-2 text-xs rounded-lg">
                    Chat
                  </button>
                </div>
                <p className="text-[11px] text-muted leading-snug">
                  {whatsappStatus.configured
                    ? 'WhatsApp Cloud API connected.'
                    : 'Demo mode: messages save locally until WhatsApp API keys are set.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {contacts.map((contact) => {
              const active = sameId(activeContact?._id, contact._id);
              const online = contact.channel !== 'whatsapp' && isOnline(contact._id);
              return (
                <button
                  type="button"
                  key={contact._id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    active ? 'bg-brand-xlight' : 'hover:bg-soft'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-semibold">
                      {(contact.name || '?')[0].toUpperCase()}
                    </div>
                    {contact.channel !== 'whatsapp' && (
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          online ? 'bg-success' : 'bg-slate-300'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? 'text-brand' : 'text-ink'}`}>
                      {contact.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {contact.channel === 'whatsapp'
                        ? contact.phone || 'WhatsApp'
                        : online
                          ? 'Online'
                          : contact.role || 'Team'}
                    </p>
                  </div>
                </button>
              );
            })}
            {contacts.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted">
                {tab === 'whatsapp'
                  ? 'No WhatsApp contacts yet. Add a number above.'
                  : 'No teammates found.'}
              </div>
            )}
          </div>
        </aside>

        {/* Chat pane */}
        {activeContact ? (
          <section className="flex flex-1 flex-col min-w-0 bg-soft">
            <header className="h-16 shrink-0 border-b border-line bg-white px-4 md:px-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveContact(null)}
                  className="md:hidden p-2 -ml-1 rounded-lg text-muted hover:bg-soft hover:text-ink"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-semibold">
                    {(activeContact.name || '?')[0].toUpperCase()}
                  </div>
                  {activeContact.channel !== 'whatsapp' && (
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isOnline(activeContact._id) ? 'bg-success' : 'bg-slate-300'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">{activeContact.name}</h3>
                  <p className="text-xs text-muted truncate">
                    {activeContact.channel === 'whatsapp'
                      ? `WhatsApp · ${activeContact.phone || ''}`
                      : isOnline(activeContact._id)
                        ? 'Online'
                        : activeContact.role || 'Offline'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-lg border border-line bg-white text-muted hover:text-ink hover:bg-soft flex items-center justify-center"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
              {messages.length === 0 && (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-brand-xlight text-brand flex items-center justify-center mb-3">
                    <FiSmile className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-ink">No messages yet</p>
                  <p className="text-xs text-muted mt-1 max-w-xs">
                    Say hello to {activeContact.name}. Messages appear here in real time.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const mine = isMine(msg);
                return (
                  <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[75%] md:max-w-[65%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!mine && (
                        <div className="w-7 h-7 mt-auto shrink-0 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-semibold">
                          {(activeContact.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                            mine
                              ? 'bg-brand text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-ink border border-line rounded-2xl rounded-bl-md shadow-sm'
                          }`}
                        >
                          {msg.fileUrl && (
                            <div className="mb-2">
                              {msg.fileType === 'image' ? (
                                <img
                                  src={getFileUrl(msg.fileUrl)}
                                  alt="Attachment"
                                  className="max-w-[220px] rounded-lg border border-black/5"
                                />
                              ) : (
                                <a
                                  href={getFileUrl(msg.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    mine ? 'border-white/20 bg-white/10' : 'border-line bg-soft'
                                  }`}
                                >
                                  <FiFileText className="w-5 h-5 shrink-0" />
                                  <span className="text-xs font-medium truncate max-w-[140px]">
                                    {msg.text || 'Attachment'}
                                  </span>
                                  <FiDownload className="w-4 h-4 shrink-0 opacity-70" />
                                </a>
                              )}
                            </div>
                          )}
                          {(!msg.fileUrl || (msg.fileUrl && msg.fileType === 'image' && msg.text)) && (
                            <p>{msg.text}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-0.5 text-muted">
                          <span className="text-[10px]">
                            {msg.createdAt ? format(new Date(msg.createdAt), 'hh:mm a') : ''}
                          </span>
                          {mine && (
                            <span className="flex items-center">
                              {msg.status === 'failed' && (
                                <span className="text-[10px] text-danger font-medium">failed</span>
                              )}
                              {msg.status === 'sent' && <FiCheck className="w-3 h-3" />}
                              {msg.status === 'delivered' && (
                                <span className="flex">
                                  <FiCheck className="w-3 h-3 -mr-1" />
                                  <FiCheck className="w-3 h-3" />
                                </span>
                              )}
                              {msg.status === 'seen' && (
                                <span className="flex text-brand">
                                  <FiCheck className="w-3 h-3 -mr-1" />
                                  <FiCheck className="w-3 h-3" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <div
                className={`px-4 py-2 text-xs border-t ${
                  /saved locally|demo|configure WHATSAPP/i.test(sendError)
                    ? 'text-muted bg-soft border-line'
                    : /session expired|not authorized/i.test(sendError)
                      ? 'text-danger bg-danger/10 border-danger/20'
                      : 'text-warning bg-warning/10 border-warning/20'
                }`}
              >
                {sendError}
              </div>
            )}

            {selectedFile && (
              <div className="px-4 py-2.5 bg-white border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-brand-xlight text-brand shrink-0">
                    {selectedFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="preview"
                        className="w-5 h-5 object-cover rounded"
                      />
                    ) : (
                      <FiFileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted">Ready to send</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="shrink-0 p-3 md:p-4 bg-white border-t border-line">
              <div className="flex items-center gap-1.5 md:gap-2 rounded-xl border border-line bg-soft px-2 py-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20">
                <button type="button" className="p-2 text-muted hover:text-brand rounded-lg" tabIndex={-1}>
                  <FiSmile className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                {(activeContact.channel || 'internal') === 'internal' && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-muted hover:text-brand rounded-lg"
                    disabled={uploading}
                  >
                    <FiPaperclip className="w-5 h-5" />
                  </button>
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={uploading ? 'Sending…' : 'Type a message…'}
                  disabled={uploading}
                  className="flex-1 min-w-0 bg-transparent border-0 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0 py-2"
                />
                <button
                  type="submit"
                  disabled={uploading || (!newMessage.trim() && !selectedFile)}
                  className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                    (newMessage.trim() || selectedFile) && !uploading
                      ? 'bg-brand text-white hover:bg-brand-hover'
                      : 'bg-line text-muted cursor-not-allowed'
                  }`}
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="hidden md:flex flex-1 flex-col items-center justify-center bg-soft text-center px-6">
            <div className="w-14 h-14 rounded-full bg-brand-xlight text-brand flex items-center justify-center mb-3">
              <FiSmile className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-ink">Select a conversation</p>
            <p className="text-xs text-muted mt-1">Pick someone from the list to start chatting.</p>
          </section>
        )}
      </div>
    </div>
  );
};

function normalizeDigits(value = '') {
  return String(value).replace(/^wa:/, '').replace(/\D/g, '');
}

export default Messenger;

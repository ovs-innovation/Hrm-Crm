import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiHash, FiLock, FiPlus, FiSearch, FiSend, FiPaperclip, FiMic, FiMenu, FiX, FiVolume2, FiUser,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAppSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import MessageRow from './MessageRow';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import {
  CHANNEL_KEY, STATUS_DOT, channelLabel, debounce, sameId, statusOf,
} from './workspaceUtils';

const emptyForm = { name: '', description: '', type: 'public', peerId: '', memberIds: '', teamId: '' };

const ChannelIcon = ({ type }) => {
  if (type === 'private') return <FiLock className="h-3.5 w-3.5 shrink-0 opacity-70" />;
  if (type === 'announcement') return <FiVolume2 className="h-3.5 w-3.5 shrink-0 opacity-70" />;
  if (type === 'dm' || type === 'group') return <FiUser className="h-3.5 w-3.5 shrink-0 opacity-70" />;
  return <FiHash className="h-3.5 w-3.5 shrink-0 opacity-70" />;
};

const Workspace = () => {
  const me = useSelector((state) => state.auth.adminInfo || {});
  const { socket, connected, presence, onlineUsers } = useAppSocket();
  const [tree, setTree] = useState({ teams: [], directs: [] });
  const [contacts, setContacts] = useState([]);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [typing, setTyping] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [showCreate, setShowCreate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [recording, setRecording] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const endRef = useRef(null);
  const fileRef = useRef(null);
  const composerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const stickBottom = useRef(true);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimer = useRef(null);
  const channelRef = useRef(null);
  const threadRef = useRef(null);
  const meRef = useRef(me._id);

  channelRef.current = channel;
  threadRef.current = thread;
  meRef.current = me._id;

  const contactName = useCallback((userId) => {
    const c = contacts.find((x) => sameId(x._id, userId));
    return c?.name || 'Member';
  }, [contacts]);

  const selectChannel = useCallback((ch) => {
    setChannel(ch);
    setThread(null);
    setReplyTo(null);
    setEditing(null);
    setNavOpen(false);
    if (ch?._id) sessionStorage.setItem(CHANNEL_KEY, ch._id);
  }, []);

  const loadTree = useCallback(async () => {
    const { data } = await api.get('/workspace');
    setTree(data);
    setChannel((prev) => {
      const saved = sessionStorage.getItem(CHANNEL_KEY);
      const all = [...(data.teams || []).flatMap((t) => t.channels || []), ...(data.directs || [])];
      const fromSaved = saved && all.find((c) => sameId(c._id, saved));
      if (fromSaved) return fromSaved;
      if (prev && all.find((c) => sameId(c._id, prev._id))) {
        return all.find((c) => sameId(c._id, prev._id));
      }
      return all[0] || null;
    });
    return data;
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      setBootLoading(true);
      setBootError('');
      try {
        await loadTree();
        const res = await api.get('/messages/contacts');
        if (live) setContacts(res.data?.internal || []);
      } catch (err) {
        if (live) setBootError(err.response?.data?.message || 'Could not load workspace');
      } finally {
        if (live) setBootLoading(false);
      }
    })();
    return () => { live = false; };
  }, [loadTree]);

  const loadMessages = useCallback(async (ch) => {
    if (!ch?._id) return;
    setMsgLoading(true);
    setMsgError('');
    try {
      const { data } = await api.get(`/workspace/channels/${ch._id}/messages`);
      setMessages(data || []);
      stickBottom.current = true;
      await api.post(`/workspace/channels/${ch._id}/read`).catch(() => {});
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Could not load messages');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!channel?._id) return undefined;
    loadMessages(channel);
    socket?.emit('channel:join', channel._id);
    return () => socket?.emit('channel:leave', channel._id);
  }, [channel?._id, socket, loadMessages]);

  useEffect(() => {
    if (stickBottom.current) endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (msg) => {
      const ch = channelRef.current;
      const th = threadRef.current;
      if (sameId(msg.channelId, ch?._id) && !msg.threadId) {
        setMessages((prev) => (prev.some((m) => sameId(m._id, msg._id)) ? prev : [...prev, msg]));
      }
      if (th && sameId(msg.threadId, th._id)) {
        setThreadMsgs((prev) => [...prev, msg]);
      }
    };
    const onEdit = (msg) => setMessages((prev) => prev.map((m) => (sameId(m._id, msg._id) ? { ...m, ...msg } : m)));
    const onDel = ({ _id }) => setMessages((prev) => prev.filter((m) => !sameId(m._id, _id)));
    const onReact = ({ _id, reactions }) =>
      setMessages((prev) => prev.map((m) => (sameId(m._id, _id) ? { ...m, reactions } : m)));
    const onTyping = ({ channelId, userId }) => {
      if (sameId(channelId, channelRef.current?._id) && !sameId(userId, meRef.current)) {
        setTyping(`${contactName(userId)} is typing…`);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(''), 1800);
      }
    };
    socket.on('message:new', onNew);
    socket.on('message:edited', onEdit);
    socket.on('message:deleted', onDel);
    socket.on('message:reaction', onReact);
    socket.on('typing:start', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:edited', onEdit);
      socket.off('message:deleted', onDel);
      socket.off('message:reaction', onReact);
      socket.off('typing:start', onTyping);
    };
  }, [socket, contactName]);

  const runSearch = useMemo(
    () => debounce(async (q) => {
      if (!q.trim()) {
        setHits([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const { data } = await api.get('/workspace/search', { params: { q } });
        setHits(data || []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 280),
    []
  );

  const send = async (payload) => {
    if (!channel?._id) return;
    setSending(true);
    try {
      if (editing) {
        await api.patch(`/workspace/messages/${editing._id}`, { text: payload.text });
        setEditing(null);
        setText('');
        return;
      }
      await api.post(`/workspace/channels/${channel._id}/messages`, {
        ...payload,
        replyTo: replyTo?._id,
        threadId: thread?._id,
      });
      setText('');
      setReplyTo(null);
      stickBottom.current = true;
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    try {
      await send({ text: text.trim() });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Message not sent');
    }
  };

  const uploadAndSend = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/messages/upload', fd);
      await send({
        text: text.trim() || '',
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileName: data.fileName || file.name,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const startVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadAndSend(file);
        setRecording(false);
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error('Microphone permission is required');
    }
  };

  const createEntity = async () => {
    setSaving(true);
    try {
      if (showCreate === 'team') {
        await api.post('/workspace/teams', { name: form.name, description: form.description });
      } else if (showCreate === 'channel') {
        const teamId = form.teamId || tree.teams[0]?._id;
        if (!teamId) {
          toast.error('Create a team first');
          return;
        }
        const { data } = await api.post(`/workspace/teams/${teamId}/channels`, {
          name: form.name,
          description: form.description,
          type: form.type,
        });
        sessionStorage.setItem(CHANNEL_KEY, data._id);
      } else if (showCreate === 'dm') {
        const { data } = await api.post('/workspace/directs', { peerId: form.peerId });
        sessionStorage.setItem(CHANNEL_KEY, data._id);
      } else if (showCreate === 'group') {
        const ids = form.memberIds.split(',').map((s) => s.trim()).filter(Boolean);
        const { data } = await api.post('/workspace/groups', { name: form.name, memberIds: ids });
        sessionStorage.setItem(CHANNEL_KEY, data._id);
      }
      setShowCreate(null);
      setForm({ ...emptyForm, teamId: form.teamId });
      await loadTree();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create');
    } finally {
      setSaving(false);
    }
  };

  const openThread = useCallback(async (msg) => {
    setThread(msg);
    try {
      const { data } = await api.get(`/workspace/threads/${msg._id}`);
      setThreadMsgs(data || []);
    } catch {
      setThreadMsgs([]);
    }
  }, []);

  const onPin = useCallback(async (m) => {
    setMessages((prev) => prev.map((row) => (
      sameId(row._id, m._id) ? { ...row, pinnedAt: row.pinnedAt ? null : new Date().toISOString() } : row
    )));
    try {
      await api.post(`/workspace/messages/${m._id}/pin`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pin failed');
    }
  }, []);

  const onEdit = useCallback((m) => {
    setEditing(m);
    setText(m.text || '');
    composerRef.current?.focus();
  }, []);

  const onDelete = useCallback(async (m) => {
    try {
      await api.delete(`/workspace/messages/${m._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }, []);

  const onReact = useCallback(async (m, emoji) => {
    try {
      await api.post(`/workspace/messages/${m._id}/reactions`, { emoji });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reaction failed');
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showCreate) setShowCreate(null);
        else if (thread) setThread(null);
        else if (editing) { setEditing(null); setText(''); }
        else if (replyTo) setReplyTo(null);
        else if (search) { setSearch(''); setHits([]); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreate, thread, editing, replyTo, search]);

  const title = channelLabel(channel, contacts, me._id);
  const pinned = useMemo(() => messages.filter((m) => m.pinnedAt), [messages]);

  const openCreate = (kind) => {
    setForm((f) => ({
      ...emptyForm,
      teamId: f.teamId || tree.teams[0]?._id || '',
      type: 'public',
    }));
    setShowCreate(kind);
  };

  const sidebar = (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-line bg-soft">
      <div className="border-b border-line px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink">Workspace</p>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-success' : 'bg-line'}`} title={connected ? 'Live' : 'Connecting'} />
        </div>
        <label className="mt-2 flex items-center gap-1.5 rounded-md border border-line bg-white px-2">
          <FiSearch className="h-3.5 w-3.5 text-muted" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); runSearch(e.target.value); }}
            placeholder="Search"
            className="h-8 w-full bg-transparent text-[13px] outline-none"
            aria-label="Search messages"
          />
        </label>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Channels">
        <div className="mb-1 flex items-center justify-between px-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Teams</span>
          <button type="button" onClick={() => openCreate('team')} className="rounded p-0.5 text-muted hover:bg-white hover:text-brand" aria-label="New team">
            <FiPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        {bootLoading && <p className="px-2 py-3 text-[12px] text-muted">Loading…</p>}
        {!bootLoading && tree.teams.length === 0 && (
          <p className="px-2 py-3 text-[12px] text-muted">No teams yet.</p>
        )}
        {tree.teams.map((team) => (
          <div key={team._id} className="mb-2">
            <button
              type="button"
              className="w-full truncate px-1.5 py-1 text-left text-[12px] font-semibold text-ink hover:text-brand"
              onClick={() => setForm((f) => ({ ...f, teamId: team._id }))}
            >
              {team.name}
            </button>
            {(team.channels || []).map((ch) => (
              <button
                key={ch._id}
                type="button"
                onClick={() => { selectChannel(ch); setForm((f) => ({ ...f, teamId: team._id })); }}
                className={`mt-px flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] ${
                  sameId(channel?._id, ch._id) ? 'bg-white font-medium text-brand' : 'text-ink/80 hover:bg-white'
                }`}
              >
                <ChannelIcon type={ch.type} />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="mb-1 mt-3 flex items-center justify-between px-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Chat</span>
          <button type="button" onClick={() => openCreate('dm')} className="rounded p-0.5 text-muted hover:bg-white hover:text-brand" aria-label="New chat">
            <FiPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        {tree.directs.map((ch) => {
          const peer = (ch.members || []).find((m) => !sameId(m.userId, me._id));
          const st = statusOf(peer?.userId, presence, onlineUsers);
          return (
            <button
              key={ch._id}
              type="button"
              onClick={() => selectChannel(ch)}
              className={`mt-px flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] ${
                sameId(channel?._id, ch._id) ? 'bg-white font-medium text-brand' : 'text-ink/80 hover:bg-white'
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[st] || STATUS_DOT.offline}`} />
              <span className="truncate">{channelLabel(ch, contacts, me._id)}</span>
            </button>
          );
        })}
        <div className="mt-3 space-y-0.5 border-t border-line pt-2">
          <button type="button" onClick={() => openCreate('channel')} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-muted hover:bg-white hover:text-ink">
            <FiPlus className="h-3.5 w-3.5" /> New channel
          </button>
          <button type="button" onClick={() => openCreate('group')} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-muted hover:bg-white hover:text-ink">
            <FiPlus className="h-3.5 w-3.5" /> New group
          </button>
        </div>
      </nav>
    </aside>
  );

  if (bootError && !tree.teams.length) {
    return (
      <div className="flex h-[calc(100vh-44px)] items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center">
          <p className="text-[15px] font-semibold text-ink">Workspace unavailable</p>
          <p className="mt-1 text-[13px] text-muted">{bootError}</p>
          <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-44px)] min-h-0 bg-white">
      <div className="hidden md:flex">{sidebar}</div>
      {navOpen && (
        <div className="absolute inset-0 z-30 flex md:hidden">
          <div className="h-full bg-white shadow-sm">{sidebar}</div>
          <button type="button" className="flex-1 bg-ink/20" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
        </div>
      )}

      <section
        className={`flex min-w-0 flex-1 flex-col ${dragging ? 'bg-brand-xlight/40' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await uploadAndSend(file);
        }}
      >
        <header className="flex h-12 items-center gap-2 border-b border-line px-3 md:px-4">
          <button type="button" className="rounded p-1.5 text-muted hover:bg-soft md:hidden" onClick={() => setNavOpen(true)} aria-label="Open channels">
            <FiMenu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-ink">
              {channel && <ChannelIcon type={channel.type} />}
              {title}
            </h2>
            <p className="truncate text-[11px] text-muted">
              {typing || channel?.description || (channel?.members?.length ? `${channel.members.length} members` : 'Select a channel')}
            </p>
          </div>
        </header>

        {(searching || hits.length > 0 || search.trim()) && (
          <div className="max-h-36 overflow-y-auto border-b border-line bg-soft/50 px-4 py-2">
            {searching && <p className="text-[12px] text-muted">Searching…</p>}
            {!searching && search.trim() && hits.length === 0 && <p className="text-[12px] text-muted">No matches</p>}
            {hits.map((h) => (
              <p key={h._id} className="truncate py-1 text-[12px] text-ink">{h.text || h.fileName}</p>
            ))}
          </div>
        )}

        {pinned.length > 0 && (
          <div className="border-b border-line bg-brand-xlight/60 px-4 py-1.5 text-[12px] text-ink">
            Pinned · {pinned.map((p) => p.text || p.fileName).filter(Boolean).slice(0, 2).join(' · ')}
          </div>
        )}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-2 py-3 md:px-4"
          onScroll={(e) => {
            const el = e.currentTarget;
            stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
        >
          {msgLoading && <p className="px-2 py-8 text-center text-[13px] text-muted">Loading messages…</p>}
          {msgError && (
            <div className="px-2 py-8 text-center">
              <p className="text-[13px] text-danger">{msgError}</p>
              <button type="button" className="mt-2 text-[13px] text-brand hover:underline" onClick={() => loadMessages(channel)}>Retry</button>
            </div>
          )}
          {!msgLoading && !msgError && messages.length === 0 && (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <p className="text-[15px] font-semibold text-ink">No messages yet</p>
              <p className="mt-1 max-w-xs text-[13px] text-muted">Start the conversation in {title}. Files and voice notes are supported.</p>
            </div>
          )}
          {!msgLoading && messages.map((msg) => (
            <MessageRow
              key={msg._id}
              msg={msg}
              mine={sameId(msg.senderId, me._id)}
              senderName={contactName(msg.senderId)}
              onReply={setReplyTo}
              onThread={openThread}
              onPin={onPin}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
            />
          ))}
          <div ref={endRef} />
        </div>

        {replyTo && (
          <div className="flex items-center justify-between border-t border-line px-4 py-1.5 text-[12px] text-muted">
            <span>Replying to {contactName(replyTo.senderId)}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="hover:text-ink">Cancel</button>
          </div>
        )}
        {editing && (
          <div className="flex items-center justify-between border-t border-line px-4 py-1.5 text-[12px] text-muted">
            <span>Editing message</span>
            <button type="button" onClick={() => { setEditing(null); setText(''); }} className="hover:text-ink">Cancel</button>
          </div>
        )}

        <form onSubmit={onSubmit} className="border-t border-line px-3 py-2 md:px-4">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAndSend(e.target.files[0])}
          />
          <div className="flex items-end gap-1 rounded-lg border border-line bg-white px-1 py-1 focus-within:border-brand">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md p-2 text-muted hover:bg-soft hover:text-ink" aria-label="Attach file" disabled={!channel}>
              <FiPaperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={recording ? () => mediaRef.current?.stop() : startVoiceNote}
              className={`rounded-md p-2 ${recording ? 'bg-danger text-white' : 'text-muted hover:bg-soft hover:text-ink'}`}
              aria-label={recording ? 'Stop recording' : 'Voice note'}
              disabled={!channel}
            >
              <FiMic className="h-4 w-4" />
            </button>
            <textarea
              ref={composerRef}
              value={text}
              rows={1}
              disabled={!channel || sending}
              onChange={(e) => {
                setText(e.target.value);
                if (channel?._id) socket?.emit('typing:start', { channelId: channel._id });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={channel ? (editing ? 'Edit message' : `Message ${title}`) : 'Select a channel'}
              className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] outline-none"
            />
            <button
              type="submit"
              disabled={!channel || sending || !text.trim()}
              className="rounded-md bg-brand p-2 text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 hidden text-[11px] text-muted md:block">Enter to send · Shift+Enter for a new line · Esc to cancel · Ctrl+F to search</p>
        </form>
      </section>

      {thread && (
        <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[320px] flex-col border-l border-line bg-white md:static md:max-w-[280px]">
          <div className="flex h-12 items-center justify-between border-b border-line px-3">
            <p className="text-[13px] font-semibold text-ink">Thread</p>
            <button type="button" onClick={() => setThread(null)} className="rounded p-1 text-muted hover:bg-soft" aria-label="Close thread">
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-[13px] text-ink">{thread.text}</p>
            <div className="mt-3 space-y-2">
              {threadMsgs.length === 0 && <p className="text-[12px] text-muted">No replies yet</p>}
              {threadMsgs.map((m) => (
                <p key={m._id} className="rounded-md bg-soft p-2 text-[12px] text-ink">{m.text}</p>
              ))}
            </div>
          </div>
        </aside>
      )}

      {showCreate && (
        <CreateWorkspaceModal
          kind={showCreate}
          form={form}
          setForm={setForm}
          teams={tree.teams}
          contacts={contacts}
          meId={me._id}
          saving={saving}
          onClose={() => setShowCreate(null)}
          onSubmit={createEntity}
        />
      )}
    </div>
  );
};

export default Workspace;

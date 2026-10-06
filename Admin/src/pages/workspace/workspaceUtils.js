export const sameId = (a, b) => String(a || '') === String(b || '');

export const STATUS_DOT = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-danger',
  in_meeting: 'bg-brand',
  offline: 'bg-line',
};

export const CHANNEL_KEY = 'vastora.workspace.channel';

export function statusOf(userId, presence, onlineUsers) {
  const row = presence[String(userId)];
  if (row?.status) return row.status;
  return (onlineUsers || []).includes(String(userId)) ? 'online' : 'offline';
}

export function channelLabel(channel, contacts, meId) {
  if (!channel) return 'Workspace';
  if (channel.type === 'dm') {
    const peer = (channel.members || []).find((m) => !sameId(m.userId, meId));
    const contact = (contacts || []).find((c) => sameId(c._id, peer?.userId));
    return contact?.name || 'Direct message';
  }
  return channel.name;
}

export function formatMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

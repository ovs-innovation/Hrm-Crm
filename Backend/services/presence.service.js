import PresenceState from '../models/PresenceState.js';
import { SOCKET_EVENTS, tenantRoom } from '../socket/events.js';

const socketsByUser = new Map();
const liveStatus = new Map();

function addSocket(userId, socketId) {
  const key = String(userId);
  if (!socketsByUser.has(key)) socketsByUser.set(key, new Set());
  socketsByUser.get(key).add(socketId);
}

function removeSocket(userId, socketId) {
  const key = String(userId);
  const set = socketsByUser.get(key);
  if (!set) return 0;
  set.delete(socketId);
  if (set.size === 0) socketsByUser.delete(key);
  return set.size;
}

export function getSocketIds(userId) {
  return Array.from(socketsByUser.get(String(userId)) || []);
}

export function getOnlineUserIds() {
  return Array.from(socketsByUser.keys());
}

export async function setPresence({ userId, tenantId, status, device = '' }) {
  const key = String(userId);
  liveStatus.set(key, { status, lastSeen: new Date(), tenantId: tenantId ? String(tenantId) : null });
  if (!tenantId) return liveStatus.get(key);
  await PresenceState.findOneAndUpdate(
    { userId: key, tenantId },
    { userId: key, tenantId, status, lastSeen: new Date(), device },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  return liveStatus.get(key);
}

export function getLivePresence(userId) {
  return liveStatus.get(String(userId)) || { status: 'offline', lastSeen: null };
}

export async function listTenantPresence(tenantId) {
  const rows = await PresenceState.find({ tenantId }).lean();
  const online = new Set(getOnlineUserIds());
  return rows.map((row) => {
    const live = liveStatus.get(String(row.userId));
    const connected = online.has(String(row.userId));
    return {
      userId: row.userId,
      status: connected ? (live?.status || row.status || 'online') : 'offline',
      lastSeen: connected ? (live?.lastSeen || row.lastSeen) : row.lastSeen,
    };
  });
}

export async function handleConnect({ io, socket, userId, tenantId }) {
  addSocket(userId, socket.id);
  await setPresence({ userId, tenantId, status: 'online' });
  if (tenantId) {
    const list = await listTenantPresence(tenantId);
    io.to(tenantRoom(tenantId)).emit(SOCKET_EVENTS.PRESENCE_LIST, list);
  }
  io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUserIds());
}

export async function handleDisconnect({ io, socket, userId, tenantId }) {
  const remaining = removeSocket(userId, socket.id);
  if (remaining > 0) return;
  await setPresence({ userId, tenantId, status: 'offline' });
  if (tenantId) {
    const list = await listTenantPresence(tenantId);
    io.to(tenantRoom(tenantId)).emit(SOCKET_EVENTS.PRESENCE_LIST, list);
    io.to(tenantRoom(tenantId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
      userId: String(userId),
      status: 'offline',
      lastSeen: new Date(),
    });
  }
  io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUserIds());
}

export async function emitPresenceChange(io, { userId, tenantId, status }) {
  if (!tenantId) return;
  io.to(tenantRoom(tenantId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    userId: String(userId),
    status,
    lastSeen: new Date(),
  });
}

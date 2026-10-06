import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import {
  handleConnect,
  handleDisconnect,
  setPresence,
  emitPresenceChange,
  getOnlineUserIds,
} from '../services/presence.service.js';
import { SOCKET_EVENTS, userRoom, tenantRoom, channelRoom } from './events.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://hrm.vastoratech.com',
  'https://hrmadmin.vastoratech.com',
  ...(process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(','),
].map((o) => o.trim()).filter(Boolean);

const parseCookie = (header = '') => {
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) out[key] = val;
  });
  return out;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isProd = process.env.NODE_ENV === 'production';
      let host = '';
      try { host = new URL(origin).hostname; } catch { host = origin; }
      const ok = allowedOrigins.includes(origin) ||
        (!isProd && (host === 'localhost' || host === '127.0.0.1'));
      callback(ok ? null : new Error('CORS blocked'), ok);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return undefined;
  const ids = [...io.sockets.adapter.rooms.get(userRoom(receiverId)) || []];
  return ids[0];
};

io.use((socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    let token = null;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (typeof authHeader === 'string' && authHeader.length > 0) {
      token = authHeader;
    }
    if (!token && socket.handshake.headers?.cookie) {
      const parsed = parseCookie(socket.handshake.headers.cookie);
      token = parsed.admin_jwt || parsed.jwt;
    }
    if (!token || !process.env.JWT_SECRET) {
      return next(new Error('Unauthorized'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = (decoded.userId || decoded.id || decoded._id)?.toString();
    socket.tenantId = decoded.tenantId?.toString() || null;
    socket.userType = decoded.userType || 'Admin';
    if (!socket.userId) return next(new Error('Unauthorized'));
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  const tenantId = socket.tenantId;

  socket.join(userRoom(userId));
  if (tenantId) socket.join(tenantRoom(tenantId));

  handleConnect({ io, socket, userId, tenantId }).catch((err) => console.error(err));

  socket.on(SOCKET_EVENTS.CHANNEL_JOIN, (channelId) => {
    if (!channelId) return;
    socket.join(channelRoom(channelId));
  });

  socket.on(SOCKET_EVENTS.CHANNEL_LEAVE, (channelId) => {
    if (!channelId) return;
    socket.leave(channelRoom(channelId));
  });

  socket.on(SOCKET_EVENTS.TYPING_START, ({ channelId }) => {
    if (!channelId) return;
    socket.to(channelRoom(channelId)).emit(SOCKET_EVENTS.TYPING_START, { channelId, userId });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ channelId }) => {
    if (!channelId) return;
    socket.to(channelRoom(channelId)).emit(SOCKET_EVENTS.TYPING_STOP, { channelId, userId });
  });

  socket.on(SOCKET_EVENTS.PRESENCE_SET, async ({ status }) => {
    const allowed = ['online', 'away', 'busy', 'in_meeting'];
    const next = allowed.includes(status) ? status : 'online';
    await setPresence({ userId, tenantId, status: next });
    await emitPresenceChange(io, { userId, tenantId, status: next });
  });

  socket.on('markSeen', async ({ senderId, receiverId }) => {
    try {
      if (receiverId?.toString() !== userId) return;
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: 'seen' } },
        { $set: { status: 'seen' } }
      );
      const senderSocket = getReceiverSocketId(senderId);
      if (senderSocket) {
        io.to(senderSocket).emit(SOCKET_EVENTS.MESSAGES_SEEN, receiverId);
      }
    } catch (err) {
      console.error(err);
    }
  });

  io.emit(SOCKET_EVENTS.ONLINE_USERS, getOnlineUserIds());

  socket.on('disconnect', () => {
    handleDisconnect({ io, socket, userId, tenantId }).catch((err) => console.error(err));
  });
});

export { app, io, server };

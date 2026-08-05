import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

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
        (!isProd && (host === 'localhost' || host.endsWith('127.0.0.1'))) ||
        host.endsWith('vastoratech.com');
      callback(ok ? null : new Error('CORS blocked'), ok);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const userSocketMap = {}; // {userId: socketId}

import Message from '../models/Message.js';

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return undefined;
  return userSocketMap[String(receiverId)];
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
      token = parsed.jwt;
    }
    if (!token || !process.env.JWT_SECRET) {
      return next(new Error('Unauthorized'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId?.toString();
    if (!socket.userId) return next(new Error('Unauthorized'));
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  const userId = socket.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;

    Message.updateMany(
      { receiverId: userId, status: 'sent' },
      { $set: { status: 'delivered' } }
    ).then(async () => {
      const pendingMessages = await Message.find({ receiverId: userId, status: 'delivered' }).distinct('senderId');
      pendingMessages.forEach(senderId => {
        const senderSocket = getReceiverSocketId(senderId.toString());
        if (senderSocket) {
          io.to(senderSocket).emit('messagesDelivered', userId);
        }
      });
    }).catch(err => console.error(err));
  }

  socket.on('markSeen', async ({ senderId, receiverId }) => {
    try {
      if (receiverId?.toString() !== userId) return;
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: 'seen' } },
        { $set: { status: 'seen' } }
      );
      const senderSocket = getReceiverSocketId(senderId);
      if (senderSocket) {
        io.to(senderSocket).emit('messagesSeen', receiverId);
      }
    } catch (err) {
      console.error(err);
    }
  });

  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server };

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

const userSocketMap = {}; // {userId: socketId}

import Message from '../models/Message.js';

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;

    // Mark undelivered messages as delivered when user comes online
    Message.updateMany(
      { receiverId: userId, status: 'sent' },
      { $set: { status: 'delivered' } }
    ).then(async () => {
      // Find senders who had pending messages
      const pendingMessages = await Message.find({ receiverId: userId, status: 'delivered' }).distinct('senderId');
      pendingMessages.forEach(senderId => {
        const senderSocket = getReceiverSocketId(senderId.toString());
        if (senderSocket) {
          io.to(senderSocket).emit('messagesDelivered', userId);
        }
      });
    }).catch(err => console.error(err));
  }

  // Handle explicit markAsSeen from frontend
  socket.on('markSeen', async ({ senderId, receiverId }) => {
    try {
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

  // io.emit is used to send events to all the connected clients
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

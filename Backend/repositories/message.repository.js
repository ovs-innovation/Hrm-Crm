import Message from '../models/Message.js';

export async function insertMessage(doc) {
  const row = await Message.create(doc);
  return row;
}

export async function findChannelMessages(channelId, { before, limit = 80 } = {}) {
  const query = { channelId, deletedAt: null, threadId: null };
  if (before) query.createdAt = { $lt: new Date(before) };
  const rows = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 80, 200))
    .lean();
  return rows.reverse();
}

export async function findThreadMessages(threadId, limit = 200) {
  return Message.find({ threadId, deletedAt: null })
    .sort({ createdAt: 1 })
    .limit(Math.min(Number(limit) || 200, 400))
    .lean();
}

export async function findMessageById(id) {
  return Message.findOne({ _id: id, deletedAt: null });
}

export async function searchMessages({ userId, channelIds, q, limit = 40 }) {
  const safe = String(q || '').trim().slice(0, 80);
  if (!safe) return [];
  const query = {
    deletedAt: null,
    text: { $regex: safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    $or: [
      { channelId: { $in: channelIds } },
      { senderId: userId },
      { receiverId: userId },
    ],
  };
  return Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 40, 80))
    .lean();
}

import mongoose from 'mongoose';
import Message from '../models/Message.js';
import WorkspaceChannel from '../models/WorkspaceChannel.js';
import * as messageRepo from '../repositories/message.repository.js';
import * as workspaceRepo from '../repositories/workspace.repository.js';
import { canPostToChannel, isChannelMember, listWorkspace } from './workspace.service.js';
import { io } from '../socket/socket.js';
import { SOCKET_EVENTS, channelRoom, userRoom } from '../socket/events.js';
import { getSocketIds } from './presence.service.js';
import { createNotification } from '../utils/notify.js';

function extractMentions(text = '') {
  const ids = [];
  const re = /@id:([a-f0-9]{24})/gi;
  let m;
  while ((m = re.exec(text))) ids.push(m[1]);
  return ids;
}

async function emitToChannel(channel, payload, event = SOCKET_EVENTS.MESSAGE_NEW) {
  io.to(channelRoom(channel._id)).emit(event, payload);
  for (const member of channel.members || []) {
    io.to(userRoom(member.userId)).emit(event, payload);
  }
}

export async function listMessages(req, channelId, query) {
  const channel = await workspaceRepo.findChannelById(channelId);
  if (!channel) {
    const err = new Error('Channel not found');
    err.status = 404;
    throw err;
  }
  if (!isChannelMember(channel, req.user._id) && channel.type !== 'public' && channel.type !== 'announcement') {
    const err = new Error('Not a member of this channel');
    err.status = 403;
    throw err;
  }
  return messageRepo.findChannelMessages(channelId, query);
}

export async function sendChannelMessage(req, channelId, body) {
  const channel = await workspaceRepo.findChannelById(channelId);
  if (!channel) {
    const err = new Error('Channel not found');
    err.status = 404;
    throw err;
  }
  if (!canPostToChannel(channel, req.user._id)) {
    const err = new Error('You cannot post in this channel');
    err.status = 403;
    throw err;
  }
  const text = String(body.text || '').slice(0, 8000);
  if (!text && !body.fileUrl) {
    const err = new Error('Message text or file is required');
    err.status = 400;
    throw err;
  }

  const mentions = extractMentions(text);
  const kind = channel.type === 'group' ? 'group' : channel.type === 'dm' ? 'dm' : 'channel';
  const message = await messageRepo.insertMessage({
    senderId: req.user._id,
    receiverId: channel.type === 'dm'
      ? channel.members.find((m) => String(m.userId) !== String(req.user._id))?.userId
      : undefined,
    text,
    fileUrl: body.fileUrl || '',
    fileType: body.fileType || '',
    fileName: body.fileName || '',
    durationMs: Number(body.durationMs) || 0,
    conversationKind: kind,
    channelId: channel._id,
    threadId: mongoose.isValidObjectId(body.threadId) ? body.threadId : null,
    replyTo: mongoose.isValidObjectId(body.replyTo) ? body.replyTo : null,
    forwardedFrom: mongoose.isValidObjectId(body.forwardedFrom) ? body.forwardedFrom : null,
    mentions,
    status: 'sent',
    channel: 'internal',
  });

  channel.lastMessageAt = new Date();
  await channel.save();

  const payload = message.toObject ? message.toObject() : message;
  await emitToChannel(channel, payload);

  for (const mentioned of mentions) {
    if (String(mentioned) === String(req.user._id)) continue;
    await createNotification({
      userId: mentioned,
      userType: 'Admin',
      title: `${req.user.name || 'Someone'} mentioned you`,
      message: text.slice(0, 140),
      link: `/workspace?channel=${channel._id}`,
      module: 'chat',
      category: 'mention',
    });
  }

  return payload;
}

export async function editMessage(req, messageId, text) {
  const message = await messageRepo.findMessageById(messageId);
  if (!message) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  if (String(message.senderId) !== String(req.user._id)) {
    const err = new Error('Only the author can edit this message');
    err.status = 403;
    throw err;
  }
  message.text = String(text || '').slice(0, 8000);
  message.editedAt = new Date();
  await message.save();
  if (message.channelId) {
    io.to(channelRoom(message.channelId)).emit(SOCKET_EVENTS.MESSAGE_EDITED, message);
  }
  return message;
}

export async function deleteMessage(req, messageId) {
  const message = await messageRepo.findMessageById(messageId);
  if (!message) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  if (String(message.senderId) !== String(req.user._id)) {
    const err = new Error('Only the author can delete this message');
    err.status = 403;
    throw err;
  }
  message.deletedAt = new Date();
  message.text = '';
  message.fileUrl = '';
  await message.save();
  if (message.channelId) {
    io.to(channelRoom(message.channelId)).emit(SOCKET_EVENTS.MESSAGE_DELETED, { _id: message._id, channelId: message.channelId });
  }
  return { ok: true };
}

export async function reactToMessage(req, messageId, emoji) {
  const message = await messageRepo.findMessageById(messageId);
  if (!message) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  const mark = String(emoji || '').slice(0, 16);
  if (!mark) {
    const err = new Error('Emoji is required');
    err.status = 400;
    throw err;
  }
  const uid = req.user._id;
  let bucket = message.reactions.find((r) => r.emoji === mark);
  if (!bucket) {
    message.reactions.push({ emoji: mark, userIds: [uid] });
  } else {
    const has = bucket.userIds.some((id) => String(id) === String(uid));
    bucket.userIds = has
      ? bucket.userIds.filter((id) => String(id) !== String(uid))
      : [...bucket.userIds, uid];
    if (!bucket.userIds.length) {
      message.reactions = message.reactions.filter((r) => r.emoji !== mark);
    }
  }
  await message.save();
  if (message.channelId) {
    io.to(channelRoom(message.channelId)).emit(SOCKET_EVENTS.MESSAGE_REACTION, {
      _id: message._id,
      reactions: message.reactions,
    });
  }
  return message;
}

export async function pinMessage(req, messageId) {
  const message = await messageRepo.findMessageById(messageId);
  if (!message || !message.channelId) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  const channel = await workspaceRepo.findChannelById(message.channelId);
  if (!channel) {
    const err = new Error('Channel not found');
    err.status = 404;
    throw err;
  }
  const already = channel.pinnedMessageIds.some((id) => String(id) === String(message._id));
  if (already) {
    channel.pinnedMessageIds = channel.pinnedMessageIds.filter((id) => String(id) !== String(message._id));
    message.pinnedAt = null;
    message.pinnedBy = null;
  } else {
    channel.pinnedMessageIds = [...channel.pinnedMessageIds.slice(-19), message._id];
    message.pinnedAt = new Date();
    message.pinnedBy = req.user._id;
  }
  await channel.save();
  await message.save();
  io.to(channelRoom(channel._id)).emit(SOCKET_EVENTS.MESSAGE_PINNED, {
    channelId: channel._id,
    pinnedMessageIds: channel.pinnedMessageIds,
  });
  return { pinnedMessageIds: channel.pinnedMessageIds, message };
}

export async function markChannelRead(req, channelId) {
  await Message.updateMany(
    { channelId, senderId: { $ne: req.user._id }, 'readBy.userId': { $ne: req.user._id }, deletedAt: null },
    { $push: { readBy: { userId: req.user._id, at: new Date() } }, $set: { status: 'seen' } }
  );
  return { ok: true };
}

export async function listThread(req, threadId) {
  return messageRepo.findThreadMessages(threadId);
}

export async function search(req, q) {
  const { directs, teams } = await listWorkspace(req);
  const channelIds = [
    ...directs.map((d) => d._id),
    ...teams.flatMap((t) => (t.channels || []).map((c) => c._id)),
  ];
  return messageRepo.searchMessages({ userId: req.user._id, channelIds, q });
}

export async function forwardMessage(req, messageId, targetChannelId) {
  const source = await messageRepo.findMessageById(messageId);
  if (!source) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  return sendChannelMessage(req, targetChannelId, {
    text: source.text || '',
    fileUrl: source.fileUrl,
    fileType: source.fileType,
    fileName: source.fileName,
    forwardedFrom: source._id,
  });
}

export function emitDmLegacy(receiverId, message) {
  const ids = getSocketIds(receiverId);
  ids.forEach((sid) => io.to(sid).emit(SOCKET_EVENTS.NEW_MESSAGE, message));
}

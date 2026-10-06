import Notification from '../models/Notification.js';
import { io } from '../socket/socket.js';
import { SOCKET_EVENTS, userRoom } from '../socket/events.js';

const CATEGORY_BY_MODULE = {
  hrm: 'leave',
  leave: 'leave',
  payroll: 'payroll',
  crm: 'crm',
  invoice: 'invoice',
  meeting: 'meeting',
  task: 'task',
  email: 'email',
  ai: 'ai',
  chat: 'chat',
  mention: 'mention',
};

export const createNotification = async ({
  userId,
  userType = 'Employee',
  title,
  message,
  link,
  module,
  category,
}) => {
  if (!userId) return null;
  const resolvedCategory = category || CATEGORY_BY_MODULE[module] || 'system';
  const doc = await Notification.create({
    userId: userId.toString(),
    userType,
    title,
    message,
    link,
    module: module || resolvedCategory,
    category: resolvedCategory,
  });
  try {
    io.to(userRoom(userId)).emit(SOCKET_EVENTS.NOTIFICATION_NEW, doc);
  } catch {
    /* socket not ready during startup */
  }
  return doc;
};

export const notifyMany = async (recipients, payload) => {
  const results = [];
  for (const userId of recipients.filter(Boolean)) {
    results.push(await createNotification({ userId, ...payload }));
  }
  return results;
};

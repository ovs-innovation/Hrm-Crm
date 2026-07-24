import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  userType = 'Employee',
  title,
  message,
  link,
  module,
}) => {
  if (!userId) return null;
  return Notification.create({
    userId: userId.toString(),
    userType,
    title,
    message,
    link,
    module,
  });
};

export const notifyMany = async (recipients, payload) => {
  const docs = recipients.filter(Boolean).map((userId) => ({
    userId: userId.toString(),
    ...payload,
  }));
  if (!docs.length) return [];
  return Notification.insertMany(docs);
};

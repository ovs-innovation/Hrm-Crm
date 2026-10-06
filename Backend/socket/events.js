export const SOCKET_EVENTS = {
  PRESENCE_LIST: 'presence:list',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SET: 'presence:set',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACTION: 'message:reaction',
  MESSAGE_PINNED: 'message:pinned',
  NOTIFICATION_NEW: 'notification:new',
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  MESSAGES_DELIVERED: 'messagesDelivered',
  MESSAGES_SEEN: 'messagesSeen',
  NEW_MESSAGE: 'newMessage',
  NEW_WHATSAPP: 'newWhatsAppMessage',
  ONLINE_USERS: 'getOnlineUsers',
};

export function userRoom(userId) {
  return `user:${String(userId)}`;
}

export function tenantRoom(tenantId) {
  return `tenant:${String(tenantId)}`;
}

export function channelRoom(channelId) {
  return `channel:${String(channelId)}`;
}

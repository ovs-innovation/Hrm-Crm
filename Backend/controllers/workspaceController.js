import * as workspaceService from '../services/workspace.service.js';
import * as chatService from '../services/chat.service.js';
import * as presenceService from '../services/presence.service.js';

function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req, res);
      if (res.headersSent) return;
      res.json(data);
    } catch (error) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Internal server error' });
    }
  };
}

export const getWorkspace = handle(async (req) => workspaceService.listWorkspace(req));

export const postTeam = handle(async (req) => workspaceService.createTeam(req, req.body || {}));

export const postTeamMember = handle(async (req) =>
  workspaceService.addTeamMember(req, req.params.teamId, req.body || {})
);

export const postChannel = handle(async (req) =>
  workspaceService.createChannel(req, req.params.teamId, req.body || {})
);

export const postChannelMember = handle(async (req) =>
  workspaceService.addChannelMember(req, req.params.channelId, req.body || {})
);

export const postDirect = handle(async (req) => workspaceService.openDirect(req, req.body?.peerId));

export const postGroup = handle(async (req) => workspaceService.createGroup(req, req.body || {}));

export const getMessages = handle(async (req) =>
  chatService.listMessages(req, req.params.channelId, req.query)
);

export const postMessage = handle(async (req) =>
  chatService.sendChannelMessage(req, req.params.channelId, req.body || {})
);

export const patchMessage = handle(async (req) =>
  chatService.editMessage(req, req.params.messageId, req.body?.text)
);

export const removeMessage = handle(async (req) =>
  chatService.deleteMessage(req, req.params.messageId)
);

export const postReaction = handle(async (req) =>
  chatService.reactToMessage(req, req.params.messageId, req.body?.emoji)
);

export const postPin = handle(async (req) => chatService.pinMessage(req, req.params.messageId));

export const postRead = handle(async (req) => chatService.markChannelRead(req, req.params.channelId));

export const getThread = handle(async (req) => chatService.listThread(req, req.params.threadId));

export const getSearch = handle(async (req) => chatService.search(req, req.query.q));

export const postForward = handle(async (req) =>
  chatService.forwardMessage(req, req.params.messageId, req.body?.channelId)
);

export const getPresence = handle(async (req) =>
  presenceService.listTenantPresence(req.tenantId)
);

export const putPresence = handle(async (req) => {
  const allowed = ['online', 'away', 'busy', 'in_meeting'];
  const status = allowed.includes(req.body?.status) ? req.body.status : 'online';
  const row = await presenceService.setPresence({
    userId: req.user._id,
    tenantId: req.tenantId,
    status,
    device: req.headers['user-agent'] || '',
  });
  const { io } = await import('../socket/socket.js');
  await presenceService.emitPresenceChange(io, {
    userId: req.user._id,
    tenantId: req.tenantId,
    status,
  });
  return row;
});

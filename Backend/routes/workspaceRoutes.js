import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { auditMiddleware } from '../utils/auditLogger.js';
import {
  getWorkspace,
  postTeam,
  postTeamMember,
  postChannel,
  postChannelMember,
  postDirect,
  postGroup,
  getMessages,
  postMessage,
  patchMessage,
  removeMessage,
  postReaction,
  postPin,
  postRead,
  getThread,
  getSearch,
  postForward,
  getPresence,
  putPresence,
} from '../controllers/workspaceController.js';

const router = express.Router();

router.use(protect);
router.use(auditMiddleware('workspace'));

router.get('/', getWorkspace);
router.post('/teams', postTeam);
router.post('/teams/:teamId/members', postTeamMember);
router.post('/teams/:teamId/channels', postChannel);
router.post('/channels/:channelId/members', postChannelMember);
router.post('/directs', postDirect);
router.post('/groups', postGroup);

router.get('/search', getSearch);
router.get('/presence', getPresence);
router.put('/presence', putPresence);

router.get('/channels/:channelId/messages', getMessages);
router.post('/channels/:channelId/messages', postMessage);
router.post('/channels/:channelId/read', postRead);

router.get('/threads/:threadId', getThread);
router.patch('/messages/:messageId', patchMessage);
router.delete('/messages/:messageId', removeMessage);
router.post('/messages/:messageId/reactions', postReaction);
router.post('/messages/:messageId/pin', postPin);
router.post('/messages/:messageId/forward', postForward);

export default router;

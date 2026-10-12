import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { pulse, agentPulse, mySession, saveLog, board, report, downloadAgent, downloadAgentLauncher, downloadMacAgent, downloadLinuxAgent } from '../controllers/wfhController.js';

const router = express.Router();
router.use(protect);
router.post('/pulse', pulse);
router.post('/agent', agentPulse);
router.get('/me', mySession);
router.get('/agent.ps1', downloadAgent);
router.get('/agent.cmd', downloadAgentLauncher);
router.get('/agent-mac.sh', downloadMacAgent);
router.get('/agent-linux.sh', downloadLinuxAgent);
router.put('/log', saveLog);
router.get('/board', board);
router.get('/report', report);
export default router;

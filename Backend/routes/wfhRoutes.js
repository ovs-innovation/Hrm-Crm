import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { pulse, agentPulse, mySession, saveLog, board, report } from '../controllers/wfhController.js';

const router = express.Router();
router.use(protect);
router.post('/pulse', pulse);
router.post('/agent', agentPulse);
router.get('/me', mySession);
router.put('/log', saveLog);
router.get('/board', board);
router.get('/report', report);
export default router;

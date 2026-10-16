import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';
import {
  getBusinessHealthScore,
  getExecutiveBrief,
  simulateWorkforceCost,
  saveWorkflow,
  getWorkflows,
  executeWorkflowTest,
  executeExecutiveCommand,
  runMcpToolDirectly,
  getExecutiveDashboardMetrics,
  getExecutiveDashboardAiSummary,
  getWorkflowHistory,
  retryWorkflowExecution,
  aiGenerateWorkflow
} from '../controllers/executiveController.js';

const router = express.Router();

// Executive / MCP surfaces are Admin-portal only (never trust employee sessions).
router.use(protect, requireAdmin);

router.get('/health-score', getBusinessHealthScore);
router.get('/daily-brief', getExecutiveBrief);
router.post('/simulate-cost', simulateWorkforceCost);
router.post('/command', executeExecutiveCommand);
router.post('/run-tool', runMcpToolDirectly);
router.get('/dashboard/metrics', getExecutiveDashboardMetrics);
router.get('/dashboard/ai-summary', getExecutiveDashboardAiSummary);

router.get('/workflows', getWorkflows);
router.post('/workflows/save', saveWorkflow);
router.post('/workflows/test', executeWorkflowTest);
router.get('/workflows/:id/history', getWorkflowHistory);
router.post('/workflows/history/:logId/retry', retryWorkflowExecution);
router.post('/workflows/ai-generate', aiGenerateWorkflow);

export default router;


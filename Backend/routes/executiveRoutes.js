import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
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

router.get('/health-score', protect, getBusinessHealthScore);
router.get('/daily-brief', protect, getExecutiveBrief);
router.post('/simulate-cost', protect, simulateWorkforceCost);
router.post('/command', protect, executeExecutiveCommand);
router.post('/run-tool', protect, runMcpToolDirectly);
router.get('/dashboard/metrics', protect, getExecutiveDashboardMetrics);
router.get('/dashboard/ai-summary', protect, getExecutiveDashboardAiSummary);

// Workflow Builder APIs
router.get('/workflows', protect, getWorkflows);
router.post('/workflows/save', protect, saveWorkflow);
router.post('/workflows/test', protect, executeWorkflowTest);
router.get('/workflows/:id/history', protect, getWorkflowHistory);
router.post('/workflows/history/:logId/retry', protect, retryWorkflowExecution);
router.post('/workflows/ai-generate', protect, aiGenerateWorkflow);

export default router;


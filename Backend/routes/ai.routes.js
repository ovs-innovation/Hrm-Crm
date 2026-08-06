import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getDashboardInsights,
  naturalLanguageSearch,
  getEmployeeInsights,
  parseResumePdf,
  getLeadScore,
  writeLeadEmail,
  writeWhatsAppReply,
  generateDocumentPdf,
  generateMeetingSummary,
  getReportSummary,
  uploadKnowledgeDoc,
  queryKnowledgeBase,
  saveWorkflow,
  getForecasts,
  processVoiceCommand,
  ocrFormExtract,
  rankJobApplicants,
  getSalesCoach,
  executeAgentCommand,
  detectDuplicateLeads,
  mergeDuplicateLeads,
  detectAttendanceFraud,
  getEmployeeTimeline,
  getAiStats,
  getAiLogs,
  getAiHealth,
  generateHrLetterHandler,
  generatePerformanceSummaryHandler,
  analyzeAttendanceLeaveHandler,
  summarizeNotesHandler,
  suggestFollowUpsHandler,
  generateProposalHandler,
  suggestWorkflowsHandler,
  createMemory,
  getMemories,
  deleteMemory,
  getAutomationSuggestions,
  getPredictiveInsights,
  submitLearningFeedback,
  getCopilotBriefing,
  getClientTimeline,
  explainRecommendation,
  analyzeDocumentIntel
} from '../controllers/aiController.js';

const router = express.Router();

// Config multer in-memory for PDF processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']);
    if (!allowed.has(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  },
});

// Routes mapped to controllers
router.get('/health', protect, getAiHealth);
router.get('/dashboard', protect, getDashboardInsights);
router.get('/search', protect, naturalLanguageSearch);
router.get('/employee-card/:id', protect, getEmployeeInsights);
router.get('/explain/:id', protect, explainRecommendation);
router.get('/lead-score/:id', protect, getLeadScore);
router.get('/client-timeline/:id', protect, getClientTimeline);
router.get('/reports/:reportType', protect, getReportSummary);
router.get('/forecasts/:type', protect, getForecasts);
router.get('/sales-coach', protect, getSalesCoach);
router.get('/leads/duplicates', protect, detectDuplicateLeads);
router.get('/attendance/fraud', protect, detectAttendanceFraud);
router.get('/employee-timeline/:id', protect, getEmployeeTimeline);
router.get('/logs/stats', protect, getAiStats);
router.get('/logs', protect, getAiLogs);

// Custom long term memories
router.post('/memory', protect, createMemory);
router.get('/memory', protect, getMemories);
router.delete('/memory/:id', protect, deleteMemory);

// Proactive insights
router.get('/automation/suggest', protect, getAutomationSuggestions);
router.get('/predict', protect, getPredictiveInsights);
router.post('/learning/feedback', protect, submitLearningFeedback);

router.get('/copilot/briefing', protect, getCopilotBriefing);
router.post('/agent/command', protect, executeAgentCommand);
router.post('/leads/merge', protect, mergeDuplicateLeads);
router.post('/resume-parser', protect, upload.single('resume'), parseResumePdf);
router.post('/email-writer', protect, writeLeadEmail);
router.post('/whatsapp-reply', protect, writeWhatsAppReply);
router.post('/doc-generator', protect, upload.single('document'), generateDocumentPdf); // handles template uploads if any
router.post('/meeting-summary', protect, generateMeetingSummary);
router.post('/kb/upload', protect, upload.single('document'), uploadKnowledgeDoc);
router.post('/kb/query', protect, queryKnowledgeBase);
router.post('/workflow', protect, saveWorkflow);
router.post('/voice-command', protect, processVoiceCommand);
router.post('/ocr', protect, upload.single('document'), ocrFormExtract);
router.post('/doc-intel/analyze', protect, upload.single('document'), analyzeDocumentIntel);
router.post('/recruitment/rank', protect, rankJobApplicants);
router.post('/hr-letter', protect, generateHrLetterHandler);
router.post('/performance-summary', protect, generatePerformanceSummaryHandler);
router.post('/attendance-analysis', protect, analyzeAttendanceLeaveHandler);
router.post('/notes-summary', protect, summarizeNotesHandler);
router.post('/follow-up-suggestions', protect, suggestFollowUpsHandler);
router.post('/proposal-generator', protect, generateProposalHandler);
router.post('/workflow-suggestions', protect, suggestWorkflowsHandler);

export default router;

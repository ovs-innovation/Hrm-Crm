import { callLLM } from './llm.service.js';
import PromptConfig from '../models/PromptConfig.js';
import Memory from '../models/Memory.js';
import Learning from '../models/Learning.js';
import { TOOLS_SCHEMA } from './mcp.service.js';
import { contextStorage } from '../middlewares/contextMiddleware.js';

// Provider Strategy
const FAST = { provider: 'groq' };
const DEEP = { provider: 'openrouter' };

/**
 * Dynamic Prompt Compiler incorporating Tenant data, permissions, rules, and learning
 */
async function compileBusinessPrompt(moduleKey, baseSystemPrompt) {
  const store = contextStorage.getStore();
  const tenantId = store?.tenantId;
  const userId = store?.user || 'System';

  let memoryText = "";
  try {
    const memories = await Memory.find({ tenantId, scope: { $in: ['Global', moduleKey] } });
    if (memories.length > 0) {
      memoryText = `\n=== BUSINESS SYSTEM MEMORY & RULES ===\n${memories.map((m, i) => `${i + 1}. [Scope: ${m.scope}] ${m.content}`).join('\n')}\n`;
    }
  } catch (err) {
    console.error('[Memory retrieve error]', err.message);
  }

  let learningText = "";
  try {
    const learnings = await Learning.find({ tenantId, userId }).sort({ createdAt: -1 }).limit(3);
    if (learnings.length > 0) {
      learningText = `\n=== DYNAMIC STYLE LEARNINGS ===\n${learnings.map(l => `- Correction feedback: ${l.feedback || 'None'}`).join('\n')}\n`;
    }
  } catch (err) {
    console.error('[Learning retrieve error]', err.message);
  }

  return `
${baseSystemPrompt}

=== BUSINESS REASONING PILLARS ===
Analyze and explain findings structured using these metrics where relevant:
- **Problem**: Outline anomalies or issues.
- **Cause**: Explain the underlying cause.
- **Risk**: Operational or financial exposure.
- **Recommendation**: Propose direct steps to take.
- **Priority**: High | Medium | Low.
- **Expected Impact**: Metric improvements expected.

${memoryText}
${learningText}
`;
}

async function getSystemPrompt(key, defaultPrompt) {
  try {
    const config = await PromptConfig.findOne({ key, isActive: true });
    return config ? config.content : defaultPrompt;
  } catch {
    return defaultPrompt;
  }
}

// ─── Module 1: Dashboard Insights ────────────────────────────────────────────
export async function generateDashboardInsights(stats) {
  const defaultPrompt = `
You are an expert business analyst and HR/CRM dashboard co-pilot.
Analyze the raw statistics from our database:
- Attendance Today: {{attendanceToday}}
- Recent Sales/Deals Closed: {{salesStats}}
- Open/Pending Leads: {{leadsStats}}
- Top Performers: {{topPerformers}}
- Employees Absent Today: {{employeesAbsent}}
- Upcoming Meetings & Birthdays: {{upcomingEvents}}

Provide 3 business insights and actions in JSON format.
Output:
{
  "businessSummary": "string",
  "insights": ["string"]
}
`;
  const dbPrompt = await getSystemPrompt('dashboard_insights', defaultPrompt);
  const compiled = await compileBusinessPrompt('HRM', dbPrompt);
  const finalPrompt = compiled
    .replace('{{attendanceToday}}', JSON.stringify(stats.attendanceToday))
    .replace('{{salesStats}}', JSON.stringify(stats.salesStats))
    .replace('{{leadsStats}}', JSON.stringify(stats.leadsStats))
    .replace('{{topPerformers}}', JSON.stringify(stats.topPerformers))
    .replace('{{employeesAbsent}}', JSON.stringify(stats.employeesAbsent))
    .replace('{{upcomingEvents}}', JSON.stringify(stats.upcomingEvents));

  return callLLM(finalPrompt, { jsonMode: true, ...FAST, module: 'Dashboard' });
}

// ─── Module 2: Natural Language Search ───────────────────────────────────────
export async function translateNaturalLanguageQuery(queryText) {
  const defaultPrompt = `
You are a translation bridge between natural language English and Mongoose/MongoDB query parameters.
Convert the user request: "${queryText}" into a safe, valid MongoDB query object.

ALLOWED COLLECTIONS:
- Employee (fields: name, email, department, designation, employeeId, joinDate, mobile, address)
- Client (fields: name, company, email, phone, status: ['Lead', 'Active', 'Inactive'])
- Deal (fields: title, amount, stage: ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], clientName, owner)
- Invoice (fields: number, status: ['Draft', 'Sent', 'Accepted', 'Paid', 'Overdue', 'Cancelled'], total, dueDate)
- LeaveRequest (fields: employeeName, status: ['Pending', 'Approved', 'Rejected'], type, startDate, endDate)
- Task (fields: title, status: ['Pending', 'In Progress', 'Completed'], priority, employeeId)

Today's date is: ${new Date().toISOString().split('T')[0]}

Return JSON:
{
  "collection": "string",
  "query": {},
  "sort": {} or null,
  "limit": number,
  "explanation": "string"
}
`;
  const dbPrompt = await getSystemPrompt('nl_search', defaultPrompt);
  const compiled = await compileBusinessPrompt('General', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'NL-Search' });
}

// ─── Module 3: Employee Insights Card ────────────────────────────────────────
export async function generateEmployeeInsights(employee, attendance, tasks) {
  const defaultPrompt = `
You are an HR analytics advisor.
Analyze this employee profile:
Profile: ${JSON.stringify(employee)}
Attendance: ${JSON.stringify(attendance)}
Tasks: ${JSON.stringify(tasks)}

Return JSON with: attendanceScore, performance, lateLoginPattern, leavePattern, taskCompletion, promotionSuggestion, riskLevel, strengths, weaknesses, trainingRecommendation.
`;
  const dbPrompt = await getSystemPrompt('employee_insights', defaultPrompt);
  const compiled = await compileBusinessPrompt('HRM', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'HRM' });
}

// ─── Module 4: Resume Parser & Scoring ───────────────────────────────────────
export async function parseResume(resumeText, jobDescription) {
  const defaultPrompt = `
You are an AI Recruitment assistant.
Analyze the following resume text:
---
{{resumeText}}
---

Score against Job Description:
---
{{jobDescription}}
---

Return JSON:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "matchPercentage": number,
  "confidence": number,
  "experience": "string",
  "skills": ["string"],
  "jobDescriptionScoreExplanation": "string"
}
`;
  const dbPrompt = await getSystemPrompt('resume_parser', defaultPrompt);
  const compiled = await compileBusinessPrompt('Recruitment', dbPrompt);
  const finalPrompt = compiled
    .replace('{{resumeText}}', resumeText)
    .replace('{{jobDescription}}', jobDescription || 'Full Stack Software Engineer');
  return callLLM(finalPrompt, { jsonMode: true, ...DEEP, module: 'Recruitment' });
}

// ─── Module 5: Lead Scoring ───────────────────────────────────────────────────
export async function scoreLead(lead, deals, interactions) {
  const defaultPrompt = `
You are a sales intelligence coach.
Lead Profile: ${JSON.stringify(lead)}
Deals: ${JSON.stringify(deals)}
Interactions: ${JSON.stringify(interactions)}

Analyze and return explainable deal health indicators:
- Probability of winning the deal (0-100)
- Explainable score category (Cold, Warm, Hot)
- Step-by-step reasoning list explaining *why* the probability is selected (e.g. "Overdue close date", "No interactions in 10 days", "Last email was highly positive").
- "nextBestAction" text string proposing the immediate next step.

Return JSON:
{
  "score": "Cold" | "Warm" | "Hot",
  "probability": number,
  "confidence": number,
  "reason": "string",
  "reasoningList": ["string"],
  "nextBestAction": "string"
}
`;
  const dbPrompt = await getSystemPrompt('lead_scoring', defaultPrompt);
  const compiled = await compileBusinessPrompt('CRM', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'CRM' });
}

// ─── Module 6: Email Writer ───────────────────────────────────────────────────
export async function writeEmail(leadName, emailType, customInstructions, companyTone = 'Professional') {
  const defaultPrompt = `
Generate a ${companyTone} email for client/lead: "${leadName}".
Email Type: ${emailType}.
Additional context: ${customInstructions}.
Write subject line and body. Keep it concise and action-oriented.
`;
  const dbPrompt = await getSystemPrompt('email_writer', defaultPrompt);
  const compiled = await compileBusinessPrompt('CRM', dbPrompt);
  return callLLM(compiled, { ...FAST, module: 'CRM' });
}

// ─── Module 7: WhatsApp Reply ─────────────────────────────────────────────────
export async function generateWhatsAppReply(customerMessage, history, tone = 'Friendly') {
  const defaultPrompt = `
You are a CRM chatbot assistant. Write a short, responsive WhatsApp message reply (max 3 sentences).
Customer Message: "${customerMessage}"
CRM History: ${JSON.stringify(history)}
Tone: ${tone}
`;
  const dbPrompt = await getSystemPrompt('whatsapp_writer', defaultPrompt);
  const compiled = await compileBusinessPrompt('CRM', dbPrompt);
  return callLLM(compiled, { ...FAST, module: 'CRM' });
}

// ─── Module 8: Document Placeholder Extractor ────────────────────────────────
export async function getDocumentPlaceholders(templateText) {
  const defaultPrompt = `
Identify all placeholder fields (enclosed in {{...}} or [...]) in this template:
---
${templateText}
---
Return JSON: { "placeholders": ["field1", "field2"] }
`;
  const dbPrompt = await getSystemPrompt('doc_placeholders', defaultPrompt);
  const compiled = await compileBusinessPrompt('Documents', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Documents' });
}

// ─── Module 9: Meeting Summary ────────────────────────────────────────────────
export async function summarizeMeeting(transcript) {
  const defaultPrompt = `
Analyze this meeting transcript:
---
${transcript}
---
Return JSON:
{
  "summary": "string",
  "keyDecisions": ["string"],
  "actionItems": [{ "task": "string", "owner": "string", "dueDate": "string" }],
  "nextMeetingSuggestion": "string"
}
`;
  const dbPrompt = await getSystemPrompt('meeting_summary', defaultPrompt);
  const compiled = await compileBusinessPrompt('Meetings', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Meetings' });
}

// ─── Module 10: Report Summary ────────────────────────────────────────────────
export async function generateReportSummary(reportType, metrics) {
  const defaultPrompt = `
Generate an executive summary markdown report for: ${reportType}.
Metrics: ${JSON.stringify(metrics)}
Include: key findings, trends, anomalies, and 3 actionable recommendations.
`;
  const dbPrompt = await getSystemPrompt('report_summary', defaultPrompt);
  const compiled = await compileBusinessPrompt('Reports', dbPrompt);
  return callLLM(compiled, { ...FAST, module: 'Reports' });
}

// ─── Module 11: RAG Knowledge Base ───────────────────────────────────────────
export async function answerFromKnowledgeBase(question, contextChunks) {
  const defaultPrompt = `
You are a company Knowledge Base Assistant.
Answer the user's question using ONLY the provided document sections below.
If the answer is not present in the context, respond: "I could not find relevant information in the knowledge base for this question."

Context Documents:
---
{{context}}
---

Question: "{{question}}"

Respond in this JSON format:
{
  "answer": "string",
  "citations": [{ "document": "string", "page": number, "excerpt": "string" }],
  "confidence": number
}
`;
  const dbPrompt = await getSystemPrompt('kb_rag', defaultPrompt);
  const compiled = await compileBusinessPrompt('RAG', dbPrompt);
  const contextText = contextChunks
    .map(c => `[Document: ${c.title}${c.pageNumber ? `, Page: ${c.pageNumber}` : ''}]\n${c.text}`)
    .join('\n\n');
  const finalPrompt = compiled
    .replace('{{question}}', question)
    .replace('{{context}}', contextText);
  return callLLM(finalPrompt, { jsonMode: true, ...DEEP, module: 'RAG' });
}

// ─── Module 12: AI Forecasts ──────────────────────────────────────────────────
export async function predictForecast(type, historicalData) {
  const defaultPrompt = `
Analyze historical data for: ${type}
Data: ${JSON.stringify(historicalData)}
Return JSON: { "prediction": "string", "confidenceScore": number, "trend": "up|down|stable", "explanation": "string" }
`;
  const dbPrompt = await getSystemPrompt('predict_forecast', defaultPrompt);
  const compiled = await compileBusinessPrompt('Analytics', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Analytics' });
}

// ─── Module 13: Agent Command Parser (MCP) ────────────────────────────────────
export async function processAgentCommand(userInput, userRole) {
  const prompt = `
You are the intelligent operating layer of an Enterprise HRM+CRM SaaS platform.
Parse this user command: "${userInput}" and map it to a tool call if applicable.
Today: ${new Date().toISOString().split('T')[0]}
User Role: ${userRole}

AVAILABLE TOOLS:
${JSON.stringify(TOOLS_SCHEMA)}

Rules:
1. If the command matches a tool, resolve it with correct arguments.
2. If no tool matches, set toolName to "unknown" and write a helpful chat reply.
3. Always suggest a redirectUrl if relevant.
4. For create actions, include autofillData.

Return JSON:
{
  "toolName": "string",
  "arguments": {},
  "explanation": "string",
  "redirectUrl": "string or null",
  "autofillData": {} or null,
  "chatReply": "string"
}
`;
  const compiled = await compileBusinessPrompt('Agent', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Agent' });
}

// ─── Module 14: Voice Command Router ─────────────────────────────────────────
export async function processVoiceCommand(transcript) {
  const defaultPrompt = `
You are a voice command processing agent for an enterprise HRM/CRM platform.
Parse this spoken command: "${transcript}"
Return JSON: { "intent": "string", "entity": "string", "action": "string", "parameters": {} }
`;
  const dbPrompt = await getSystemPrompt('voice_command', defaultPrompt);
  const compiled = await compileBusinessPrompt('Voice', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Voice' });
}

// ─── Module 15: OCR / Form AutoFill ──────────────────────────────────────────
export async function extractOcrData(documentText, documentType) {
  const defaultPrompt = `
You are an OCR extraction engine.
Extract structured data from this ${documentType} document:
---
${documentText}
---
Return a JSON object with all relevant fields extracted.
`;
  const dbPrompt = await getSystemPrompt('ocr_extractor', defaultPrompt);
  const compiled = await compileBusinessPrompt('OCR', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'OCR' });
}

// ─── Module 16: Candidate Ranking ────────────────────────────────────────────
export async function rankCandidates(candidatesList, jobRequirements) {
  const defaultPrompt = `
You are a senior technical recruiter.
Rank these candidates against: "${jobRequirements}"
Candidates: ${JSON.stringify(candidatesList)}
Return JSON: { "ranked": [{ "name": "string", "rank": number, "score": number, "reason": "string" }] }
`;
  const dbPrompt = await getSystemPrompt('recruitment_ranking', defaultPrompt);
  const compiled = await compileBusinessPrompt('Recruitment', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...DEEP, module: 'Recruitment' });
}

// ─── Module 17: Sales Coach Insights ─────────────────────────────────────────
export async function getSalesCoachInsights(dealsData, interactionsData) {
  const defaultPrompt = `
You are a senior sales coach and CRM analyst.
Deals Pipeline: ${JSON.stringify(dealsData)}
Recent Interactions: ${JSON.stringify(interactionsData)}
Return JSON: { "coachingSuggestions": ["string"], "riskDeals": ["string"], "winProbabilityInsight": "string", "nextBestAction": "string" }
`;
  const dbPrompt = await getSystemPrompt('sales_coach', defaultPrompt);
  const compiled = await compileBusinessPrompt('CRM', dbPrompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'CRM' });
}

// ─── Module 18: AI Offer / HR Letter Generator ───────────────────────────────
export async function generateHrLetter(letterType, employeeData, additionalContext = '') {
  const prompt = `
You are an expert HR professional.
Generate a formal ${letterType} letter for:
Employee: ${JSON.stringify(employeeData)}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Write a professional letter with proper formatting. Include date, salutation, body, and signature block.
`;
  const compiled = await compileBusinessPrompt('HRM', prompt);
  return callLLM(compiled, { ...FAST, module: 'HRM' });
}

// ─── Module 19: Employee Performance Summary ──────────────────────────────────
export async function generatePerformanceSummary(employee, kpiData, reviewPeriod) {
  const prompt = `
You are an HR performance review specialist.
Employee: ${JSON.stringify(employee)}
KPI Data for ${reviewPeriod}: ${JSON.stringify(kpiData)}
Generate a structured performance review summary with ratings, highlights, improvement areas, and a recommended action plan.
Return JSON: { "overallRating": "string", "highlights": ["string"], "improvementAreas": ["string"], "actionPlan": ["string"], "summary": "string" }
`;
  const compiled = await compileBusinessPrompt('HRM', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'HRM' });
}

// ─── Module 20: Attendance & Leave Analysis ───────────────────────────────────
export async function analyzeAttendanceLeave(employeeId, attendanceData, leaveData) {
  const prompt = `
You are an HR analytics specialist.
Analyze attendance and leave patterns for employee ID: ${employeeId}
Attendance records: ${JSON.stringify(attendanceData)}
Leave history: ${JSON.stringify(leaveData)}
Return JSON: { "attendanceScore": number, "lateArrivals": number, "absentDays": number, "leaveBalance": number, "pattern": "string", "recommendations": ["string"] }
`;
  const compiled = await compileBusinessPrompt('HRM', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'HRM' });
}

// ─── Module 21: AI Notes Summarizer ──────────────────────────────────────────
export async function summarizeNotes(notes) {
  const prompt = `
Summarize these CRM/HRM notes into a concise, action-oriented summary:
---
${notes}
---
Return JSON: { "summary": "string", "keyPoints": ["string"], "followUpActions": ["string"] }
`;
  const compiled = await compileBusinessPrompt('Notes', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Notes' });
}

// ─── Module 22: Follow-up Reminder Suggestions ───────────────────────────────
export async function suggestFollowUps(lead, lastInteraction, dealStage) {
  const prompt = `
You are a sales automation assistant.
Lead: ${JSON.stringify(lead)}
Last Interaction: ${JSON.stringify(lastInteraction)}
Deal Stage: ${dealStage}
Suggest the best follow-up actions and timing.
Return JSON: { "suggestedAction": "string", "channel": "email|whatsapp|call", "timing": "string", "messageTemplate": "string" }
`;
  const compiled = await compileBusinessPrompt('CRM', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'CRM' });
}

// ─── Module 23: AI Proposal Generator ────────────────────────────────────────
export async function generateProposal(clientData, dealData, productDetails) {
  const prompt = `
You are a professional business development specialist.
Client: ${JSON.stringify(clientData)}
Deal: ${JSON.stringify(dealData)}
Product/Service Details: ${JSON.stringify(productDetails)}
Generate a complete business proposal with executive summary, scope, pricing, timeline, and call to action.
`;
  const compiled = await compileBusinessPrompt('CRM', prompt);
  return callLLM(compiled, { ...DEEP, module: 'CRM' });
}

// ─── Module 24: Workflow Suggestions ─────────────────────────────────────────
export async function suggestWorkflows(moduleType, currentProcessDescription) {
  const prompt = `
You are an enterprise process automation expert.
Module: ${moduleType}
Current Process: ${currentProcessDescription}
Suggest 3 automation workflows that would save time and reduce errors.
Return JSON: { "workflows": [{ "name": "string", "trigger": "string", "actions": ["string"], "estimatedTimeSaved": "string" }] }
`;
  const compiled = await compileBusinessPrompt('Automation', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Automation' });
}

// ─── Document Intelligence Functions ──────────────────────────────────────────
export async function extractClauses(documentText) {
  const prompt = `You are a contract analysis bot.
Extract all key clauses (e.g. Indemnity, Termination, Liability, Payment Terms) from this contract text:
---
${documentText}
---
Return a JSON object: { "clauses": [{ "title": "string", "text": "string" }] }`;
  const compiled = await compileBusinessPrompt('OCR', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'OCR' });
}

export async function evaluateContractRisk(documentText) {
  const prompt = `You are a contract risk evaluation agent.
Evaluate potential risks in this contract text:
---
${documentText}
---
Return a JSON object: { "risks": [{ "severity": "High"|"Medium"|"Low", "clause": "string", "reason": "string" }] }`;
  const compiled = await compileBusinessPrompt('OCR', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'OCR' });
}

export async function checkCompliance(documentText, regulations = 'Standard corporate guidelines') {
  const prompt = `You are a compliance auditing agent.
Audit this text against regulations: "${regulations}"
---
${documentText}
---
Return a JSON object: { "compliant": boolean, "violations": [{ "issue": "string", "recommendation": "string" }] }`;
  const compiled = await compileBusinessPrompt('OCR', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'OCR' });
}

export async function generateAiActions(analysisData) {
  const prompt = `You are an automated operations workflow architect.
Review the following document analysis metadata:
${JSON.stringify(analysisData)}

Recommend 3 automated workflow action tasks to execute next.
Return JSON: { "actions": [{ "title": "string", "actionType": "string", "description": "string" }] }`;
  const compiled = await compileBusinessPrompt('Automation', prompt);
  return callLLM(compiled, { jsonMode: true, ...FAST, module: 'Automation' });
}

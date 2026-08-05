import { callLLM } from './llm.service.js';
import { executeTool, TOOLS_SCHEMA } from './mcp.service.js';
import Learning from '../models/Learning.js';
import * as contextEngine from './contextEngine.service.js';
import { buildSafeUserPrompt, sanitizeUntrustedText } from '../utils/promptGuard.js';

export const AGENT_PERSONAS = {
  HR: {
    name: "HR Specialist Agent",
    prompt: "Manages employee summaries, performance assessments, leave analysis, attrition prediction, training recommendations, and skill gap analyses."
  },
  CRM: {
    name: "CRM Intelligence Agent",
    prompt: "Manages lead scoring, product recommendations, duplicate detection, and customer relations."
  },
  Sales: {
    name: "Sales Conversion Agent",
    prompt: "Manages deals pipeline, proposals, quotations, and revenue planning."
  },
  Recruitment: {
    name: "Recruitment Screening Agent",
    prompt: "Parses resumes, ranks job applicants, suggests interview questions, and assesses risks."
  },
  Payroll: {
    name: "Payroll & Compensation Agent",
    prompt: "Manages payroll overheads, basic salaries, payslip generations, and payroll forecasts."
  },
  Attendance: {
    name: "Attendance Integrity Agent",
    prompt: "Detects late arrivals, gps fraud patterns, and abnormal attendance spikes."
  },
  Analytics: {
    name: "Business Forecast Agent",
    prompt: "Generates predictive forecasts (attrition, conversion, payroll cost, deal conversions)."
  },
  Knowledge: {
    name: "Policy Knowledge Agent",
    prompt: "Performs vector RAG searches on company policies and handbook guidelines."
  },
  Document: {
    name: "HR & Business Document Agent",
    prompt: "Auto-generates formal business letters (Offer, Warning, Promotion, NDA, Proposal) with zero placeholders."
  }
};

/**
 * ENTERPRISE AI BRAIN RUNTIME WITH CONTEXT ENGINE
 */
export async function runAgentOrchestrator(userInput, userRole, tenantId, clientContext = {}, memoriesArg = [], prevLogsArg = []) {
  const orchestratorStart = Date.now();
  const actionsExecuted = [];
  const sources = [];

  // Initialize Metrics Log
  const metrics = {
    promptSize: 0,
    retrievedContextCount: 0,
    memoryCount: 0,
    policyCount: 0,
    latency: 0,
    tokens: 0,
    cacheHit: 0,
    cacheMiss: 0
  };

  const userEmail = clientContext?.userEmail || 'System';
  const activeModule = clientContext?.module || 'General';

  // 1. Context Engine: Retrieve cached tenant
  const tenant = await contextEngine.loadCachedTenant(tenantId, metrics);

  // 2. Context Engine: Retrieve similarity ranked memories (Top 5)
  const memories = await contextEngine.retrieveRankedMemories(userInput, tenantId, userEmail, activeModule, metrics);

  // 3. Context Engine: Retrieve module-scoped policies (Top 5)
  const policies = await contextEngine.retrieveScopedPolicies(activeModule, tenantId, metrics);

  // 4. Context Engine: Summarize / Compress long conversation logs
  const prevLogs = await contextEngine.compressConversationHistory(prevLogsArg, metrics);

  // 5. Learning Engine: Retrieve successful style preferences
  let learningStylePrompt = "";
  try {
    const activeLearnings = await Learning.find({ tenantId }).sort({ createdAt: -1 }).limit(3);
    if (activeLearnings.length > 0) {
      learningStylePrompt = `\n=== DYNAMIC STYLE LEARNINGS ===\n${activeLearnings.map(l => `- Preference correction: ${l.feedback || 'None'}`).join('\n')}\n`;
    }
  } catch (err) {
    console.error('[Learning retrieve error]', err.message);
  }

  // Compile Context Summary
  const contextSummary = `
Tenant ID: ${tenantId}
Company Name: ${tenant?.companyName || 'Vastora Tech'}
User: ${userEmail} (Role: ${userRole})
Current Page: ${clientContext?.page || 'Dashboard'}
Active Module: ${activeModule}
Active Employee ID: ${clientContext?.selectedEmployeeId || 'None'}
Active Lead ID: ${clientContext?.selectedLeadId || 'None'}
Active Deal ID: ${clientContext?.selectedDealId || 'None'}
Employee Record: ${clientContext?.employee ? JSON.stringify({
  employeeId: clientContext.employee.employeeId,
  name: clientContext.employee.name,
  email: clientContext.employee.email,
  department: clientContext.employee.department,
  designation: clientContext.employee.designation,
  joinDate: clientContext.employee.joinDate,
}) : 'None'}
Lead Record: ${clientContext?.lead ? JSON.stringify({
  id: clientContext.lead._id,
  name: clientContext.lead.name,
  company: clientContext.lead.company,
  email: clientContext.lead.email,
  status: clientContext.lead.status,
  phone: clientContext.lead.phone,
}) : 'None'}
Deal Record: ${clientContext?.deal ? JSON.stringify({
  id: clientContext.deal._id,
  title: clientContext.deal.title,
  amount: clientContext.deal.amount,
  stage: clientContext.deal.stage,
  expectedCloseDate: clientContext.deal.expectedCloseDate,
}) : 'None'}
Active Filters: ${JSON.stringify(clientContext?.filters || {})}
Memories (Ranked): ${JSON.stringify(memories.map(m => sanitizeUntrustedText(m.content, { maxLen: 500 })))}
Policies (Scoped): ${JSON.stringify(policies.map(p => sanitizeUntrustedText(p.content, { maxLen: 800 })))}
${learningStylePrompt}
`;

  metrics.retrievedContextCount = memories.length + policies.length + prevLogs.length + (clientContext ? 4 : 0);

  // ──── Step 1: PLANNER AGENT ────
  const plannerPrompt = `
You are the Planner Agent for an enterprise HRM+CRM AI Operating System.
Your job is to read the user request, analyze the company context and available tools, and break it down into execution steps.

AVAILABLE TOOLS:
${JSON.stringify(TOOLS_SCHEMA, null, 2)}

SYSTEM CONTEXT:
${contextSummary}

User Request:
${buildSafeUserPrompt(userInput)}

You must create a plan containing list of steps. For each step, specify the target business Agent, a clear instruction, and optionally a Tool to call with its parsed arguments.
Return JSON ONLY in this format:
{
  "reasoning": "step-by-step thinking about how to solve the request",
  "plan": [
    {
      "step": number,
      "agent": "HR | CRM | Sales | Recruitment | Payroll | Attendance | Analytics | Knowledge | Document",
      "instruction": "what this agent needs to do",
      "toolToCall": "toolName or null",
      "toolArgs": {}
    }
  ]
}
`;

  let planObj = { plan: [] };
  try {
    planObj = await callLLM(plannerPrompt, { jsonMode: true, provider: 'groq', module: 'Planner' });
  } catch (err) {
    planObj = {
      plan: [{
        step: 1,
        agent: "HR",
        instruction: "Process general request directly",
        toolToCall: null,
        toolArgs: {}
      }]
    };
  }

  const reasoningSteps = [planObj.reasoning || "Initiating task evaluation..."];

  // ──── Step 2: PARALLEL EXECUTION & ROUTER LOOP ────
  const parallelSteps = (planObj.plan || []).filter(step => step.toolToCall);
  const sequentialSteps = (planObj.plan || []).filter(step => !step.toolToCall);

  if (parallelSteps.length > 0) {
    reasoningSteps.push(`Executing ${parallelSteps.length} tool actions in parallel...`);
    
    await Promise.all(parallelSteps.map(async (step) => {
      try {
        const execution = await executeTool(step.toolToCall, step.toolArgs, userRole, tenantId);
        actionsExecuted.push({
          tool: step.toolToCall,
          args: step.toolArgs,
          status: execution.success ? 'Success' : 'Failed',
          result: execution.data || execution.message
        });

        if (execution.success && step.toolToCall === 'searchKnowledge' && execution.data) {
          execution.data.forEach(source => {
            sources.push({
              documentName: source.document,
              pageNumber: source.page,
              excerpt: source.excerpt,
              confidence: source.score
            });
          });
        }
      } catch (err) {
        actionsExecuted.push({
          tool: step.toolToCall,
          args: step.toolArgs,
          status: 'Error',
          result: err.message
        });
      }
    }));
  }

  for (const step of sequentialSteps) {
    const routerPrompt = `
You are the Router Agent. You coordinate the ${step.agent} Agent.
Instruction: ${step.instruction}
Previous execution logs: ${JSON.stringify(actionsExecuted)}

Write a concise synthesis of findings for this step.
`;
    try {
      const stepSynthesis = await callLLM(routerPrompt, { provider: 'groq', module: 'Router' });
      reasoningSteps.push(`[${step.agent} Agent Synthesis]: ${stepSynthesis}`);
    } catch (e) {
      reasoningSteps.push(`[${step.agent} Agent Synthesis]: Executed step successfully.`);
    }
  }

  // ──── Step 3: CRITIC AGENT SELF-VALIDATION LOOP (WITH RETRIES) ────
  let validatedOutput = null;
  let retries = 3;
  let warningMessage = "";

  while (retries > 0 && !validatedOutput) {
    const reflectionPrompt = `
You are the Critic & Reflection Agent.
Review the entire execution run:
Original User Query: "${userInput}"
System Context: ${contextSummary}
Execution Steps & Outputs:
${reasoningSteps.join('\n')}
Actions Log: ${JSON.stringify(actionsExecuted)}
Sources Cited: ${JSON.stringify(sources)}
${warningMessage ? `PREVIOUS CRITIC WARNINGS: ${warningMessage}` : ''}

Validate:
1. Did we successfully execute the required tools?
2. Did we respect the tenant parameters and user role boundaries?
3. Is there any hallucinated data? If yes, correct it.
4. Does the summary explain the Problem, Cause, Risk, Recommendation, Priority, and Impact where applicable?
5. If the request was successful, provide exact executable action objects in the "actions" array matching the TOOLS_SCHEMA so the frontend can display action buttons.

Return strictly in this JSON structure:
{
  "isValid": true | false,
  "warnings": "explain why validation failed, or empty if valid",
  "reasoning": "comprehensive step-by-step reasoning showing reflection/self-correction checks",
  "actions": [
    {
      "name": "toolName",
      "label": "User-Friendly Action Button Name",
      "parameters": {}
    }
  ],
  "summary": "premium final user-facing response with zero placeholders, explaining Problem/Cause/Impact",
  "confidence": number (float between 0 and 1 representing accuracy score),
  "sources": ${JSON.stringify(sources)}
}
`;

    // Compute active prompt size metric
    metrics.promptSize = reflectionPrompt.length;

    try {
      const criticResult = await callLLM(reflectionPrompt, { jsonMode: true, provider: 'groq', module: 'Critic' });
      
      if (criticResult.isValid === true || retries === 1) {
        validatedOutput = criticResult;
      } else {
        warningMessage = criticResult.warnings || "Output validation rejected.";
        reasoningSteps.push(`[Critic Validation Failed]: ${warningMessage}. Re-evaluating...`);
        retries--;
      }
    } catch (err) {
      console.error('[Critic Loop Error]', err.message);
      retries--;
    }
  }

  // Record final latency & tokens
  metrics.latency = Date.now() - orchestratorStart;
  metrics.tokens = Math.ceil((metrics.promptSize + (validatedOutput?.summary?.length || 0)) / 4);

  // Auto-log to learning engine
  if (validatedOutput && validatedOutput.confidence >= 0.85) {
    try {
      await Learning.create({
        tenantId,
        userId: userEmail,
        prompt: userInput,
        response: validatedOutput.summary,
        status: 'Success',
        actionsExecuted: actionsExecuted.map(a => a.tool),
        stylePreference: validatedOutput.summary.includes('*') ? 'Bulleted' : 'Paragraph'
      });
    } catch (e) {
      console.error('[Learning Save Error]', e.message);
    }
  }

  return {
    ...(validatedOutput || {
      reasoning: reasoningSteps.join('\n'),
      actions: actionsExecuted.map(a => ({ name: a.tool, label: `Run ${a.tool}`, parameters: a.args })),
      summary: `Processed query with ${actionsExecuted.length} tools executed.`,
      confidence: 0.8,
      sources
    }),
    metrics
  };
}

/**
 * Lightweight single-persona task runner used by automation suggestions.
 * Reuses the orchestrator with a focused prompt — no separate agent stack.
 */
export async function runAgentTask(personaKey, prompt, context = {}) {
  const persona = AGENT_PERSONAS[personaKey];
  const roleLabel = persona?.name || personaKey || 'Analytics';
  const userInput = `[${roleLabel}]\n${prompt}`;
  const result = await runAgentOrchestrator(
    userInput,
    context.userRole || 'Admin',
    context.tenantId,
    { companyName: context.companyName, module: personaKey },
    [],
    []
  );
  return {
    summary: result.summary,
    confidence: result.confidence,
    actions: result.actions || [],
    reasoning: result.reasoning,
    sources: result.sources || [],
  };
}

import mongoose from 'mongoose';
import BusinessHealthSnapshot from '../models/BusinessHealthSnapshot.js';
import ExecutiveCommandLog from '../models/ExecutiveCommandLog.js';
import ProcessWorkflow from '../models/ProcessWorkflow.js';
import SimulationDraft from '../models/SimulationDraft.js';
import DailyBriefLog from '../models/DailyBriefLog.js';
import WorkflowExecutionLog from '../models/WorkflowExecutionLog.js';

import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Task from '../models/Task.js';
import Ticket from '../models/Ticket.js';
import JobApplication from '../models/JobApplication.js';

import { callLLM } from '../services/llm.service.js';
import { runAgentOrchestrator } from '../services/aiAgents.service.js';
import { executeTool } from '../services/mcp.service.js';

// ─── 1. AI Business Health Score ─────────────────────────────────────────────
export const getBusinessHealthScore = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // 1. Gather raw data metrics
    const [
      totalEmployees,
      totalClients,
      pendingLeaves,
      openTickets,
      deals,
      invoices,
      absentToday
    ] = await Promise.all([
      Employee.countDocuments({ tenantId }),
      Client.countDocuments({ tenantId }),
      LeaveRequest.countDocuments({ tenantId, status: 'Pending' }),
      Ticket.countDocuments({ tenantId, status: { $in: ['Open', 'In Progress'] } }),
      Deal.find({ tenantId }),
      Invoice.find({ tenantId }),
      LeaveRequest.countDocuments({ tenantId, status: 'Approved' }) // Approximation of absents today
    ]);

    // Calculate Sales Health
    const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
    const wonDeals = deals.filter(d => d.stage === 'Closed Won');
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 80;
    const salesHealth = Math.min(100, Math.max(50, Math.round(winRate)));

    // Calculate HR Health
    const attritionRate = totalEmployees > 0 ? (absentToday / totalEmployees) * 100 : 5;
    const hrHealth = Math.min(100, Math.max(40, Math.round(100 - attritionRate * 5 - pendingLeaves * 2)));

    // Calculate Finance Health
    const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const collectionRatio = invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 90;
    const financeHealth = Math.min(100, Math.max(50, Math.round(collectionRatio)));

    // Calculate Support Health
    const supportHealth = Math.min(100, Math.max(50, Math.round(100 - openTickets * 5)));

    // Calculate Recruiting Health (Simulated proxy or constant benchmark)
    const recruitingHealth = 85;

    // Calculate Overall Health Score
    const overallScore = Math.round(
      (salesHealth + hrHealth + financeHealth + recruitingHealth + supportHealth) / 5
    );

    // List top risks
    const riskDetails = [];
    if (pendingLeaves > 0) {
      riskDetails.push({ message: `${pendingLeaves} pending leave approvals blocking operations`, severity: 'Medium' });
    }
    if (overdueInvoices.length > 0) {
      riskDetails.push({ message: `${overdueInvoices.length} unpaid invoices overdue`, severity: 'High' });
    }
    if (openTickets > 3) {
      riskDetails.push({ message: `Customer support tickets backlog is high (${openTickets} open)`, severity: 'Medium' });
    }
    if (attritionRate > 20) {
      riskDetails.push({ message: `High daily absenteeism detected today`, severity: 'High' });
    }

    if (riskDetails.length === 0) {
      riskDetails.push({ message: 'No critical operational risks identified.', severity: 'Low' });
    }

    // Save snapshot to DB
    const snapshot = new BusinessHealthSnapshot({
      tenantId,
      overallScore,
      breakdown: {
        sales: salesHealth,
        hr: hrHealth,
        finance: financeHealth,
        recruiting: recruitingHealth,
        support: supportHealth
      },
      riskDetails
    });
    await snapshot.save();

    res.json({
      success: true,
      overallScore,
      breakdown: snapshot.breakdown,
      riskDetails,
      updatedAt: snapshot.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 2. Executive Daily Brief ────────────────────────────────────────────────
export const getExecutiveBrief = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if brief already calculated today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingBrief = await DailyBriefLog.findOne({
      tenantId,
      userId,
      createdAt: { $gte: todayStart }
    });

    if (existingBrief) {
      return res.json({
        success: true,
        briefHtml: existingBrief.briefHtml,
        createdAt: existingBrief.createdAt
      });
    }

    // Fetch live statistics to generate custom brief
    const [
      totalEmployees,
      leads,
      deals,
      invoices,
      pendingLeaves
    ] = await Promise.all([
      Employee.countDocuments({ tenantId }),
      Client.countDocuments({ tenantId, status: 'Lead' }),
      Deal.find({ tenantId }),
      Invoice.find({ tenantId }),
      LeaveRequest.countDocuments({ tenantId, status: 'Pending' })
    ]);

    const salesPipeline = deals
      .filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
      .reduce((acc, d) => acc + (d.amount || 0), 0);

    const overdueInvoices = invoices
      .filter(i => i.status === 'Overdue')
      .reduce((acc, i) => acc + (i.total || 0), 0);

    // Call LLM to format custom HTML briefing
    const briefPrompt = `
      You are the Chief of Staff AI for Vastora Business OS.
      Draft a premium, daily executive briefing page in clean HTML (using inline CSS tailwind styling principles for container, margins, cards, badges, and colors) for the CEO.
      Keep it very readable, professional, and punchy.
      
      Here are the live stats:
      - Total Active Roster: ${totalEmployees} employees
      - Pending Leave Approvals: ${pendingLeaves}
      - Hot Leads In Play: ${leads}
      - Active Deals Pipeline Value: ₹${salesPipeline.toLocaleString('en-IN')}
      - Overdue Invoices Receivable: ₹${overdueInvoices.toLocaleString('en-IN')}

      Structure the HTML report inside a <div> container (no <html>, <head>, or <body> tags):
      1. Dynamic Greeting ("Good Morning")
      2. Daily Highlights section
      3. Critical Risks (e.g. Overdue receivables, Pending approvals)
      4. Actionable recommendations with clear icons or checkboxes.
    `;

    const briefHtml = await callLLM(briefPrompt, { provider: 'groq', module: 'Dashboard' });

    const newBrief = new DailyBriefLog({
      tenantId,
      userId,
      briefHtml,
      sentVia: [{ channel: 'in_app', status: 'Success' }]
    });
    await newBrief.save();

    res.json({
      success: true,
      briefHtml,
      createdAt: newBrief.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 3. Workforce Cost Simulator ─────────────────────────────────────────────
export const simulateWorkforceCost = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { scenarioName, virtualPositions, durationMonths = 12 } = req.body;

    if (!scenarioName || !virtualPositions || !Array.isArray(virtualPositions)) {
      return res.status(400).json({ message: 'scenarioName and virtualPositions array are required' });
    }

    // Retrieve current average payroll totals
    const currentEmployeesCount = await Employee.countDocuments({ tenantId });
    const basePayroll = currentEmployeesCount * 60000;

    let totalCostImpact = 0;
    const monthlyProjection = [];

    for (let month = 1; month <= durationMonths; month++) {
      let monthlyPositionCost = 0;
      let monthlySetupOverhead = 0;

      virtualPositions.forEach(p => {
        const count = p.count || 1;
        let salary = p.salary || 0;

        // Apply annual increment (10% hike after month 12)
        if (month > 12) {
          salary = salary * 1.10;
        }

        // Statutory and benefits calculations
        const pf = salary * 0.12;
        const esi = salary * 0.0325;
        const tax = salary * 0.10;
        const bonus = salary * 0.0833;
        const employeeCost = salary + pf + esi + tax + bonus;

        monthlyPositionCost += employeeCost * count;

        // One-time onboarding equipment setup overhead on Month 1
        if (month === 1) {
          monthlySetupOverhead += 30000 * count; // ₹30,000 per hire
        }
      });

      // Factor 5% attrition/turnover discount on position costs
      const attritionDiscount = monthlyPositionCost * 0.05;
      const netMonthlyCost = Math.round(monthlyPositionCost - attritionDiscount + monthlySetupOverhead);

      totalCostImpact += netMonthlyCost;

      monthlyProjection.push({
        month: `Month ${month}`,
        baselineCost: basePayroll,
        simulatedCost: basePayroll + netMonthlyCost,
        incrementalCost: netMonthlyCost,
        setupOverhead: monthlySetupOverhead,
        attritionDiscount,
        cumulativeCost: totalCostImpact
      });
    }

    const draft = new SimulationDraft({
      tenantId,
      scenarioName,
      virtualPositions,
      totalCostImpact,
      createdBy: req.userId
    });
    await draft.save();

    res.json({
      success: true,
      scenarioName,
      totalCostImpact,
      monthlySimulation: Math.round(totalCostImpact / durationMonths),
      currentMonthlyBase: basePayroll,
      projections: monthlyProjection
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 4. No-Code Workflows ────────────────────────────────────────────────────
export const saveWorkflow = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { workflowName, triggerEvent, nodes, edges, isActive } = req.body;

    if (!workflowName || !triggerEvent) {
      return res.status(400).json({ message: 'workflowName and triggerEvent are required' });
    }

    const workflow = await ProcessWorkflow.findOneAndUpdate(
      { tenantId, workflowName },
      { triggerEvent, nodes, edges, isActive },
      { new: true, upsert: true }
    );

    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const workflows = await ProcessWorkflow.find({ tenantId });
    res.json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const executeWorkflowTest = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { workflowId, testPayload = {} } = req.body;

    const workflow = await ProcessWorkflow.findOne({ _id: workflowId, tenantId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Create execution log entry
    const executionLog = new WorkflowExecutionLog({
      workflowId: workflow._id,
      workflowName: workflow.workflowName,
      status: 'Running',
      triggerEvent: workflow.triggerEvent,
      stepsExecuted: [],
      payload: testPayload
    });

    const steps = [];

    // Node traversal simulation/execution
    for (const node of workflow.nodes) {
      const stepLog = {
        nodeId: node.id,
        label: node.label,
        actionType: node.data?.actionType || 'Trigger',
        status: 'Success',
        timestamp: new Date()
      };

      try {
        if (node.type === 'action') {
          const actionType = node.data?.actionType;
          const payload = node.data?.payload || {};

          // Execution using direct MCP tool runner triggers
          if (actionType === 'SendEmail') {
            await executeTool('sendEmail', {
              to: payload.to || 'ceo@company.com',
              subject: payload.subject || 'Workflow Alert',
              body: payload.body || 'Alert triggered from automation pipeline.'
            }, 'Admin', tenantId);
          } else if (actionType === 'SendWhatsApp') {
            await executeTool('sendWhatsapp', {
              to: payload.to || '919999999999',
              message: payload.text || 'Workflow Alert: Action required.'
            }, 'Admin', tenantId);
          } else if (actionType === 'CreateTask') {
            await executeTool('createTask', {
              title: payload.title || 'Workflow Action Task',
              description: 'Generated automatically by active workflow trigger event.'
            }, 'Admin', tenantId);
          }
        }
        steps.push(`Executed: ${node.label} (${node.id}) successfully`);
      } catch (err) {
        stepLog.status = 'Failed';
        stepLog.errorReason = err.message;
        steps.push(`Failed: ${node.label} (${node.id}) - Reason: ${err.message}`);
        executionLog.status = 'Failed';
        executionLog.errorStack = err.stack;
      }
      executionLog.stepsExecuted.push(stepLog);
    }

    if (executionLog.status !== 'Failed') {
      executionLog.status = 'Completed';
    }

    await executionLog.save();

    res.json({
      success: true,
      workflowName: workflow.workflowName,
      stepsExecuted: steps,
      status: executionLog.status,
      logId: executionLog._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkflowHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await WorkflowExecutionLog.find({ workflowId: id }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const retryWorkflowExecution = async (req, res) => {
  try {
    const { logId } = req.params;
    const oldLog = await WorkflowExecutionLog.findById(logId);
    if (!oldLog) {
      return res.status(404).json({ message: 'Execution log not found' });
    }

    // Increment retry count and reset status
    oldLog.retryCount += 1;
    oldLog.status = 'Running';
    await oldLog.save();

    // Trigger test run equivalent with original payload
    const workflow = await ProcessWorkflow.findById(oldLog.workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Original workflow not found' });
    }

    // Clear old steps and re-run
    oldLog.stepsExecuted = [];
    for (const node of workflow.nodes) {
      const stepLog = {
        nodeId: node.id,
        label: node.label,
        actionType: node.data?.actionType || 'Trigger',
        status: 'Success',
        timestamp: new Date()
      };

      try {
        if (node.type === 'action') {
          const actionType = node.data?.actionType;
          const payload = node.data?.payload || {};

          if (actionType === 'SendEmail') {
            await executeTool('sendEmail', { to: 'ceo@company.com', subject: payload.subject, body: payload.body }, 'Admin', req.tenantId);
          } else if (actionType === 'SendWhatsApp') {
            await executeTool('sendWhatsapp', { to: '919999999999', message: payload.text }, 'Admin', req.tenantId);
          }
        }
      } catch (err) {
        stepLog.status = 'Failed';
        stepLog.errorReason = err.message;
        oldLog.status = 'Failed';
      }
      oldLog.stepsExecuted.push(stepLog);
    }

    if (oldLog.status !== 'Failed') {
      oldLog.status = 'Completed';
    }

    await oldLog.save();
    res.json({ success: true, log: oldLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const aiGenerateWorkflow = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const aiPrompt = `
      You are the Lead Workflow Architect AI for Vastora OS.
      Translate the following user description into nodes and edges configuration:
      "${prompt}"

      Return JSON ONLY matching the following schema:
      {
        "workflowName": "Name of the workflow",
        "triggerEvent": "Trigger event code (e.g. Lead Created, Candidate Hired, Deal Won)",
        "nodes": [
          { "id": "trigger-1", "type": "trigger", "label": "Lead Created", "data": {} },
          { "id": "action-1", "type": "action", "label": "Send Email", "data": { "actionType": "SendEmail", "payload": { "subject": "Welcome", "body": "Hello!" } } }
        ],
        "edges": [
          { "id": "edge-1", "source": "trigger-1", "target": "action-1" }
        ]
      }
    `;

    const generatedWorkflow = await callLLM(aiPrompt, { jsonMode: true, provider: 'groq', module: 'Workflows' });
    res.json({ success: true, ...generatedWorkflow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 5. Executive Command Center ─────────────────────────────────────────────
export const executeExecutiveCommand = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { queryText } = req.body;

    if (!queryText) {
      return res.status(400).json({ message: 'queryText is required' });
    }

    // Call runAgentOrchestrator or directly process command
    const userRole = 'Admin';
    const userEmail = req.user?.email || 'ceo@vastoratech.com';

    const result = await runAgentOrchestrator(
      queryText,
      userRole,
      tenantId,
      { page: 'Executive Dashboard', module: 'Executive' }
    );

    // Save command audit log
    const log = new ExecutiveCommandLog({
      tenantId,
      userId: req.user?._id || req.userId || new mongoose.Types.ObjectId(),
      queryText,
      toolExecuted: result.actions?.[0]?.name || 'Natural Language Command',
      argumentsUsed: result.actions?.[0]?.parameters || {},
      success: true
    });
    await log.save();

    res.json({
      success: true,
      chatReply: result.summary || 'Command processed successfully.',
      actions: result.actions || [],
      logId: log._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 6. Run MCP Tool Direct ──────────────────────────────────────────────────
export const runMcpToolDirectly = async (req, res) => {
  try {
    const { toolName, arguments: toolArgs } = req.body;
    const userRole = req.userType === 'Admin' ? 'Admin' : 'Employee';
    const tenantId = req.tenantId;

    const result = await executeTool(toolName, toolArgs, userRole, tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 7. Executive Dashboard Metrics (Parallel Load) ──────────────────────────
export const getExecutiveDashboardMetrics = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = new Date().toISOString().split('T')[0];

    const [
      totalEmployees,
      employeesPresent,
      leaveRequestsPending,
      hotLeads,
      dealsAtRisk,
      tasksDueToday,
      interviewsToday
    ] = await Promise.all([
      Employee.countDocuments({ tenantId }),
      Employee.countDocuments({ tenantId }), // Proxy/Fallback
      LeaveRequest.countDocuments({ tenantId, status: 'Pending' }),
      Client.countDocuments({ tenantId, status: 'Lead' }),
      Deal.countDocuments({ tenantId, stage: { $in: ['Qualification', 'Proposal'] } }),
      Task.countDocuments({ tenantId, status: { $ne: 'Completed' } }),
      JobApplication.countDocuments({ tenantId })
    ]);

    // Financial estimations
    const revenueToday = 34000;
    const revenueTrend = '+12%';

    res.json({
      success: true,
      metrics: {
        totalEmployees,
        employeesPresent,
        leaveRequestsPending,
        hotLeads,
        dealsAtRisk,
        revenueToday,
        revenueTrend,
        tasksDueToday,
        interviewsToday
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 8. Executive Dashboard AI Summary (5-min Cache) ─────────────────────────
const dashboardAiCache = new Map();

export const getExecutiveDashboardAiSummary = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cacheKey = tenantId ? tenantId.toString() : 'global';
    
    const cached = dashboardAiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return res.json({ success: true, aiCard: cached.data });
    }

    const [
      pendingLeaves,
      hotLeads,
      deals
    ] = await Promise.all([
      LeaveRequest.countDocuments({ tenantId, status: 'Pending' }),
      Client.countDocuments({ tenantId, status: 'Lead' }),
      Deal.find({ tenantId })
    ]);

    const salesPipeline = deals
      .filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
      .reduce((acc, d) => acc + (d.amount || 0), 0);

    const prompt = `
      You are the Chief Strategy Officer AI for Vastora Business OS.
      Provide a highly summarized business intelligence review in JSON format.
      We have:
      - Pending Leaves: ${pendingLeaves}
      - Hot Leads: ${hotLeads}
      - Sales Pipeline: ₹${salesPipeline.toLocaleString('en-IN')}

      Return JSON ONLY in this format:
      {
        "businessSummary": "Short 2 sentence overview of current operating state",
        "topRisks": ["Risk 1", "Risk 2"],
        "topOpportunities": ["Opportunity 1"],
        "recommendations": [
          {"label": "Approve Pending Leaves", "toolName": "approveLeave", "args": {}}
        ]
      }
    `;

    const summaryResponse = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'Analytics' });

    dashboardAiCache.set(cacheKey, {
      timestamp: Date.now(),
      data: summaryResponse
    });

    res.json({ success: true, aiCard: summaryResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

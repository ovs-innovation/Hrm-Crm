import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Call from '../models/Call.js';
import KnowledgeDoc from '../models/KnowledgeDoc.js';
import Workflow from '../models/Workflow.js';
import JobApplication from '../models/JobApplication.js';
import AuditLog from '../models/AuditLog.js';
import Activity from '../models/Activity.js';
import AILog from '../models/AILog.js';
import { validateMongoQuery } from '../utils/queryValidator.js';

import * as aiService from '../services/ai.service.js';
import * as vectorService from '../services/vector.service.js';
import * as aiProvider from '../services/aiProvider.service.js';
import * as mcpService from '../services/mcp.service.js';
import { callLLM } from '../services/llm.service.js';

// Dynamic import wrappers to prevent server boot crashes if offline installation failed
async function getPdfParser() {
  try {
    const mod = await import('pdf-parse');
    
    // Modern ES class-based parser wrapper
    if (mod.PDFParse) {
      return async (buffer) => {
        const parser = new mod.PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        return {
          text: result.text,
          pages: result.pages || [{ num: 1, text: result.text }]
        };
      };
    }
    
    // Classic function export fallback
    if (typeof mod.default === 'function') {
      return async (buffer) => {
        const data = await mod.default(buffer);
        return {
          text: data.text,
          pages: [{ num: 1, text: data.text }]
        };
      };
    }
    if (typeof mod === 'function') {
      return async (buffer) => {
        const data = await mod(buffer);
        return {
          text: data.text,
          pages: [{ num: 1, text: data.text }]
        };
      };
    }
    throw new Error('No valid PDFParse class or default function export found.');
  } catch (err) {
    throw new Error('The PDF processing module "pdf-parse" is not installed on this system. ' + err.message);
  }
}

async function getPdfKit() {
  try {
    const mod = await import('pdfkit');
    return mod.default;
  } catch (err) {
    throw new Error('The PDF generation module "pdfkit" is not installed on this system.');
  }
}

import * as aiAgentsService from '../services/aiAgents.service.js';
import Memory from '../models/Memory.js';
import Learning from '../models/Learning.js';
import Ticket from '../models/Ticket.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

/**
 * AI Agent Command Palette / Chatbot receptionist tool executor
 */
export const executeAgentCommand = async (req, res) => {
  try {
    const { userInput, context: clientContext } = req.body;
    // Prefer Admin userType over employee role strings; never default to Admin
    const userRole = req.userType === 'Admin'
      ? (req.user?.role || 'Admin')
      : (req.user?.role || 'Employee');
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ message: 'Authenticated user email required' });
    }

    if (!userInput) {
      return res.status(400).json({ message: 'userInput is required' });
    }

    // 1. Gather Database details of selected entities in the context
    const businessContext = {
      tenantId: req.tenantId,
      companyName: req.tenant?.companyName || 'Vastora Tech',
      userRole,
      userEmail,
      page: clientContext?.page || 'Dashboard',
      module: clientContext?.module || 'Dashboard',
      filters: clientContext?.filters || {}
    };

    if (clientContext?.selectedEmployeeId) {
      businessContext.employee = await Employee.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(clientContext.selectedEmployeeId) ? clientContext.selectedEmployeeId : null },
          { employeeId: clientContext.selectedEmployeeId }
        ]
      });
    }

    if (clientContext?.selectedLeadId && mongoose.isValidObjectId(clientContext.selectedLeadId)) {
      businessContext.lead = await Client.findById(clientContext.selectedLeadId);
    }

    if (clientContext?.selectedDealId && mongoose.isValidObjectId(clientContext.selectedDealId)) {
      businessContext.deal = await Deal.findById(clientContext.selectedDealId);
    }

    // 2. Fetch Relevant Memories (scopeless or matching the module)
    const memories = await Memory.find({
      tenantId: req.tenantId,
      $or: [
        { scope: 'Global' },
        { scope: clientContext?.module },
        { userId: userEmail }
      ]
    }).limit(10);

    // 3. Fetch previous AILogs (previous conversation context)
    const prevLogs = await AILog.find({
      tenantId: req.tenantId,
      user: userEmail,
      status: 'Success'
    }).sort({ createdAt: -1 }).limit(5);

    // 5. Run runAgentOrchestrator (Planner -> Router -> Executor -> Reflection Loop)
    const orchestratorResult = await aiAgentsService.runAgentOrchestrator(
      userInput,
      userRole,
      req.tenantId,
      businessContext,
      memories,
      prevLogs
    );

    res.json({
      userInput,
      ...orchestratorResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * AI Duplicate Lead Detection (Fuzzy matching)
 */
export const detectDuplicateLeads = async (req, res) => {
  try {
    const leads = await Client.find({ status: 'Lead' });
    const duplicates = [];

    // Simple duplicate scanning using exact phone, exact email, or matching email prefix
    for (let i = 0; i < leads.length; i++) {
      for (let j = i + 1; j < leads.length; j++) {
        const leadA = leads[i];
        const leadB = leads[j];
        
        const matchingEmail = leadA.email && leadB.email && leadA.email.toLowerCase() === leadB.email.toLowerCase();
        const matchingPhone = leadA.phone && leadB.phone && leadA.phone.replace(/[^0-9]/g, '') === leadB.phone.replace(/[^0-9]/g, '');
        const matchingName = leadA.name && leadB.name && leadA.name.toLowerCase().trim() === leadB.name.toLowerCase().trim();

        if (matchingEmail || matchingPhone || matchingName) {
          duplicates.push({
            leadA: { _id: leadA._id, name: leadA.name, email: leadA.email, phone: leadA.phone, company: leadA.company },
            leadB: { _id: leadB._id, name: leadB.name, email: leadB.email, phone: leadB.phone, company: leadB.company },
            reason: matchingEmail ? 'Matching email address' : matchingPhone ? 'Matching phone number' : 'Identical full name'
          });
        }
      }
    }

    res.json({ count: duplicates.length, duplicates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Merge duplicate leads
 */
export const mergeDuplicateLeads = async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    if (!primaryId || !secondaryId) {
      return res.status(400).json({ message: 'primaryId and secondaryId are required' });
    }

    const primaryLead = await Client.findById(primaryId);
    const secondaryLead = await Client.findById(secondaryId);

    if (!primaryLead || !secondaryLead) {
      return res.status(404).json({ message: 'Primary or secondary lead not found' });
    }

    // Move Deals to primary lead
    await Deal.updateMany({ client: secondaryLead._id }, { client: primaryLead._id, clientName: primaryLead.name });

    // Move Invoices to primary lead
    await Invoice.updateMany({ client: secondaryLead._id }, { client: primaryLead._id, clientName: primaryLead.name });

    // Combine notes
    if (secondaryLead.notes) {
      primaryLead.notes = `${primaryLead.notes || ''}\n[Merged Notes from Duplicate]: ${secondaryLead.notes}`;
      await primaryLead.save();
    }

    // Remove secondary duplicate
    await Client.findByIdAndDelete(secondaryLead._id);

    res.json({ message: `Successfully merged duplicate lead ${secondaryLead.name} into ${primaryLead.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * AI Geolocation & Device Fake Fraud Detection
 */
export const detectAttendanceFraud = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecords = await Attendance.find({ date: today }).populate('employeeId', 'name employeeId');
    const alerts = [];

    // Office central coordinates check
    const OFFICE_LAT = 28.582078;
    const OFFICE_LON = 77.365970;
    const MAX_ALLOWED_DISTANCE = 200; // meters

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const rad = Math.PI / 180;
      const dLat = (lat2 - lat1) * rad;
      const dLon = (lon2 - lon1) * rad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    for (const record of attendanceRecords) {
      if (record.workMode !== 'Office') continue;

      let distance = typeof record.distanceFromOffice === 'number' ? record.distanceFromOffice : null;
      if (distance == null && typeof record.latitude === 'number' && typeof record.longitude === 'number') {
        distance = calculateDistance(OFFICE_LAT, OFFICE_LON, record.latitude, record.longitude);
      }
      if (distance == null) continue;

      if (distance > MAX_ALLOWED_DISTANCE) {
        alerts.push({
          employee: record.employeeId?.name,
          employeeId: record.employeeId?.employeeId,
          date: record.date,
          status: record.status,
          type: 'GPS Geofence Breach',
          details: `Employee checked in in 'Office' mode but GPS is ${Math.round(distance)}m from office center (max ${MAX_ALLOWED_DISTANCE}m).`,
          risk: distance > 1000 ? 'High' : 'Medium',
          distanceMeters: Math.round(distance),
        });
      }
    }

    res.json({ count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * AI Activity & Audit Timeline Compiler
 */
export const getEmployeeTimeline = async (req, res) => {
  try {
    const { id } = req.params; // Employee employeeId or ObjectId
    
    const employee = await Employee.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { employeeId: id }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Collect Audits & Activities
    const [audits, activities] = await Promise.all([
      AuditLog.find({ userId: employee.employeeId }).sort({ createdAt: -1 }).limit(10),
      Activity.find({ entityId: employee._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Format together
    const timeline = [];
    
    audits.forEach(a => {
      timeline.push({
        title: a.action,
        type: 'Audit Log',
        date: a.createdAt,
        details: `Modified module: ${a.module}. Entity Label: ${a.entityLabel || 'N/A'}`
      });
    });

    activities.forEach(ac => {
      timeline.push({
        title: ac.title,
        type: ac.type,
        date: ac.createdAt,
        details: ac.body || 'System activity record.'
      });
    });

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ employeeName: employee.name, timeline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 1: Get AI Dashboard Insights
 */
export const getDashboardInsights = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Gather metrics
    const [
      totalEmployees,
      attendanceToday,
      totalLeads,
      totalDeals,
      topPerformersRaw,
      employeesAbsentRaw,
      upcomingMeetings,
      birthdaysThisMonth
    ] = await Promise.all([
      Employee.countDocuments(),
      Attendance.find({ date: today }).populate('employeeId', 'name'),
      Client.countDocuments({ status: 'Lead' }),
      Deal.find().sort({ amount: -1 }).limit(5),
      Task.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),
      Employee.find().select('name employeeId'),
      Meeting.find({
        scheduledAt: { $gte: new Date() }
      }).limit(5),
      Employee.find({
        dateOfBirth: { $regex: new RegExp(`-${new Date().getMonth() + 1}-`, 'i') }
      }).limit(5)
    ]);

    const checkedInIds = new Set(attendanceToday.map(a => a.employeeId?._id?.toString()));
    const employeesAbsent = employeesAbsentRaw
      .filter(emp => !checkedInIds.has(emp._id.toString()))
      .slice(0, 5)
      .map(emp => emp.name);

    const topPerformers = [];
    for (const p of topPerformersRaw) {
      const emp = await Employee.findOne({ employeeId: p._id });
      if (emp) topPerformers.push(`${emp.name} (${p.count} tasks completed)`);
    }

    const salesStats = totalDeals.map(d => ({ title: d.title, amount: d.amount, stage: d.stage }));
    const attendanceSummary = {
      presentCount: attendanceToday.length,
      absentCount: employeesAbsent.length,
      totalCount: totalEmployees
    };

    const stats = {
      attendanceToday: attendanceSummary,
      salesStats,
      leadsStats: { totalLeads },
      topPerformers,
      employeesAbsent,
      upcomingEvents: {
        meetingsCount: upcomingMeetings.length,
        birthdaysCount: birthdaysThisMonth.length
      }
    };

    const insights = await aiService.generateDashboardInsights(stats);
    res.json({ stats, insights });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 2: Natural Language Search Query Router
 */
export const naturalLanguageSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const translation = await aiService.translateNaturalLanguageQuery(query);
    const { collection, query: filterQuery, sort, limit, explanation } = translation;

    const modelToCollection = {
      'Employee': 'employees',
      'Client': 'clients',
      'Deal': 'deals',
      'Invoice': 'invoices',
      'LeaveRequest': 'attendance',
      'Task': 'tasks'
    };

    const colName = modelToCollection[collection];
    if (!colName) {
      return res.status(400).json({
        message: `Query resolved to unauthorized collection: ${collection}`,
        explanation
      });
    }

    // Secure Whitelist Operator Validation
    try {
      validateMongoQuery(colName, filterQuery);
    } catch (err) {
      return res.status(403).json({
        message: 'Security Block: Unsafe operators or unauthorized query detected.',
        error: err.message
      });
    }

    const Model = mongoose.model(collection);
    
    let mongoQuery = Model.find(filterQuery);
    if (sort) mongoQuery = mongoQuery.sort(sort);
    if (limit) mongoQuery = mongoQuery.limit(limit);

    const results = await mongoQuery.exec();

    res.json({
      query,
      collection,
      filter: filterQuery,
      explanation,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 3: Get AI Employee Profile Insights
 */
const employeeInsightsCache = new Map();

export const getEmployeeInsights = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { employeeId: id }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const cacheKey = `${employee._id}_${employee.updatedAt ? employee.updatedAt.getTime() : '0'}`;
    if (employeeInsightsCache.has(cacheKey)) {
      return res.json({ employeeName: employee.name, insights: employeeInsightsCache.get(cacheKey) });
    }

    const [attendance, tasks] = await Promise.all([
      Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(15),
      Task.find({ assignedTo: employee.employeeId }).sort({ dueDate: -1 }).limit(10)
    ]);

    const insights = await aiService.generateEmployeeInsights(employee, attendance, tasks);
    employeeInsightsCache.set(cacheKey, insights);

    res.json({ employeeName: employee.name, insights });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 4: Upload Resume PDF and parse/score it
 */
export const parseResumePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume PDF file is required' });
    }
    const { jobDescription } = req.body;

    const pdfParse = await getPdfParser();
    const parsedData = await pdfParse(req.file.buffer);
    const resumeText = parsedData.text;

    const parsedResume = await aiService.parseResume(resumeText, jobDescription);
    res.json(parsedResume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 5: Calculate Smart Lead Score
 */
export const getLeadScore = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Client.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const [deals, calls] = await Promise.all([
      Deal.find({ client: lead._id }),
      Call.find({ client: lead._id }).limit(10)
    ]);

    const scoring = await aiService.scoreLead(lead, deals, calls);
    res.json(scoring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 6: AI Email Writer
 */
export const writeLeadEmail = async (req, res) => {
  try {
    const { leadName, emailType, instructions, tone } = req.body;
    if (!leadName || !emailType) {
      return res.status(400).json({ message: 'leadName and emailType are required' });
    }
    const email = await aiService.writeEmail(leadName, emailType, instructions, tone);
    res.json({ email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 7: Generate AI WhatsApp Reply
 */
export const writeWhatsAppReply = async (req, res) => {
  try {
    const { customerMessage, history, tone } = req.body;
    if (!customerMessage) {
      return res.status(400).json({ message: 'customerMessage is required' });
    }
    const reply = await aiService.generateWhatsAppReply(customerMessage, history || [], tone);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 8: AI Document Generator (PDF Exporter)
 */
export const generateDocumentPdf = async (req, res) => {
  try {
    const { templateName, content, placeholders } = req.body;
    if (!templateName || !content) {
      return res.status(400).json({ message: 'templateName and content are required' });
    }

    let finalContent = content;
    if (placeholders) {
      Object.entries(placeholders).forEach(([key, val]) => {
        finalContent = finalContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
        finalContent = finalContent.replace(new RegExp(`\\[${key}\\]`, 'g'), val);
      });
    }

    const PDFDocument = await getPdfKit();
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${templateName.replace(/\s+/g, '_')}.pdf"`);
    
    doc.pipe(res);

    doc.fillColor('#1E293B').fontSize(24).font('Helvetica-Bold').text(templateName.toUpperCase(), { align: 'center' });
    doc.moveDown(1.5);
    
    doc.strokeColor('#E2E8F0').lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(2);

    doc.fillColor('#334155').fontSize(12).font('Helvetica').text(finalContent, {
      align: 'justify',
      lineGap: 6
    });

    doc.moveDown(4);

    doc.fontSize(12).text('Sincerely,', { align: 'left' });
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').text('Vastora Operations Desk', { align: 'left' });
    doc.font('Helvetica').fontSize(10).text('Authorized Representative', { align: 'left' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 9: Meeting Summary
 */
export const generateMeetingSummary = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: 'Meeting transcript is required' });
    }
    const summary = await aiService.summarizeMeeting(transcript);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 10: AI Report summaries
 */
export const getReportSummary = async (req, res) => {
  try {
    const { reportType } = req.params;
    
    const [totalDealsClosed, salesAgg, attendanceAgg, tasksCompleted] = await Promise.all([
      Deal.countDocuments({ stage: 'Closed Won' }),
      Deal.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Attendance.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $regexMatch: { input: '$status', regex: /Present|Completed|Late/i } }, 1, 0] } } } },
      ]),
      Task.countDocuments({ status: 'Completed' }),
    ]);
    const att = attendanceAgg[0];
    const averageAttendance = att?.total
      ? Math.round((att.present / att.total) * 100)
      : null;

    const stats = {
      totalDealsClosed,
      salesSum: salesAgg,
      averageAttendance,
      tasksCompleted,
    };

    const reportContent = await aiService.generateReportSummary(reportType, stats);
    res.json({
      title: `${reportType} Business Health Report`,
      metrics: stats,
      summaryMarkdown: reportContent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 11: RAG Knowledge Base Upload
 */
export const uploadKnowledgeDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF document file is required' });
    }
    const { title, category } = req.body;

    const pdfParse = await getPdfParser();
    const parsed = await pdfParse(req.file.buffer);

    const chunks = [];
    const size = 600;
    
    // Chunk page-by-page to preserve citations
    for (const page of parsed.pages) {
      const pageText = page.text;
      const pageNum = page.num;
      for (let i = 0; i < pageText.length; i += size) {
        const chunkText = pageText.slice(i, i + size).trim();
        if (chunkText.length > 50) {
          const embedding = await vectorService.generateEmbedding(chunkText);
          chunks.push({
            text: chunkText,
            embedding,
            pageNumber: pageNum,
            metadata: {
              document: title || req.file.originalname,
              page: String(pageNum),
              category: category || 'General Policy'
            }
          });
        }
      }
    }

    const doc = new KnowledgeDoc({
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      category: category || 'General Policy',
      chunks,
      tenantId: req.tenantId
    });

    await doc.save();
    res.status(201).json({ message: 'Knowledge document loaded and indexed', chunksCount: chunks.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 11: RAG Knowledge Base Query
 */
export const queryKnowledgeBase = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const docs = await KnowledgeDoc.find({ tenantId: req.tenantId });
    
    const allChunks = [];
    docs.forEach(doc => {
      doc.chunks.forEach(chunk => {
        allChunks.push({
          id: chunk._id.toString(),
          title: doc.title,
          text: chunk.text,
          embedding: chunk.embedding,
          pageNumber: chunk.pageNumber,
          metadata: chunk.metadata
        });
      });
    });

    if (allChunks.length === 0) {
      return res.json({
        answer: 'No knowledge base documents uploaded yet. Please upload policy documents first.',
        sources: []
      });
    }

    const matches = await vectorService.searchVectorDatabase(question, allChunks, 3);
    const answer = await aiService.answerFromKnowledgeBase(question, matches);
    
    res.json({
      question,
      answer,
      sources: matches.map(m => ({ 
        title: m.title, 
        pageNumber: m.pageNumber || 1, 
        metadata: m.metadata || {},
        score: m.similarity 
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 13: Save visual workflow builder automation
 */
export const saveWorkflow = async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Workflow name is required' });
    }

    const workflow = new Workflow({ name, description, nodes, edges });
    await workflow.save();
    res.status(201).json({ message: 'Automation workflow saved successfully', workflow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 14: Forecast Sales & Attrition
 */
export const getForecasts = async (req, res) => {
  try {
    const { type } = req.params;
    
    let historicalData = [];
    if (type === 'Sales') {
      historicalData = await Deal.find({ stage: 'Closed Won' }).limit(20).select('amount expectedCloseDate');
    } else if (type === 'Payroll') {
      historicalData = await Employee.find().limit(20).select('joinDate department');
    } else {
      historicalData = await Task.find().limit(20).select('status assignedTo dueDate');
    }

    const forecast = await aiService.predictForecast(type, historicalData);
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 15: Voice commands intents
 */
export const processVoiceCommand = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: 'Transcript text is required' });
    }
    const response = await aiService.processVoiceCommand(transcript);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 16: OCR form extract
 */
export const ocrFormExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Identity document file is required' });
    }
    const { documentType } = req.body;

    const pdfParse = await getPdfParser();
    const parsed = await pdfParse(req.file.buffer);
    const extractedText = parsed.text;

    const parsedProfile = await aiService.extractOcrData(extractedText, documentType || 'Identity Document');
    res.json(parsedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 17: Candidate ranking
 */
export const rankJobApplicants = async (req, res) => {
  try {
    const { jobRequirements } = req.body;
    const applications = await JobApplication.find().limit(10).select('name email phone coverLetter status');
    
    if (applications.length === 0) {
      return res.json({ rankings: [] });
    }

    const rankings = await aiService.rankCandidates(applications, jobRequirements || 'General Engineer requirements');
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Module 18: Sales Coach Insights
 */
export const getSalesCoach = async (req, res) => {
  try {
    const [deals, calls] = await Promise.all([
      Deal.find().limit(20),
      Call.find().limit(20)
    ]);
    const coach = await aiService.getSalesCoachInsights(deals, calls);
    res.json(coach);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Audit: Retrieve AI request transactions list
 */
export const getAiLogs = async (req, res) => {
  try {
    const logs = await AILog.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Analytics: Compile AI daily/monthly requests count and cost logs
 */
export const getAiStats = async (req, res) => {
  try {
    const logs = await AILog.find({ tenantId: req.tenantId });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let todayCount = 0;
    let todayCost = 0;
    let monthlyCost = 0;
    const modules = {};

    logs.forEach(log => {
      const logDate = new Date(log.createdAt);
      if (logDate >= today) {
        todayCount++;
        todayCost += log.costUSD || 0;
      }
      if (logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear()) {
        monthlyCost += log.costUSD || 0;
      }
      
      const mod = log.module || 'General';
      modules[mod] = (modules[mod] || 0) + 1;
    });

    res.json({
      todayCount,
      todayCost: Number(todayCost.toFixed(5)),
      monthlyCost: Number(monthlyCost.toFixed(5)),
      modules,
      totalRequests: logs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAiHealth = async (req, res) => {
  try {
    const health = await aiProvider.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** HR Letter Generator (offer, experience, warning, termination) */
export const generateHrLetterHandler = async (req, res) => {
  try {
    const { letterType, employeeData, additionalContext } = req.body;
    if (!letterType || !employeeData) return res.status(400).json({ message: 'letterType and employeeData are required.' });
    const letter = await aiService.generateHrLetter(letterType, employeeData, additionalContext);
    res.json({ letter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Employee Performance Summary */
export const generatePerformanceSummaryHandler = async (req, res) => {
  try {
    const { employee, kpiData, reviewPeriod } = req.body;
    if (!employee) return res.status(400).json({ message: 'employee data is required.' });
    const result = await aiService.generatePerformanceSummary(employee, kpiData || {}, reviewPeriod || 'Q1 2025');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Attendance & Leave Analysis */
export const analyzeAttendanceLeaveHandler = async (req, res) => {
  try {
    const { employeeId, attendanceData, leaveData } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required.' });
    const result = await aiService.analyzeAttendanceLeave(employeeId, attendanceData || [], leaveData || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Notes Summarizer */
export const summarizeNotesHandler = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ message: 'notes content is required.' });
    const result = await aiService.summarizeNotes(notes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Follow-up Suggestions */
export const suggestFollowUpsHandler = async (req, res) => {
  try {
    const { lead, lastInteraction, dealStage } = req.body;
    if (!lead) return res.status(400).json({ message: 'lead data is required.' });
    const result = await aiService.suggestFollowUps(lead, lastInteraction || {}, dealStage || 'Qualification');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Proposal Generator */
export const generateProposalHandler = async (req, res) => {
  try {
    const { clientData, dealData, productDetails } = req.body;
    if (!clientData || !dealData) return res.status(400).json({ message: 'clientData and dealData are required.' });
    const proposal = await aiService.generateProposal(clientData, dealData, productDetails || {});
    res.json({ proposal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Workflow Suggestions */
export const suggestWorkflowsHandler = async (req, res) => {
  try {
    const { moduleType, currentProcessDescription } = req.body;
    if (!moduleType) return res.status(400).json({ message: 'moduleType is required.' });
    const result = await aiService.suggestWorkflows(moduleType, currentProcessDescription || '');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create custom memory entry
 */
export const createMemory = async (req, res) => {
  try {
    const { key, content, scope } = req.body;
    const memory = new Memory({
      key,
      content,
      scope: scope || 'Global',
      tenantId: req.tenantId,
      userId: req.user?.email || 'System'
    });
    await memory.save();
    res.status(201).json(memory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get memories for active tenant
 */
export const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find({ tenantId: req.tenantId });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete memory
 */
export const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    await Memory.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Proactive Automation Suggestions
 */
export const getAutomationSuggestions = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Scan overdue invoices
    const overdueInvoices = await Invoice.find().limit(10); // Find actual entries if any

    // Scan stuck deals
    const stuckDeals = await Deal.find({ stage: { $in: ['Qualification', 'Proposal'] } }).limit(5);

    // Scan attendance anomalies
    const today = new Date().toISOString().split('T')[0];
    const absentRecords = await Attendance.find({ status: 'Absent' }).populate('employeeId', 'name employeeId').limit(5);

    const lowLeaves = await Employee.find().limit(5); 

    const prompt = `Analyze current system metrics and return 3-5 smart automation recommendations:
    - Overdue Invoices: ${JSON.stringify(overdueInvoices.map(i => ({ number: i.number, total: i.total, dueDate: i.dueDate })))}
    - Stuck Deals: ${JSON.stringify(stuckDeals.map(d => ({ title: d.title, amount: d.amount, stage: d.stage })))}
    - Absences: ${JSON.stringify(absentRecords.map(a => ({ name: a.employeeId?.name || 'Unknown', date: a.date })))}
    
    For each issue:
    1. Detail the problem.
    2. Give the business impact.
    3. Propose a next action (e.g. Warning letter, follow-up, notification).
    4. Provide recommendations on how to resolve.
    `;
    
    const response = await aiAgentsService.runAgentTask('Analytics', prompt, { tenantId, companyName: req.tenant?.companyName });
    res.json({ suggestions: response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Predictive Insights
 */
export const getPredictiveInsights = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const [employees, deals, invoices] = await Promise.all([
      Employee.find().select('name joinDate department designation'),
      Deal.find().select('title amount stage expectedCloseDate'),
      Invoice.find().select('status total dueDate')
    ]);

    const prompt = `Analyze historical record trends and output forecasts in JSON format.
    Employees: ${JSON.stringify(employees.slice(0, 10))}
    Deals: ${JSON.stringify(deals.slice(0, 10))}
    Invoices: ${JSON.stringify(invoices.slice(0, 10))}

    Generate predictions for:
    1. Employee attrition risk (which employees might resign).
    2. Deals conversion probabilities (conversion likelihood).
    3. Future payroll cost prediction.
    4. Monthly revenue trend analysis.
    
    Return JSON only:
    {
      "attritionRisk": [{"employeeName": "string", "probability": number, "reason": "string"}],
      "dealConversion": [{"dealTitle": "string", "probability": number, "riskFactors": "string"}],
      "financialForecast": {"nextMonthPayroll": number, "expectedRevenue": number},
      "monthlyTrend": "string"
    }
    `;

    const response = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'Analytics' });
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Submit User Learning Feedback
 */
export const submitLearningFeedback = async (req, res) => {
  try {
    const { prompt, feedback, correctedResponse, status } = req.body;
    if (!prompt) return res.status(400).json({ message: 'prompt is required.' });

    const learning = new Learning({
      tenantId: req.tenantId,
      userId: req.user?.email || 'System',
      prompt,
      response: correctedResponse,
      status: status || 'Correction',
      feedback
    });
    await learning.save();
    res.status(201).json({ message: 'AI Brain successfully learned from user feedback.', learning });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fast, non-LLM page briefing for Context Copilot.
 * Returns live metrics + suggested prompts for the current route.
 */
export const getCopilotBriefing = async (req, res) => {
  try {
    const path = String(req.query.path || '/');
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const resolvePage = () => {
      if (path.includes('/crm/leads') || path.includes('/clients')) {
        return {
          key: 'leads',
          title: 'Accounts & Leads',
          module: 'CRM',
          prompts: [
            'Which leads went cold this week and what should I send?',
            'Draft a WhatsApp re-engagement for stale leads',
            'Find likely duplicate accounts and explain why',
          ],
        };
      }
      if (path.includes('/crm/deals') || path.includes('/deals')) {
        return {
          key: 'deals',
          title: 'Deals Pipeline',
          module: 'CRM',
          prompts: [
            'Which deals are at risk this month and why?',
            'Draft a negotiation email for the largest open deal',
            'Prioritize my follow-ups for today by revenue impact',
          ],
        };
      }
      if (path.includes('/invoices')) {
        return {
          key: 'invoices',
          title: 'Invoices',
          module: 'CRM',
          prompts: [
            'List overdue invoices and draft payment reminders',
            'Summarize collection risk this month',
            'Suggest next actions for unpaid invoices over 30 days',
          ],
        };
      }
      if (path.includes('/employees') || path.includes('/org-chart')) {
        return {
          key: 'employees',
          title: 'People',
          module: 'HRM',
          prompts: [
            'Who needs attention based on attendance and open tasks?',
            'Draft a performance check-in note for a manager',
            'Summarize headcount and open risks in People',
          ],
        };
      }
      if (path.includes('/attendance')) {
        return {
          key: 'attendance',
          title: 'Attendance',
          module: 'HRM',
          prompts: [
            'Flag unusual late patterns from today’s attendance',
            'Draft a polite reminder for repeated late arrivals',
            'Summarize present vs absent right now',
          ],
        };
      }
      if (path.includes('/leaves')) {
        return {
          key: 'leaves',
          title: 'Leaves',
          module: 'HRM',
          prompts: [
            'Which leave requests should be approved or declined first?',
            'Summarize coverage risk if pending leaves are approved',
            'Draft a leave policy clarification message',
          ],
        };
      }
      if (path.includes('/projects')) {
        return {
          key: 'projects',
          title: 'Projects',
          module: 'HRM',
          prompts: [
            'Which projects are slipping on deadline?',
            'Suggest team reallocations for overloaded projects',
            'Draft a weekly project status update for leadership',
          ],
        };
      }
      if (path.includes('/tickets')) {
        return {
          key: 'tickets',
          title: 'Support tickets',
          module: 'HRM',
          prompts: [
            'Triage open tickets by urgency',
            'Draft a customer reply for the oldest open ticket',
            'What themes keep repeating in support?',
          ],
        };
      }
      if (path.includes('/messenger')) {
        return {
          key: 'messenger',
          title: 'Messenger',
          module: 'General',
          prompts: [
            'Draft a professional WhatsApp follow-up for a client',
            'Summarize what I should reply to next',
            'Suggest a short internal standup update',
          ],
        };
      }
      if (path.includes('/payroll') || path.includes('/payslip')) {
        return {
          key: 'payroll',
          title: 'Payroll',
          module: 'HRM',
          prompts: [
            'What payroll checks should I run before release?',
            'Draft a payroll confirmation announcement',
            'Flag employees likely missing attendance for payroll',
          ],
        };
      }
      if (path.includes('/ai') || path.includes('/automation')) {
        return {
          key: 'ai',
          title: 'AI Hub',
          module: 'General',
          prompts: [
            'What AI actions create the most value this week?',
            'Suggest 3 automations based on our CRM + HR load',
            'Summarize recent AI usage and cost drivers',
          ],
        };
      }
      return {
        key: 'dashboard',
        title: 'Dashboard',
        module: 'General',
        prompts: [
          'What needs my attention in the next 2 hours?',
          'Summarize today’s business pulse in 5 bullets',
          'Give me the highest-ROI action right now',
        ],
      };
    };

    const page = resolvePage();

    const [
      employees,
      presentToday,
      leads,
      activeClients,
      deals,
      pipelineAgg,
      pendingLeaves,
      openTickets,
      activeProjects,
      overdueInvoices,
      recentAi,
      waOutbound,
    ] = await Promise.all([
      Employee.countDocuments(),
      Attendance.countDocuments({ date: today }),
      Client.countDocuments({ status: 'Lead' }),
      Client.countDocuments({ status: 'Active' }),
      Deal.countDocuments({ stage: { $nin: ['Closed Won', 'Closed Lost'] } }),
      Deal.aggregate([
        { $match: { stage: { $nin: ['Closed Won', 'Closed Lost'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Ticket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
      Project.countDocuments({ status: { $in: ['Active', 'Planning'] } }),
      Invoice.countDocuments({
        status: { $in: ['Overdue', 'Sent'] },
      }),
      AILog.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Message.countDocuments({ channel: 'whatsapp', createdAt: { $gte: startOfMonth } }),
    ]);

    const pipelineValue = pipelineAgg?.[0]?.total || 0;
    const openDeals = pipelineAgg?.[0]?.count || deals;

    const metricsByPage = {
      dashboard: [
        { label: 'Present today', value: presentToday, hint: `${employees || 0} people` },
        { label: 'Open pipeline', value: `₹${Number(pipelineValue).toLocaleString('en-IN')}`, hint: `${openDeals} deals` },
        { label: 'Open tickets', value: openTickets, hint: 'needs triage' },
        { label: 'Pending leaves', value: pendingLeaves, hint: 'approvals' },
      ],
      leads: [
        { label: 'Leads', value: leads, hint: 'in pipeline' },
        { label: 'Active accounts', value: activeClients, hint: 'customers' },
        { label: 'Open deals', value: openDeals, hint: 'linked CRM' },
      ],
      deals: [
        { label: 'Open deals', value: openDeals, hint: 'active stages' },
        { label: 'Pipeline value', value: `₹${Number(pipelineValue).toLocaleString('en-IN')}`, hint: 'weighted opportunity' },
        { label: 'Leads waiting', value: leads, hint: 'conversion fuel' },
      ],
      invoices: [
        { label: 'Collection risk', value: overdueInvoices, hint: 'aging invoices' },
        { label: 'Open deals', value: openDeals, hint: 'billing upcoming' },
      ],
      employees: [
        { label: 'Headcount', value: employees, hint: 'active roster' },
        { label: 'Present today', value: presentToday, hint: 'checked in' },
        { label: 'Pending leaves', value: pendingLeaves, hint: 'approvals' },
      ],
      attendance: [
        { label: 'Present', value: presentToday, hint: today },
        { label: 'Headcount', value: employees, hint: 'expected' },
        { label: 'Gap', value: Math.max(0, employees - presentToday), hint: 'not marked yet' },
      ],
      leaves: [
        { label: 'Pending approvals', value: pendingLeaves, hint: 'queue' },
        { label: 'Present today', value: presentToday, hint: 'coverage' },
      ],
      projects: [
        { label: 'Active projects', value: activeProjects, hint: 'in flight' },
        { label: 'Open tickets', value: openTickets, hint: 'delivery friction' },
      ],
      tickets: [
        { label: 'Open / in progress', value: openTickets, hint: 'queue' },
        { label: 'Headcount', value: employees, hint: 'support capacity' },
      ],
      messenger: [
        { label: 'WhatsApp msgs (mo)', value: waOutbound, hint: 'this month' },
        { label: 'Leads', value: leads, hint: 'outreach targets' },
      ],
      payroll: [
        { label: 'Employees', value: employees, hint: 'payroll base' },
        { label: 'Attendance today', value: presentToday, hint: 'verify before run' },
      ],
      ai: [
        { label: 'AI runs (mo)', value: recentAi, hint: 'this month' },
        { label: 'Open pipeline', value: `₹${Number(pipelineValue).toLocaleString('en-IN')}`, hint: 'where AI can help close' },
      ],
    };

    const metrics = metricsByPage[page.key] || metricsByPage.dashboard;

    const highlights = [];
    if (pendingLeaves > 0) highlights.push(`${pendingLeaves} leave request${pendingLeaves === 1 ? '' : 's'} waiting for approval`);
    if (openTickets > 0) highlights.push(`${openTickets} support ticket${openTickets === 1 ? '' : 's'} still open`);
    if (leads > 5) highlights.push(`${leads} leads in play — prioritize re-engagement`);
    if (employees > 0 && presentToday / employees < 0.7) {
      highlights.push(`Attendance looks light today (${presentToday}/${employees})`);
    }
    if (openDeals > 0) highlights.push(`₹${Number(pipelineValue).toLocaleString('en-IN')} sitting in open deals`);
    if (highlights.length === 0) highlights.push('No urgent blockers detected — ask me for a deep dive on this page.');

    res.json({
      path,
      page: page.title,
      module: page.module,
      key: page.key,
      metrics,
      highlights: highlights.slice(0, 4),
      prompts: page.prompts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clientTimelineCache = new Map();

export const getClientTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = id;

    // Check Cache
    const cached = clientTimelineCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return res.json({ success: true, ...cached.data });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client account not found' });
    }

    // Fetch related records in parallel
    const [deals, invoices, calls, meetings] = await Promise.all([
      Deal.find({ client: id }).sort({ createdAt: -1 }),
      Invoice.find({ client: id }).sort({ createdAt: -1 }),
      Call.find({ client: id }).sort({ calledAt: -1 }).limit(15),
      Meeting.find({ relatedId: id }).sort({ scheduledAt: -1 }).limit(15)
    ]);

    // Build timeline events array
    const events = [];

    deals.forEach(d => {
      events.push({
        type: 'Deal Created',
        date: d.createdAt,
        summary: `Pipeline Deal: "${d.title}" created. Amount: ₹${Number(d.amount).toLocaleString('en-IN')}. Stage: ${d.stage}`,
        owner: d.owner || 'Sales Rep',
        color: 'bg-brand'
      });
    });

    invoices.forEach(inv => {
      events.push({
        type: 'Invoice Generated',
        date: inv.createdAt,
        summary: `Invoice ${inv.number} generated for ₹${Number(inv.total).toLocaleString('en-IN')}. Status: ${inv.status}`,
        owner: 'Billing Dept',
        color: inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
      });
    });

    calls.forEach(c => {
      events.push({
        type: 'Call Logged',
        date: c.calledAt,
        summary: `${c.direction} Call completed. Duration: ${c.duration}s. Notes: ${c.notes || 'No notes'}`,
        owner: c.owner || 'Agent',
        color: 'bg-indigo-500'
      });
    });

    meetings.forEach(m => {
      events.push({
        type: 'Meeting Held',
        date: m.scheduledAt,
        summary: `Meeting: "${m.title}". Location: ${m.location || 'Vastora Virtual'}. Notes: ${m.notes || 'No notes'}`,
        owner: m.owner || 'Host',
        color: 'bg-purple-500'
      });
    });

    // Sort events chronologically descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate numeric insights
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + (i.total || 0), 0);
    const outstandingAmount = invoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + (i.total || 0), 0);

    const prompt = `
      You are the Lead Relationship Strategist AI for Vastora CRM.
      Analyze the CRM client account relationship for "${client.company}" (${client.name}).
      History:
      - Total Paid Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
      - Outstanding/Due Receivables: ₹${outstandingAmount.toLocaleString('en-IN')}
      - Active Deals Pipeline: ${deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length}
      - Interactions Logged: ${calls.length + meetings.length}

      Generate a structured client status summary in JSON format:
      {
        "healthScore": number (0-100 score reflecting active engagement),
        "trend": "up" | "down" | "stable",
        "reason": "Explain briefly why the health score was selected (e.g. overdue invoices or active recent meetings)",
        "relationshipSummary": "Short 2 sentence brief of the relationship status",
        "growthOpportunities": "Key upsell or partnership possibility",
        "riskAnalysis": "Critical risk factor (e.g. unpaid bills, lack of followups)",
        "nextBestAction": "The immediate next recommendation step for the account executive",
        "confidence": number (confidence rating from 0.8 to 1.0)
      }
    `;

    const aiSummary = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'CRM' });

    const resultData = {
      timeline: events,
      aiSummary,
      clientMetrics: {
        totalRevenue,
        outstandingAmount
      }
    };

    clientTimelineCache.set(cacheKey, {
      timestamp: Date.now(),
      data: resultData
    });

    res.json({
      success: true,
      ...resultData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



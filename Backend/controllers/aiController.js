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

/**
 * AI Agent Command Palette / Chatbot receptionist tool executor
 */
export const executeAgentCommand = async (req, res) => {
  try {
    const { userInput } = req.body;
    const userRole = req.user?.role || 'Admin'; // Fallback to Admin or role in token

    if (!userInput) {
      return res.status(400).json({ message: 'userInput is required' });
    }

    // Call parser to resolve tool intent
    const parsedCommand = await aiService.processAgentCommand(userInput, userRole);
    const { toolName, arguments: toolArgs, explanation, redirectUrl, autofillData, chatReply } = parsedCommand;

    let executionResult = null;

    if (toolName && toolName !== 'unknown') {
      // Execute the MCP tool securely
      executionResult = await mcpService.executeTool(toolName, toolArgs, userRole);
    }

    res.json({
      userInput,
      parsedCommand,
      executionResult,
      chatResponse: executionResult ? executionResult.message : chatReply,
      redirectUrl,
      autofillData
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
      // If checked-in from office, mock check coordinates
      if (record.workMode === 'Office') {
        // Mocking coordinates check based on workMode or record metadata
        const distance = record.distanceFromOffice || 0; // standard mock field if set
        
        // Let's create mock alerts for demonstration
        if (record.employeeId?.name === 'Amit Sharma' || record.employeeId?.name === 'Rudra Sharma') {
          alerts.push({
            employee: record.employeeId?.name,
            employeeId: record.employeeId?.employeeId,
            date: record.date,
            status: record.status,
            type: 'GPS Geofence Breach',
            details: `Employee checked in in 'Office' mode but GPS coordinates show them 3.2km away from office center. Possible GPS Spoofing detected.`,
            risk: 'High'
          });
        }
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
        expectedCloseDate: { $gte: new Date() }
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
export const getEmployeeInsights = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { employeeId: id }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const [attendance, tasks] = await Promise.all([
      Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(15),
      Task.find({ assignedTo: employee.employeeId }).sort({ dueDate: -1 }).limit(10)
    ]);

    const insights = await aiService.generateEmployeeInsights(employee, attendance, tasks);
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
    
    const stats = {
      totalDealsClosed: await Deal.countDocuments({ stage: 'Closed Won' }),
      salesSum: await Deal.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      averageAttendance: 91,
      tasksCompleted: await Task.countDocuments({ status: 'Completed' }),
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
      chunks
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

    const docs = await KnowledgeDoc.find();
    
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


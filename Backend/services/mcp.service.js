import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Payslip from '../models/Payslip.js';
import KnowledgeDoc from '../models/KnowledgeDoc.js';
import * as vectorService from './vector.service.js';

// Definitions of tools and their required roles
export const TOOLS_SCHEMA = [
  {
    name: 'approveLeave',
    description: 'Approve or reject a pending employee leave request.',
    requiredRole: 'Admin',
    parameters: {
      leaveId: 'string (ObjectId)',
      status: 'string ("Approved" or "Rejected")'
    }
  },
  {
    name: 'createTask',
    description: 'Create and assign a task to an employee.',
    requiredRole: 'Admin',
    parameters: {
      title: 'string',
      description: 'string',
      assignedTo: 'string (EMP ID e.g. #EMP0001)',
      dueDate: 'string (YYYY-MM-DD)'
    }
  },
  {
    name: 'createLead',
    description: 'Create a new client lead in the CRM.',
    requiredRole: 'Employee',
    parameters: {
      name: 'string',
      company: 'string',
      email: 'string',
      phone: 'string',
      notes: 'string'
    }
  },
  {
    name: 'getAttendanceToday',
    description: 'Retrieve the total present count and late mark statistics for today.',
    requiredRole: 'Employee',
    parameters: {}
  },
  {
    name: 'assignSalesperson',
    description: 'Assign a lead (client) to a sales owner.',
    requiredRole: 'Admin',
    parameters: {
      clientId: 'string (ObjectId)',
      salespersonName: 'string'
    }
  },
  {
    name: 'getEmployeeSalary',
    description: 'Securely look up the payslip details of an employee.',
    requiredRole: 'Admin',
    parameters: {
      employeeId: 'string (EMP ID)'
    }
  },
  {
    name: 'createEmployee',
    description: 'Register a new employee profile in the system.',
    requiredRole: 'Admin',
    parameters: {
      employeeId: 'string',
      name: 'string',
      email: 'string',
      department: 'string',
      designation: 'string',
      joinDate: 'string (YYYY-MM-DD)'
    }
  },
  {
    name: 'updateDeal',
    description: 'Update the pipeline stage or details of a sales deal.',
    requiredRole: 'Employee',
    parameters: {
      dealId: 'string (ObjectId)',
      stage: 'string ("Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost")',
      amount: 'number',
      notes: 'string'
    }
  },
  {
    name: 'generatePayroll',
    description: 'Create a payslip payroll entry for an employee.',
    requiredRole: 'Admin',
    parameters: {
      employeeId: 'string',
      employeeName: 'string',
      month: 'string (e.g. "July 2026")',
      basicSalary: 'number',
      allowances: 'number',
      deductions: 'number'
    }
  },
  {
    name: 'searchKnowledge',
    description: 'Query company documentations and policies using vector RAG.',
    requiredRole: 'Employee',
    parameters: {
      query: 'string'
    }
  },
  {
    name: 'sendEmail',
    description: 'Send a business email via configured SMTP. Fails closed if SMTP is not configured.',
    requiredRole: 'Employee',
    parameters: {
      to: 'string',
      subject: 'string',
      body: 'string'
    }
  },
  {
    name: 'sendWhatsapp',
    description: 'Send a WhatsApp message via configured provider API. Fails closed if WhatsApp is not configured.',
    requiredRole: 'Employee',
    parameters: {
      to: 'string',
      message: 'string'
    }
  },
  {
    name: 'createInvoice',
    description: 'Create a billing invoice for a client.',
    requiredRole: 'Admin',
    parameters: {
      number: 'string',
      client: 'string (ObjectId)',
      clientName: 'string',
      total: 'number',
      dueDate: 'string (YYYY-MM-DD)'
    }
  },
  {
    name: 'scheduleMeeting',
    description: 'Schedule a calendar meeting event.',
    requiredRole: 'Employee',
    parameters: {
      title: 'string',
      scheduledAt: 'string (ISO Date String)',
      duration: 'number (minutes)',
      location: 'string',
      notes: 'string'
    }
  },
  {
    name: 'createTicket',
    description: 'Register a new customer support ticket.',
    requiredRole: 'Employee',
    parameters: {
      title: 'string',
      description: 'string',
      category: 'string',
      priority: 'string',
      createdBy: 'string',
      createdByName: 'string'
    }
  }
];

/**
 * Execute a tool securely after checking permissions.
 */
export async function executeTool(toolName, args, userRole, tenantId) {
  // Find tool schema
  const schema = TOOLS_SCHEMA.find(t => t.name === toolName);
  if (!schema) {
    return { success: false, message: `Tool "${toolName}" is not registered in the MCP system.` };
  }

  // Security role check
  if (schema.requiredRole === 'Admin' && userRole !== 'Admin') {
    return { 
      success: false, 
      message: `Security Denied: Role "${userRole}" is unauthorized to run tool "${toolName}". This action requires Admin privileges.` 
    };
  }

  try {
    switch (toolName) {
      case 'approveLeave': {
        const { leaveId, status } = args;
        if (!leaveId || !status) {
          return { success: false, message: 'Missing parameters: leaveId and status are required.' };
        }
        const updated = await LeaveRequest.findByIdAndUpdate(
          leaveId,
          { status },
          { new: true }
        );
        if (!updated) return { success: false, message: `Leave request with ID ${leaveId} not found.` };
        return { 
          success: true, 
          message: `Successfully set leave request status to "${status}" for ${updated.employeeName}.`,
          data: updated 
        };
      }

      case 'createTask': {
        const { title, description, assignedTo, dueDate } = args;
        if (!title || !description || !assignedTo || !dueDate) {
          return { success: false, message: 'Missing parameters: title, description, assignedTo, and dueDate are required.' };
        }
        const task = new Task({
          title,
          description,
          assignedTo,
          dueDate,
          status: 'Pending'
        });
        await task.save();
        return { 
          success: true, 
          message: `Task "${title}" created and assigned to ${assignedTo}.`,
          data: task 
        };
      }

      case 'createLead': {
        const { name, company, email, phone, notes } = args;
        if (!name || !company || !email) {
          return { success: false, message: 'Missing parameters: name, company, and email are required.' };
        }
        const client = new Client({
          name,
          company,
          email,
          phone,
          notes,
          status: 'Lead'
        });
        await client.save();
        return { 
          success: true, 
          message: `Created lead for ${name} at ${company}.`,
          data: client 
        };
      }

      case 'createTicket': {
        const { title, description, category, priority, createdBy, createdByName } = args;
        const Ticket = (await import('../models/Ticket.js')).default;
        const ticket = new Ticket({
          title,
          description,
          category: category || 'General',
          priority: priority || 'Medium',
          status: 'Open',
          createdBy,
          createdByName
        });
        await ticket.save();
        return {
          success: true,
          message: `Support ticket #${ticket._id.toString().slice(-6)} created.`,
          data: ticket
        };
      }

      case 'getAttendanceToday': {
        const today = new Date().toISOString().split('T')[0];
        const present = await Attendance.countDocuments({ date: today });
        const late = await Attendance.countDocuments({ date: today, status: /late/i });
        return {
          success: true,
          message: `Today's attendance stats: ${present} employees present (${late} late marks).`,
          data: { date: today, present, late }
        };
      }

      case 'assignSalesperson': {
        const { clientId, salespersonName } = args;
        if (!clientId || !salespersonName) {
          return { success: false, message: 'Missing parameters: clientId and salespersonName are required.' };
        }
        const updated = await Client.findByIdAndUpdate(
          clientId,
          { notes: `Assigned sales owner: ${salespersonName}` },
          { new: true }
        );
        if (!updated) return { success: false, message: `Client Lead with ID ${clientId} not found.` };
        return {
          success: true,
          message: `Lead ${updated.name} has been assigned to sales owner: ${salespersonName}.`,
          data: updated
        };
      }

      case 'getEmployeeSalary': {
        const { employeeId } = args;
        if (!employeeId) {
          return { success: false, message: 'Missing parameters: employeeId is required.' };
        }
        const payslip = await Payslip.findOne({ employeeId }).sort({ createdAt: -1 });
        if (!payslip) {
          return { success: true, message: `No recent salary records found for employee: ${employeeId}.` };
        }
        return {
          success: true,
          message: `Retrieved payslip details for ${employeeId}. Net salary is ₹${payslip.netPay || payslip.netSalary || 0}.`,
          data: payslip
        };
      }

      case 'createEmployee': {
        const { employeeId, name, email, department, designation, joinDate } = args;
        if (!employeeId || !name || !email) {
          return { success: false, message: 'Missing parameters: employeeId, name, and email are required.' };
        }
        // Check duplicate
        const existing = await Employee.findOne({ $or: [{ employeeId }, { email }] });
        if (existing) return { success: false, message: `Employee already exists with this employeeId or email.` };

        const crypto = await import('crypto');
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const newEmp = new Employee({
          employeeId,
          name,
          email,
          password: tempPassword,
          department,
          designation,
          joinDate: joinDate || new Date().toISOString().split('T')[0]
        });
        await newEmp.save();
        // Password is hashed on save; do not return it. Use invite/set-password flow for access.
        return {
          success: true,
          message: `Employee ${name} (#${employeeId}) registered. Send an invite so they can set their own password.`,
          data: { _id: newEmp._id, employeeId: newEmp.employeeId, name: newEmp.name, email: newEmp.email }
        };
      }

      case 'updateDeal': {
        const { dealId, stage, amount, notes } = args;
        if (!dealId) return { success: false, message: 'Missing parameters: dealId is required.' };
        
        const updateFields = {};
        if (stage) updateFields.stage = stage;
        if (amount) updateFields.amount = amount;
        if (notes) updateFields.notes = notes;

        const updated = await Deal.findByIdAndUpdate(dealId, updateFields, { new: true });
        if (!updated) return { success: false, message: `Deal with ID ${dealId} not found.` };
        return {
          success: true,
          message: `Successfully updated deal "${updated.title}" stage to "${updated.stage}" (Amount: ${updated.amount}).`,
          data: updated
        };
      }

      case 'generatePayroll': {
        const { employeeId, employeeName, month, basicSalary, allowances, deductions } = args;
        if (!employeeId || !employeeName || !month) {
          return { success: false, message: 'Missing parameters: employeeId, employeeName, and month are required.' };
        }

        const basic = Number(basicSalary) || 0;
        const allow = Number(allowances) || 0;
        const deduct = Number(deductions) || 0;
        const net = basic + allow - deduct;

        // Check if payslip already exists for that month
        await Payslip.findOneAndDelete({ employeeId, month }).catch(() => {});

        const payslip = new Payslip({
          employeeId,
          employeeName,
          month,
          basicSalary: basic,
          allowances: allow,
          deductions: deduct,
          netPay: net,
          status: 'Draft'
        });
        await payslip.save();
        return {
          success: true,
          message: `Successfully generated payslip for ${employeeName} for ${month} (Net pay: ₹${net}).`,
          data: payslip
        };
      }

      case 'searchKnowledge': {
        const { query } = args;
        if (!query) return { success: false, message: 'Missing parameters: query is required.' };

        const docs = await KnowledgeDoc.find({ tenantId });
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
          return { success: true, message: 'No knowledge base documents uploaded for this company yet.', data: [] };
        }

        const matches = await vectorService.searchVectorDatabase(query, allChunks, 3);
        return {
          success: true,
          message: `Retrieved ${matches.length} matching sections from company files.`,
          data: matches.map(m => ({
            document: m.title,
            page: m.pageNumber || 1,
            excerpt: m.text,
            score: Number(m.similarity.toFixed(3))
          }))
        };
      }

      case 'sendEmail': {
        const { to, subject, body } = args;
        if (!to || !subject || !body) return { success: false, message: 'to, subject, and body are required.' };
        const { sendEmail } = await import('../utils/emailService.js');
        if (!process.env.SMTP_HOST) {
          return {
            success: false,
            message: 'Email not sent: SMTP_HOST is not configured. Configure SMTP to enable outbound email.',
            data: { to, subject, configured: false }
          };
        }
        const result = await sendEmail({ to, subject, html: body, text: body });
        return {
          success: true,
          message: `Email dispatched to ${to}.`,
          data: { to, subject, timestamp: new Date().toISOString(), result }
        };
      }

      case 'sendWhatsapp': {
        const { to, message } = args;
        if (!to || !message) return { success: false, message: 'to and message are required.' };
        if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
          return {
            success: false,
            message: 'WhatsApp not sent: WHATSAPP_API_URL / WHATSAPP_API_TOKEN are not configured.',
            data: { to, configured: false }
          };
        }
        const waRes = await fetch(process.env.WHATSAPP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          },
          body: JSON.stringify({ to, message }),
        });
        if (!waRes.ok) {
          const errBody = await waRes.text().catch(() => '');
          return { success: false, message: `WhatsApp provider error: HTTP ${waRes.status} ${errBody.slice(0, 200)}` };
        }
        return {
          success: true,
          message: `WhatsApp message dispatched to ${to}.`,
          data: { to, timestamp: new Date().toISOString() }
        };
      }

      case 'createInvoice': {
        const { number, client, clientName, total, dueDate } = args;
        if (!number || !client || !total) return { success: false, message: 'number, client, and total are required.' };
        
        const invoice = new Invoice({
          number,
          client,
          clientName: clientName || 'Unknown Client',
          total,
          dueDate: dueDate || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
          status: 'Draft'
        });
        await invoice.save();
        return {
          success: true,
          message: `Successfully created invoice #${number} for ${invoice.clientName} (Total: ₹${total}).`,
          data: invoice
        };
      }

      case 'scheduleMeeting': {
        const { title, scheduledAt, duration, location, notes } = args;
        if (!title || !scheduledAt) return { success: false, message: 'title and scheduledAt are required.' };

        const meeting = new Meeting({
          title,
          scheduledAt: new Date(scheduledAt),
          duration: Number(duration) || 30,
          location: location || 'Online Video Room',
          notes,
          status: 'Scheduled'
        });
        await meeting.save();
        return {
          success: true,
          message: `Successfully scheduled meeting "${title}" at ${scheduledAt}.`,
          data: meeting
        };
      }

      default:
        return { success: false, message: `Tool handler for "${toolName}" is not implemented.` };
    }
  } catch (err) {
    return { success: false, message: `Error executing tool: ${err.message}` };
  }
}

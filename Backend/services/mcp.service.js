import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Invoice from '../models/Invoice.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Payslip from '../models/Payslip.js';

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
    requiredRole: 'Employee', // both Employee and Admin can create leads
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
    requiredRole: 'Admin', // strictly Admin only!
    parameters: {
      employeeId: 'string (EMP ID)'
    }
  }
];

/**
 * Execute a tool securely after checking permissions.
 */
export async function executeTool(toolName, args, userRole) {
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
          { notes: `Assigned sales owner: ${salespersonName}` }, // mock assignment field
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
          message: `Retrieved payslip details for ${employeeId}. Net salary is ₹${payslip.netSalary || 0}.`,
          data: payslip
        };
      }

      default:
        return { success: false, message: `Tool handler for "${toolName}" is not implemented.` };
    }
  } catch (err) {
    return { success: false, message: `Error executing tool: ${err.message}` };
  }
}

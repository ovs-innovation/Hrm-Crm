import Task from '../models/Task.js';
import { logAudit } from '../utils/auditLogger.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import { createNotification } from '../utils/notify.js';
import { sendEmail, taskAssignedEmailHtml } from '../utils/emailService.js';

const STAFF_ROLES = new Set(['founder', 'owner', 'admin', 'hr', 'manager']);

const normalizeRole = (role) => String(role || '').toLowerCase().trim();

const isStaffUser = (req) => {
  if (req.userType === 'Admin') return true;
  return STAFF_ROLES.has(normalizeRole(req.user?.role));
};

/** Role used for department rules — always from session, never from client body. */
const resolveAssignerRole = (req) => {
  if (req.userType === 'Admin') {
    const r = normalizeRole(req.user?.role);
    return r || 'admin';
  }
  return normalizeRole(req.user?.role);
};

const resolveAssignedBy = (req) =>
  req.user?.name || req.user?.email || (req.userType === 'Admin' ? 'Admin' : 'System');

export const createTask = async (req, res) => {
  try {
    if (!isStaffUser(req)) {
      return res.status(403).json({ message: 'Only HR, managers, or admins can assign tasks.' });
    }

    const { title, description, assignedTo, dueDate, projectName, priority } = req.body;
    const assignerRole = resolveAssignerRole(req);
    const assignedBy = resolveAssignedBy(req);

    const employeeIds = Array.isArray(assignedTo) ? assignedTo.filter(Boolean) : [assignedTo].filter(Boolean);
    if (employeeIds.length === 0) {
      return res.status(400).json({ message: 'Must assign to at least one employee' });
    }

    const validObjectIds = employeeIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const queryConditions = [{ employeeId: { $in: employeeIds } }];
    if (validObjectIds.length > 0) {
      queryConditions.push({ _id: { $in: validObjectIds } });
    }

    const employees = await Employee.find({ $or: queryConditions });
    if (!employees.length) {
      return res.status(400).json({ message: 'No matching employees found for assignment.' });
    }

    for (const emp of employees) {
      const dept = (emp.department || '').toLowerCase().trim();
      const role = assignerRole;

      if (['founder', 'admin', 'owner'].includes(role) || req.userType === 'Admin') continue;

      const isEngineering = dept === 'software' || dept === 'engineering';

      if (role === 'manager' && !isEngineering) {
        return res.status(403).json({
          message: 'Manager can only assign tasks to the Software/Engineering department.',
        });
      }

      if (role === 'hr' && isEngineering) {
        return res.status(403).json({
          message: 'HR cannot assign tasks to the Software/Engineering department.',
        });
      }

      if (role !== 'manager' && role !== 'hr') {
        return res.status(403).json({
          message: `Your role (${assignerRole || 'Unknown'}) is not authorized to assign tasks.`,
        });
      }
    }

    const payloadBase = {
      title,
      description: description || '',
      projectName,
      assignedBy,
      dueDate,
      priority: priority || 'Medium',
      status: 'Pending',
    };

    const portalUrl = (process.env.EMPLOYEE_PORTAL_URL || 'http://localhost:5173').replace(/\/$/, '');
    const tasksLink = `${portalUrl}/tasks`;
    const created = [];

    for (const emp of employees) {
      const assigneeKey = emp.employeeId || String(emp._id);
      const task = await Task.create({ ...payloadBase, assignedTo: assigneeKey });
      created.push(task);

      try {
        await createNotification({
          userId: emp._id,
          userType: 'Employee',
          title: 'New task assigned',
          message: `${assignedBy} assigned “${title}”${dueDate ? ` · due ${dueDate}` : ''}. Open My tasks to view instructions.`,
          link: '/tasks',
          module: 'task',
          category: 'task',
        });
      } catch (notifyErr) {
        console.error('[task] notification failed', emp.email || assigneeKey, notifyErr.message);
      }

      if (emp.email) {
        try {
          await sendEmail({
            to: emp.email,
            subject: `New task assigned: ${title}`,
            html: taskAssignedEmailHtml({
              name: emp.name,
              title,
              description: description || '',
              dueDate,
              priority: payloadBase.priority,
              projectName,
              assignedBy,
              link: tasksLink,
            }),
            text: [
              `Hi ${emp.name || 'there'},`,
              `${assignedBy} assigned you a task: ${title}`,
              description ? `\nWhat to do:\n${description}` : '',
              dueDate ? `Due: ${dueDate}` : '',
              `Open: ${tasksLink}`,
            ].filter(Boolean).join('\n'),
          });
        } catch (mailErr) {
          console.error('[task] email failed', emp.email, mailErr.message);
        }
      }
    }

    await logAudit({
      req,
      action: 'CREATE',
      module: 'task',
      entityId: created[0]?._id,
      entityLabel: title,
    }).catch(() => {});

    return res.status(201).json(created.length === 1 ? created[0] : created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = {};

    if (isStaffUser(req)) {
      if (employeeId) query.assignedTo = employeeId;
    } else {
      const ownKeys = [req.user?.employeeId, req.user?._id?.toString?.(), req.user?._id]
        .filter(Boolean)
        .map(String);
      query.assignedTo = { $in: [...new Set(ownKeys)] };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(500);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, employeeComment, priority, progress } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!isStaffUser(req)) {
      const ownKeys = new Set(
        [req.user?.employeeId, req.user?._id?.toString?.(), String(req.user?._id || '')].filter(Boolean)
      );
      if (!ownKeys.has(String(task.assignedTo))) {
        return res.status(403).json({ message: 'You can only update your own tasks.' });
      }
    }

    const previousStatus = task.status;
    if (status) task.status = status;
    if (priority && isStaffUser(req)) task.priority = priority;
    if (progress !== undefined && progress !== '') task.progress = Number(progress);
    if (employeeComment !== undefined) task.employeeComment = employeeComment;

    const updatedTask = await task.save();
    await logAudit({
      req,
      action: 'UPDATE',
      module: 'task',
      entityId: updatedTask._id,
      entityLabel: updatedTask.title,
      changes: status && status !== previousStatus ? { status: { from: previousStatus, to: status } } : undefined,
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    if (!isStaffUser(req)) {
      return res.status(403).json({ message: 'Only HR, managers, or admins can delete tasks.' });
    }

    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await logAudit({ req, action: 'DELETE', module: 'task', entityId: task._id, entityLabel: task.title });
    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

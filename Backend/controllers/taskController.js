import Task from '../models/Task.js';
import { logAudit } from '../utils/auditLogger.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, assignedBy, dueDate, assignerRole, projectName, priority } = req.body;
    
    // Support for multiple assignees
    const employeeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    if (employeeIds.length === 0) return res.status(400).json({ message: 'Must assign to at least one employee' });

    // Prevent CastError by separating valid ObjectIds
    const validObjectIds = employeeIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const queryConditions = [ { employeeId: { $in: employeeIds } } ];
    if (validObjectIds.length > 0) {
      queryConditions.push({ _id: { $in: validObjectIds } });
    }

    // Fetch employees to check their departments
    const employees = await Employee.find({ $or: queryConditions });

    for (let emp of employees) {
      const dept = (emp.department || '').toLowerCase().trim();
      const role = (assignerRole || '').toLowerCase().trim();

      if (['founder', 'admin', 'owner'].includes(role)) continue;

      const isEngineering = dept === 'software' || dept === 'engineering';

      if (role === 'manager' && !isEngineering) {
        return res.status(403).json({ message: `Manager can only assign tasks to the Software/Engineering department.` });
      }

      if (role === 'hr' && isEngineering) {
        return res.status(403).json({ message: `HR cannot assign tasks to the Software/Engineering department.` });
      }

      if (role !== 'manager' && role !== 'hr') {
         return res.status(403).json({ message: `Your role (${assignerRole || 'Unknown'}) is not authorized to assign tasks.` });
      }
    }

    if (Array.isArray(assignedTo)) {
      const tasksToCreate = assignedTo.map(empId => ({
        title,
        description,
        projectName,
        assignedTo: empId,
        assignedBy,
        dueDate,
        priority: priority || 'Medium',
        status: 'Pending'
      }));

      const tasks = await Task.insertMany(tasksToCreate);
      return res.status(201).json(tasks);
    } else {
      const task = await Task.create({
        title,
        description,
        projectName,
        assignedTo,
        assignedBy,
        dueDate,
        priority: priority || 'Medium',
        status: 'Pending'
      });
      return res.status(201).json(task);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    let query = {};
    if (employeeId) {
      query.assignedTo = employeeId;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
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

    const previousStatus = task.status;
    if (status) task.status = status;
    if (priority) task.priority = priority;
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

import mongoose from 'mongoose';
import Project, { PROJECT_STATUSES, PROJECT_PRIORITIES } from '../models/Project.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Employee from '../models/Employee.js';

const toFiniteNumber = (value, { field = 'value', required = false, min = 0, max = 1_000_000_000_000 } = {}) => {
  if (value === '' || value === null || value === undefined) {
    if (required) {
      const err = new Error(`${field} is required`);
      err.status = 400;
      throw err;
    }
    return 0;
  }

  let n;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
      const err = new Error(`${field} must be a number`);
      err.status = 400;
      throw err;
    }
    n = Number(cleaned);
  } else {
    const err = new Error(`${field} must be a number`);
    err.status = 400;
    throw err;
  }

  if (!Number.isFinite(n)) {
    const err = new Error(`${field} must be a valid number`);
    err.status = 400;
    throw err;
  }
  if (n < min) {
    const err = new Error(`${field} must be ≥ ${min}`);
    err.status = 400;
    throw err;
  }
  if (n > max) {
    const err = new Error(`${field} is too large`);
    err.status = 400;
    throw err;
  }
  return n;
};

const toOptionalDate = (value, field) => {
  if (value === '' || value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`${field} must be a valid date`);
    err.status = 400;
    throw err;
  }
  return d;
};

const coerceBudgetForRead = (raw) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const digits = raw.replace(/[^0-9.]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const normalizePayload = async (body, { partial = false } = {}) => {
  const errors = [];
  const out = {};

  const nameRaw = body.name ?? body.title;
  if (!partial || nameRaw !== undefined) {
    const name = String(nameRaw || '').trim();
    if (!name) errors.push({ field: 'name', message: 'Project name is required' });
    else if (name.length > 120) errors.push({ field: 'name', message: 'Name must be ≤ 120 characters' });
    else out.name = name;
  }

  if (!partial || body.description !== undefined) {
    out.description = String(body.description || '').trim().slice(0, 2000);
    if (!partial && !out.description) {
      errors.push({ field: 'description', message: 'Description is required' });
    }
  }

  if (!partial || body.status !== undefined) {
    const status = body.status || 'Planning';
    if (!PROJECT_STATUSES.includes(status)) {
      errors.push({ field: 'status', message: `Status must be one of: ${PROJECT_STATUSES.join(', ')}` });
    } else out.status = status;
  }

  if (!partial || body.priority !== undefined) {
    if (body.priority) {
      if (!PROJECT_PRIORITIES.includes(body.priority)) {
        errors.push({ field: 'priority', message: `Priority must be one of: ${PROJECT_PRIORITIES.join(', ')}` });
      } else out.priority = body.priority;
    } else if (!partial) {
      out.priority = 'Medium';
    }
  }

  if (!partial || body.budget !== undefined) {
    try {
      out.budget = toFiniteNumber(body.budget, { field: 'budget', required: false, min: 0 });
    } catch (e) {
      errors.push({ field: 'budget', message: e.message });
    }
  }

  const deadlineRaw = body.deadline ?? body.endDate;
  if (!partial || deadlineRaw !== undefined) {
    try {
      out.endDate = toOptionalDate(deadlineRaw, 'deadline');
      if (!partial && !out.endDate) {
        errors.push({ field: 'deadline', message: 'Deadline is required' });
      }
    } catch (e) {
      errors.push({ field: 'deadline', message: e.message });
    }
  }

  if (!partial || body.startDate !== undefined) {
    try {
      out.startDate = toOptionalDate(body.startDate, 'startDate');
    } catch (e) {
      errors.push({ field: 'startDate', message: e.message });
    }
  }

  if (out.startDate && out.endDate && out.endDate < out.startDate) {
    errors.push({ field: 'deadline', message: 'Deadline must be on or after start date' });
  }

  if (!partial || body.technologies !== undefined) {
    out.technologies = String(body.technologies || '').trim().slice(0, 200);
  }
  if (!partial || body.projectType !== undefined) {
    out.projectType = String(body.projectType || 'New Development').trim().slice(0, 80);
  }
  if (!partial || body.createdBy !== undefined) {
    out.createdBy = String(body.createdBy || '').trim().slice(0, 120);
  }

  if (!partial || body.team !== undefined) {
    const team = Array.isArray(body.team) ? body.team : [];
    out.team = [...new Set(team.map((t) => String(t).trim()).filter(Boolean))];
  }

  const clientRaw = body.clientId || body.client;
  if (!partial || clientRaw !== undefined) {
    if (!clientRaw) {
      if (!partial) errors.push({ field: 'client', message: 'Client is required' });
      else {
        out.clientId = null;
        out.client = '';
      }
    } else if (mongoose.isValidObjectId(clientRaw)) {
      const clientDoc = await Client.findById(clientRaw).select('name company').lean();
      if (!clientDoc) {
        errors.push({ field: 'client', message: 'Client not found' });
      } else {
        out.clientId = clientDoc._id;
        out.client = clientDoc.company || clientDoc.name || '';
      }
    } else {
      // Legacy: free-text client name
      out.clientId = null;
      out.client = String(clientRaw).trim().slice(0, 120);
      if (!out.client && !partial) {
        errors.push({ field: 'client', message: 'Client is required' });
      }
    }
  }

  if (errors.length) {
    const err = new Error(errors[0].message);
    err.status = 400;
    err.errors = errors;
    throw err;
  }

  return out;
};

const shapeProject = (project) => {
  const budget = coerceBudgetForRead(project.budget);
  const team = Array.isArray(project.team)
    ? project.team
    : Array.isArray(project.teamMembers)
      ? project.teamMembers
      : [];

  return {
    ...project,
    title: project.name,
    name: project.name,
    deadline: project.endDate || null,
    endDate: project.endDate || null,
    budget,
    team,
    teamSize: team.length,
    client:
      project.clientDoc ||
      (project.clientId && typeof project.clientId === 'object'
        ? project.clientId
        : { company: project.client || '—', name: project.client || '' }),
  };
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('clientId', 'name company email phone status')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      projects.map(async (project) => {
        let team = Array.isArray(project.team) ? [...project.team] : [];

        if (team.length === 0) {
          const tasks = await Task.find({ projectName: project.name }).select('assignedTo').lean();
          team = [...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))];
        }

        const objectIds = team.filter((id) => mongoose.isValidObjectId(id));
        const codes = team.filter((id) => !mongoose.isValidObjectId(id));

        const members = await Employee.find({
          $or: [
            ...(codes.length ? [{ employeeId: { $in: codes } }] : []),
            ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
          ],
        })
          .select('name profilePicture designation employeeId')
          .lean();

        return shapeProject({
          ...project,
          team: members.length ? members : team,
          teamMembers: members,
          clientDoc: project.clientId || undefined,
        });
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const payload = await normalizePayload(req.body, { partial: false });
    payload.createdBy = payload.createdBy || req.user?.name || '';

    const existingProject = await Project.findOne({ name: payload.name });
    if (existingProject) {
      return res.status(400).json({
        message: 'Project with this name already exists',
        errors: [{ field: 'name', message: 'Project with this name already exists' }],
      });
    }

    const saved = await Project.create(payload);
    const populated = await Project.findById(saved._id).populate('clientId', 'name company email phone').lean();
    res.status(201).json(shapeProject({ ...populated, clientDoc: populated.clientId || undefined }));
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || 'Error creating project',
      errors: error.errors || undefined,
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const payload = await normalizePayload(req.body, { partial: true });

    if (payload.name && payload.name !== project.name) {
      const nameTaken = await Project.findOne({ name: payload.name });
      if (nameTaken) {
        return res.status(400).json({
          message: 'Project with this name already exists',
          errors: [{ field: 'name', message: 'Project with this name already exists' }],
        });
      }
    }

    Object.assign(project, payload);
    await project.save();

    const populated = await Project.findById(project._id).populate('clientId', 'name company email phone').lean();
    res.json(shapeProject({ ...populated, clientDoc: populated.clientId || undefined }));
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || 'Error updating project',
      errors: error.errors || undefined,
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

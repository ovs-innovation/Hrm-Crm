import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const spanSchema = new mongoose.Schema({
  path: { type: String, required: true },
  seconds: { type: Number, default: 0 },
}, { _id: false });

const shotSchema = new mongoose.Schema({
  at: { type: Date, required: true },
  path: { type: String, required: true },
}, { _id: false });

const fileSchema = new mongoose.Schema({
  at: { type: Date, required: true },
  action: { type: String, enum: ['created', 'modified', 'deleted', 'opened'], required: true },
  name: { type: String, required: true },
}, { _id: false });

const wfhSessionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['online', 'working', 'away', 'break', 'meeting', 'logged_out'], default: 'online' },
  lastPulseAt: { type: Date, default: null },
  activeSeconds: { type: Number, default: 0 },
  idleSeconds: { type: Number, default: 0 },
  breakSeconds: { type: Number, default: 0 },
  inputCount: { type: Number, default: 0 },
  mouseClicks: { type: Number, default: 0 },
  keyCount: { type: Number, default: 0 },
  breakCount: { type: Number, default: 0 },
  pages: { type: [spanSchema], default: [] },
  apps: { type: [spanSchema], default: [] },
  sites: { type: [spanSchema], default: [] },
  projects: { type: [spanSchema], default: [] },
  files: { type: [fileSchema], default: [] },
  shots: { type: [shotSchema], default: [] },
  lastShotAt: { type: Date, default: null },
  alerts: {
    idle: { type: Boolean, default: false },
    quiet: { type: Boolean, default: false },
    low: { type: Boolean, default: false },
    breaks: { type: Boolean, default: false },
    late: { type: Boolean, default: false },
  },
  log: {
    completed: { type: String, default: '' },
    pending: { type: String, default: '' },
    tomorrow: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
}, { timestamps: true });

wfhSessionSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });
tenantScoped(wfhSessionSchema);

export default mongoose.model('WfhSession', wfhSessionSchema);

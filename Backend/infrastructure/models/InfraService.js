import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: {
      type: String,
      enum: [
        'docker', 'pm2', 'node', 'nginx', 'apache',
        'mysql', 'postgresql', 'mongodb', 'redis', 'rabbitmq', 'other',
      ],
      default: 'other',
    },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraServer', default: null },
    status: {
      type: String,
      enum: ['running', 'stopped', 'restarting', 'failed', 'unknown'],
      default: 'unknown',
    },
    version: { type: String, default: '' },
    cpuUsage: { type: Number, default: 0 },
    ramUsageMb: { type: Number, default: 0 },
    restartCount: { type: Number, default: 0 },
    uptimeSec: { type: Number, default: 0 },
    lastCheckedAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 2000 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraServiceSchema);
infraServiceSchema.index({ tenantId: 1, name: 1, serverId: 1 });

export default mongoose.model('InfraService', infraServiceSchema);

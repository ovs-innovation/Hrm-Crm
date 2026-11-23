import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraBackupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraServer', default: null },
    location: { type: String, default: '' },
    status: {
      type: String,
      enum: ['success', 'failed', 'running', 'unknown'],
      default: 'unknown',
    },
    sizeBytes: { type: Number, default: 0 },
    lastBackupAt: { type: Date, default: null },
    nextBackupAt: { type: Date, default: null },
    durationSec: { type: Number, default: 0 },
    retentionDays: { type: Number, default: 14 },
    notes: { type: String, default: '', maxlength: 2000 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraBackupSchema);
infraBackupSchema.index({ tenantId: 1, name: 1 });

export default mongoose.model('InfraBackup', infraBackupSchema);

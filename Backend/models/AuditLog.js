import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    module: { type: String, required: true },
    entityId: { type: String },
    entityLabel: { type: String },
    userId: { type: String },
    userName: { type: String },
    userRole: { type: String },
    changes: { type: mongoose.Schema.Types.Mixed },
    beforeValue: { type: mongoose.Schema.Types.Mixed },
    afterValue: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    device: { type: String },
    actorType: { type: String, enum: ['Human', 'AI'], default: 'Human' }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });

tenantScoped(auditLogSchema);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

import mongoose from 'mongoose';

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
    ip: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraAlertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'high_cpu', 'high_ram', 'high_disk', 'website_down', 'ssl_expiring',
        'domain_expiring', 'service_down', 'backup_failed', 'database_down',
        'bandwidth_high', 'other',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, default: '', maxlength: 4000 },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    assignedTo: { type: String, default: '' },
    notes: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

tenantScoped(infraAlertSchema);
infraAlertSchema.index({ tenantId: 1, resolved: 1, createdAt: -1 });
infraAlertSchema.index({ tenantId: 1, type: 1, resolved: 1 });

export default mongoose.model('InfraAlert', infraAlertSchema);

import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraLogSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'event', 'website_check', 'health_check', 'error',
        'restart', 'alert', 'manual', 'job',
      ],
      default: 'event',
    },
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
    },
    message: { type: String, required: true, maxlength: 4000 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    actor: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraLogSchema);
infraLogSchema.index({ tenantId: 1, createdAt: -1 });
infraLogSchema.index({ tenantId: 1, category: 1, createdAt: -1 });

export default mongoose.model('InfraLog', infraLogSchema);

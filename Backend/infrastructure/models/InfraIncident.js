import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const eventSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    message: { type: String, required: true, maxlength: 500 },
    actor: { type: String, default: '' },
  },
  { _id: false }
);

const infraIncidentSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved'],
      default: 'open',
    },
    assignedTo: { type: String, default: '', trim: true, maxlength: 120 },
    rootCause: { type: String, default: '', maxlength: 2000 },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    timeline: { type: [eventSchema], default: [] },
  },
  { timestamps: true }
);

tenantScoped(infraIncidentSchema);
infraIncidentSchema.index({ tenantId: 1, number: 1 }, { unique: true });
infraIncidentSchema.index({ tenantId: 1, status: 1, startedAt: -1 });
infraIncidentSchema.index({ tenantId: 1, entityType: 1, entityId: 1, status: 1 });

export default mongoose.model('InfraIncident', infraIncidentSchema);

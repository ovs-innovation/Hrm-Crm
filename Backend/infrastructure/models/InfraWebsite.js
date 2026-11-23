import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraWebsiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    domain: { type: String, required: true, trim: true, lowercase: true },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development', 'other'],
      default: 'production',
    },
    protocol: { type: String, enum: ['https', 'http'], default: 'https' },
    port: { type: Number, default: null },
    healthPath: { type: String, default: '/health', trim: true },
    autoPing: { type: Boolean, default: true },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraServer', default: null },
    status: {
      type: String,
      enum: ['online', 'offline', 'slow', 'maintenance', 'unknown'],
      default: 'unknown',
    },
    httpStatus: { type: Number, default: null },
    responseTimeMs: { type: Number, default: null },
    sslStatus: {
      type: String,
      enum: ['valid', 'expiring', 'expired', 'none', 'unknown'],
      default: 'unknown',
    },
    sslExpiry: { type: Date, default: null },
    uptimePercent: { type: Number, default: 100 },
    checksTotal: { type: Number, default: 0 },
    checksSuccess: { type: Number, default: 0 },
    lastCheckedAt: { type: Date, default: null },
    lastDowntimeAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 2000 },
    clientName: { type: String, default: '', trim: true, maxlength: 120 },
    clientEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraWebsiteSchema);
infraWebsiteSchema.index({ tenantId: 1, domain: 1 }, { unique: true });

export default mongoose.model('InfraWebsite', infraWebsiteSchema);

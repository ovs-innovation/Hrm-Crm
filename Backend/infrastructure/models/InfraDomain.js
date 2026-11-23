import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraDomainSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, trim: true, lowercase: true },
    registrar: { type: String, default: '', trim: true },
    purchaseDate: { type: Date, default: null },
    renewalDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    autoRenewal: { type: Boolean, default: false },
    reminderDaysBefore: { type: Number, default: 30, min: 1, max: 365 },
    owner: { type: String, default: '' },
    clientName: { type: String, default: '', trim: true, maxlength: 120 },
    clientEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
    clientMailStatus: {
      type: String,
      enum: ['none', 'pending', 'sent'],
      default: 'none',
    },
    clientMailSentAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: ['healthy', 'expiring_soon', 'expired', 'unknown'],
      default: 'unknown',
    },
    /** rdap | metadata | registrar_api */
    expirySource: { type: String, default: '' },
    lastCheckedAt: { type: Date, default: null },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraDomainSchema);
infraDomainSchema.index({ tenantId: 1, domain: 1 }, { unique: true });

export default mongoose.model('InfraDomain', infraDomainSchema);

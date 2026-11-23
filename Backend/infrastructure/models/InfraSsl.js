import mongoose from 'mongoose';
import { tenantScoped } from '../../plugins/tenantScope.plugin.js';

const infraSslSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, trim: true, lowercase: true },
    provider: { type: String, default: '', trim: true },
    issuedDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    autoRenewal: { type: Boolean, default: false },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfraWebsite', default: null },
    status: {
      type: String,
      enum: ['healthy', 'expiring_soon', 'expired', 'unknown'],
      default: 'unknown',
    },
    notes: { type: String, default: '', maxlength: 2000 },
    lastCheckedAt: { type: Date, default: null },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantScoped(infraSslSchema);
infraSslSchema.index({ tenantId: 1, domain: 1 }, { unique: true });

export default mongoose.model('InfraSsl', infraSslSchema);

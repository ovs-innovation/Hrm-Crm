import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const businessHealthSnapshotSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, required: true },
    breakdown: {
      sales: { type: Number, default: 100 },
      hr: { type: Number, default: 100 },
      finance: { type: Number, default: 100 },
      recruiting: { type: Number, default: 100 },
      support: { type: Number, default: 100 }
    },
    riskDetails: [
      {
        message: { type: String },
        severity: { type: String, enum: ['Low', 'Medium', 'High'] }
      }
    ]
  },
  { timestamps: true }
);

tenantScoped(businessHealthSnapshotSchema);

const BusinessHealthSnapshot = mongoose.model('BusinessHealthSnapshot', businessHealthSnapshotSchema);
export default BusinessHealthSnapshot;

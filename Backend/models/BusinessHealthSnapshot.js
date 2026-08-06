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
    ],
    historicalTrend: [
      {
        date: { type: Date, default: Date.now },
        score: { type: Number }
      }
    ],
    predictedNextWeekScore: { type: Number },
    predictionReasoning: { type: String }
  },
  { timestamps: true }
);

tenantScoped(businessHealthSnapshotSchema);

const BusinessHealthSnapshot = mongoose.model('BusinessHealthSnapshot', businessHealthSnapshotSchema);
export default BusinessHealthSnapshot;

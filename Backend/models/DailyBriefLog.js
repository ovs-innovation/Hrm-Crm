import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const dailyBriefLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    briefHtml: { type: String, required: true },
    sentVia: [
      {
        channel: { type: String }, // 'email', 'whatsapp', 'in_app'
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['Success', 'Failed'], default: 'Success' }
      }
    ]
  },
  { timestamps: true }
);

tenantScoped(dailyBriefLogSchema);

const DailyBriefLog = mongoose.model('DailyBriefLog', dailyBriefLogSchema);
export default DailyBriefLog;

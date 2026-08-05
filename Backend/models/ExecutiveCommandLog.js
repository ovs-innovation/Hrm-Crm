import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const executiveCommandLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    queryText: { type: String, required: true },
    toolExecuted: { type: String },
    argumentsUsed: { type: Object },
    success: { type: Boolean, default: true }
  },
  { timestamps: true }
);

tenantScoped(executiveCommandLogSchema);

const ExecutiveCommandLog = mongoose.model('ExecutiveCommandLog', executiveCommandLogSchema);
export default ExecutiveCommandLog;

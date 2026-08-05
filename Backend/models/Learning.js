import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const learningSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    userId: { type: String, index: true },
    prompt: { type: String, required: true },
    response: { type: String },
    status: { type: String, enum: ['Success', 'Correction', 'Failed'], default: 'Success' },
    feedback: { type: String },
    actionsExecuted: [{ type: String }],
    stylePreference: { type: String }
  },
  { timestamps: true }
);

tenantScoped(learningSchema);

const Learning = mongoose.model('Learning', learningSchema);
export default Learning;

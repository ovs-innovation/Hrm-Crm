import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, default: 0 },
    stage: {
      type: String,
      enum: ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      default: 'Qualification',
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    expectedCloseDate: { type: Date },
    owner: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

tenantScoped(dealSchema);
dealSchema.index({ tenantId: 1, stage: 1 });
dealSchema.index({ tenantId: 1, createdAt: -1 });

const Deal = mongoose.model('Deal', dealSchema);
export default Deal;

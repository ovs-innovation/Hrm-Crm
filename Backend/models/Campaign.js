import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['Email', 'Social', 'Event', 'Ads'], default: 'Email' },
    status: { type: String, enum: ['Draft', 'Active', 'Paused', 'Completed'], default: 'Draft' },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number, default: 0 },
    targetAudience: { type: String },
    leadsGenerated: { type: Number, default: 0 },
    notes: { type: String },
    owner: { type: String },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;

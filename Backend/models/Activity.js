import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['Deal', 'Client', 'Employee', 'Leave', 'Ticket', 'Invoice'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    entityLabel: { type: String },
    type: { type: String, enum: ['note', 'call', 'meeting', 'email', 'stage_change', 'created', 'updated', 'system'], default: 'note' },
    title: { type: String, required: true },
    body: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdBy: { type: String },
    createdByName: { type: String },
  },
  { timestamps: true }
);

activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;

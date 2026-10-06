import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const presenceStateSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy', 'in_meeting'],
      default: 'offline',
    },
    lastSeen: { type: Date, default: Date.now },
    device: { type: String, default: '' },
  },
  { timestamps: true }
);

presenceStateSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
presenceStateSchema.index({ tenantId: 1, status: 1 });

tenantScoped(presenceStateSchema);

const PresenceState = mongoose.model('PresenceState', presenceStateSchema);
export default PresenceState;

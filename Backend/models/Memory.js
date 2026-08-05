import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const memorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    content: { type: String, required: true },
    scope: { type: String, enum: ['Global', 'Tenant', 'User', 'Department', 'CRM', 'HRM', 'Sales', 'Recruitment'], default: 'Global' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    userId: { type: String, index: true },
  },
  { timestamps: true }
);

tenantScoped(memorySchema);

const Memory = mongoose.model('Memory', memorySchema);
export default Memory;

import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  trigger: {
    type: {
      type: String, // e.g., 'LeadCreated', 'InvoicePaid', 'LeaveSubmitted'
      required: true
    },
    config: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  nodes: [{
    id: { type: String, required: true },
    type: { type: String, required: true }, // e.g. 'trigger', 'action', 'delay'
    label: String,
    data: {
      actionType: String, // e.g. 'SendEmail', 'SendWhatsApp', 'CreateTask', 'AssignSalesperson'
      payload: mongoose.Schema.Types.Mixed
    }
  }],
  edges: [{
    id: String,
    source: { type: String, required: true },
    target: { type: String, required: true }
  }],
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true
  }
}, { timestamps: true });

tenantScoped(WorkflowSchema);

export default mongoose.model('Workflow', WorkflowSchema);

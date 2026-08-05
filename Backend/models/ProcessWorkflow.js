import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const processWorkflowSchema = new mongoose.Schema(
  {
    workflowName: { type: String, required: true },
    triggerEvent: { type: String, required: true }, // e.g., 'LEAD_WON', 'EMPLOYEE_CREATED'
    nodes: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true }, // trigger, action, etc.
        data: { type: Object, default: {} }
      }
    ],
    edges: [
      {
        id: { type: String },
        source: { type: String },
        target: { type: String }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

tenantScoped(processWorkflowSchema);

const ProcessWorkflow = mongoose.model('ProcessWorkflow', processWorkflowSchema);
export default ProcessWorkflow;

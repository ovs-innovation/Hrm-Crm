import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const workflowExecutionLogSchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcessWorkflow', required: true },
    workflowName: { type: String },
    status: { type: String, enum: ['Queued', 'Running', 'Completed', 'Failed'], default: 'Queued' },
    triggerEvent: { type: String },
    stepsExecuted: [
      {
        nodeId: { type: String },
        label: { type: String },
        actionType: { type: String },
        status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
        errorReason: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    retryCount: { type: Number, default: 0 },
    errorStack: { type: String },
    payload: { type: Object, default: {} }
  },
  { timestamps: true }
);

tenantScoped(workflowExecutionLogSchema);

const WorkflowExecutionLog = mongoose.model('WorkflowExecutionLog', workflowExecutionLogSchema);
export default WorkflowExecutionLog;

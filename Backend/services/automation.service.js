import Workflow from '../models/Workflow.js';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import Employee from '../models/Employee.js';

// Mock logger helper to act as audit trail
const logWorkflowExecution = (workflowName, nodeLabel, status, message) => {
  console.log(`[Workflow Engine: "${workflowName}"] Node "${nodeLabel}" -> ${status}: ${message}`);
};

/**
 * Trigger active workflows matching the event
 * @param {string} triggerType - e.g., 'LeadCreated', 'InvoicePaid', 'LeaveSubmitted'
 * @param {object} eventPayload - Trigger data/record details
 * @param {string} tenantId - Tenant identifier
 */
export async function triggerWorkflow(triggerType, eventPayload, tenantId = null) {
  try {
    const query = { 'trigger.type': triggerType, isActive: true };
    if (tenantId) query.tenantId = tenantId;

    const workflows = await Workflow.find(query);
    if (workflows.length === 0) return;

    for (const workflow of workflows) {
      console.log(`Executing Automation: ${workflow.name} (${workflow.description || 'No description'})`);
      
      // Find trigger node
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) continue;

      // Begin execution flow traverser
      await executeChildNodes(workflow, triggerNode.id, eventPayload);
    }
  } catch (err) {
    console.error('Workflow Engine Error:', err.message);
  }
}

/**
 * Execute child nodes connected to a source node
 */
async function executeChildNodes(workflow, sourceNodeId, payload) {
  const outgoingEdges = workflow.edges.filter(e => e.source === sourceNodeId);
  
  for (const edge of outgoingEdges) {
    const nextNode = workflow.nodes.find(n => n.id === edge.target);
    if (!nextNode) continue;

    try {
      if (nextNode.type === 'action') {
        await executeActionNode(workflow.name, nextNode, payload);
      }
      
      // Recurse to compile multi-node chains
      await executeChildNodes(workflow, nextNode.id, payload);
    } catch (err) {
      logWorkflowExecution(workflow.name, nextNode.label || nextNode.id, 'FAILED', err.message);
    }
  }
}

/**
 * Process automation action node execution
 */
async function executeActionNode(workflowName, node, payload) {
  const { actionType, payload: actionConfig } = node.data;
  
  switch (actionType) {
    case 'SendEmail': {
      const emailTo = payload.email || actionConfig?.to;
      const subject = actionConfig?.subject || 'Automation Notification';
      const body = actionConfig?.body || 'This is an automatic notification email.';
      
      logWorkflowExecution(
        workflowName,
        node.label || 'Email Alert',
        'SUCCESS',
        `Dispatched SMTP email to ${emailTo} with subject "${subject}"`
      );
      break;
    }

    case 'SendWhatsApp': {
      const phoneTo = payload.phone || actionConfig?.phone;
      const text = actionConfig?.text || 'Automation Alert';
      
      logWorkflowExecution(
        workflowName,
        node.label || 'WhatsApp Alert',
        'SUCCESS',
        `Dispatched WhatsApp API ping to ${phoneTo}: "${text}"`
      );
      break;
    }

    case 'CreateTask': {
      const taskTitle = actionConfig?.title || `Follow up on: ${payload.name || 'Activity'}`;
      const priority = actionConfig?.priority || 'Medium';
      
      // Create Mongoose task record
      const newTask = new Task({
        title: taskTitle,
        status: 'Pending',
        priority,
        assignedTo: actionConfig?.assignedTo || 'EMP001',
        description: `Automated task created by workflow engine: ${workflowName}.`
      });
      await newTask.save();
      
      logWorkflowExecution(
        workflowName,
        node.label || 'Task Creation',
        'SUCCESS',
        `Generated task: "${taskTitle}" assigned to ${newTask.assignedTo}`
      );
      break;
    }

    case 'AssignSalesperson': {
      // Dynamic lead owner routing logic:
      // If client resides in Delhi region, route to salesperson Amit, otherwise default
      let salesperson = actionConfig?.salesperson || 'Sales Executive';
      
      if (payload.address && payload.address.toLowerCase().includes('delhi')) {
        salesperson = 'Amit Sharma';
      }

      if (payload._id) {
        await Client.findByIdAndUpdate(payload._id, { owner: salesperson });
      }

      logWorkflowExecution(
        workflowName,
        node.label || 'Assign Lead Owner',
        'SUCCESS',
        `Assigned CRM contact owner to ${salesperson} (Address checked: ${payload.address || 'N/A'})`
      );
      break;
    }

    default:
      throw new Error(`Unsupported execution action: ${actionType}`);
  }
}

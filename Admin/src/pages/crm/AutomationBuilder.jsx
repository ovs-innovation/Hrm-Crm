import React, { useState } from 'react';
import PageShell from '../../components/PageShell';
import { FiPlay, FiMail, FiCpu, FiMessageSquare, FiFileText, FiPlus, FiTrash2, FiSave, FiLayers } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INITIAL_NODES = [
  { id: 'trigger-1', type: 'trigger', label: 'Lead Created', data: {} },
  { id: 'action-1', type: 'action', label: 'Route Lead (Amit/Delhi)', data: { actionType: 'AssignSalesperson', payload: { salesperson: 'Amit Sharma' } } },
  { id: 'action-2', type: 'action', label: 'Send Welcome Email', data: { actionType: 'SendEmail', payload: { subject: 'Welcome to Vastora CRM!', body: 'Hello candidate, welcome aboard!' } } }
];

const INITIAL_EDGES = [
  { id: 'edge-1', source: 'trigger-1', target: 'action-1' },
  { id: 'edge-2', source: 'action-1', target: 'action-2' }
];

const AutomationBuilder = () => {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [workflowName, setWorkflowName] = useState('New Client Onboarding Flow');
  const [workflowDesc, setWorkflowDesc] = useState('Autopilots onboarding sequence for new leads');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states for node configs
  const [nodeLabel, setNodeLabel] = useState('');
  const [actionType, setActionType] = useState('SendEmail');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [assignee, setAssignee] = useState('EMP001');

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setNodeLabel(node.label || '');
    if (node.type === 'action') {
      setActionType(node.data?.actionType || 'SendEmail');
      setEmailSubject(node.data?.payload?.subject || '');
      setEmailBody(node.data?.payload?.body || '');
      setWhatsappText(node.data?.payload?.text || '');
      setAssignee(node.data?.payload?.assignedTo || 'EMP001');
    }
  };

  const handleUpdateNodeConfig = () => {
    if (!selectedNode) return;
    
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedNode = { ...node, label: nodeLabel };
          if (node.type === 'action') {
            updatedNode.data = {
              actionType,
              payload: {
                subject: emailSubject,
                body: emailBody,
                text: whatsappText,
                assignedTo: assignee
              }
            };
          }
          return updatedNode;
        }
        return node;
      })
    );
    toast.success('Node configuration updated!');
  };

  const handleAddNode = (type) => {
    const newId = `action-${nodes.length + 1}`;
    const newNode = {
      id: newId,
      type,
      label: type === 'action' ? 'New CRM Action' : 'New Trigger',
      data: type === 'action' ? { actionType: 'SendEmail', payload: {} } : {}
    };
    setNodes([...nodes, newNode]);

    // Automatically link to the last node
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge = { id: `edge-${edges.length + 1}`, source: lastNode.id, target: newId };
      setEdges([...edges, newEdge]);
    }
  };

  const handleDeleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const handleSaveWorkflow = async () => {
    setLoading(true);
    try {
      await api.post('/ai/workflow', {
        name: workflowName,
        description: workflowDesc,
        nodes,
        edges
      });
      toast.success('Automation pipeline saved and live!');
    } catch (err) {
      toast.error('Failed to save workflow blueprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Visual Workflow Builder"
      description="Design drag-and-drop automation pipelines"
      actions={
        <button
          onClick={handleSaveWorkflow}
          disabled={loading}
          className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-bold"
        >
          <FiSave className="h-3.5 w-3.5" /> Save Blueprint
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start text-ink text-[13px]">
        {/* Visual Workspace Canvas */}
        <div className="space-y-4">
          <div className="rounded border border-line bg-surface p-4 flex gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="app-input h-9 w-1/3 text-[13px] font-bold"
            />
            <input
              type="text"
              value={workflowDesc}
              onChange={(e) => setWorkflowDesc(e.target.value)}
              placeholder="Flow description"
              className="app-input h-9 w-2/3 text-[13px]"
            />
          </div>

          <div className="rounded border border-line bg-soft/20 h-[450px] relative p-6 flex flex-col justify-between overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex gap-2 relative z-10">
              <button
                type="button"
                onClick={() => handleAddNode('action')}
                className="bg-brand/10 hover:bg-brand/20 border border-brand/20 rounded px-3 py-1.5 flex items-center gap-1 font-bold text-brand"
              >
                <FiPlus /> Add Action Node
              </button>
            </div>

            {/* Nodes Layout View */}
            <div className="flex-1 flex flex-col justify-center items-center gap-10">
              {nodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center relative">
                  {/* Connective edge line */}
                  {index < nodes.length - 1 && (
                    <div className="absolute top-[52px] w-0.5 h-10 bg-brand/30"></div>
                  )}

                  <div
                    onClick={() => handleSelectNode(node)}
                    className={`cursor-pointer rounded border p-3 w-56 flex items-center justify-between transition-all ${
                      selectedNode?.id === node.id
                        ? 'border-brand bg-brand/5 shadow-[0_0_10px_rgba(37,99,235,0.15)]'
                        : 'border-line bg-surface hover:border-line-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-soft border border-line text-brand">
                        {node.type === 'trigger' ? <FiPlay className="h-3.5 w-3.5 text-green-500" /> : <FiCpu className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="font-bold text-ink text-[12px]">{node.label}</p>
                        <p className="text-[10px] text-muted uppercase font-bold">{node.type}</p>
                      </div>
                    </div>

                    {node.type !== 'trigger' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                        className="text-muted hover:text-rose-500 transition-colors"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-muted flex items-center gap-1">
              <FiLayers /> Nodes auto-align vertically along active execution paths.
            </div>
          </div>
        </div>

        {/* Node Configuration Sheet Panel */}
        <div className="rounded border border-line bg-surface p-5 space-y-4">
          <h3 className="text-sm font-bold border-b border-line pb-3 text-ink">Node Configuration</h3>

          {!selectedNode ? (
            <div className="text-muted text-center py-10 font-medium">
              Select any node on the blueprint canvas to configure parameters.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted uppercase font-bold mb-1">Node Title Label</label>
                <input
                  type="text"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  className="app-input h-9 w-full text-[13px]"
                />
              </div>

              {selectedNode.type === 'action' && (
                <>
                  <div>
                    <label className="block text-[11px] text-muted uppercase font-bold mb-1">Execution Action</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="app-input h-9 w-full text-[13px] cursor-pointer"
                    >
                      <option value="SendEmail">Send Welcome Email</option>
                      <option value="SendWhatsApp">Send WhatsApp Message</option>
                      <option value="CreateTask">Create Follow-up Task</option>
                      <option value="AssignSalesperson">Assign Sales Owner (Dynamic)</option>
                    </select>
                  </div>

                  {actionType === 'SendEmail' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-muted uppercase font-bold mb-1">Email Subject</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="app-input h-9 w-full text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted uppercase font-bold mb-1">Email Template Body</label>
                        <textarea
                          rows={4}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="app-input w-full text-[13px] py-2 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {actionType === 'SendWhatsApp' && (
                    <div>
                      <label className="block text-[11px] text-muted uppercase font-bold mb-1">WhatsApp Text Message</label>
                      <textarea
                        rows={3}
                        value={whatsappText}
                        onChange={(e) => setWhatsappText(e.target.value)}
                        className="app-input w-full text-[13px] py-2 resize-none"
                      />
                    </div>
                  )}

                  {actionType === 'CreateTask' && (
                    <div>
                      <label className="block text-[11px] text-muted uppercase font-bold mb-1">Assign Task To</label>
                      <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        className="app-input h-9 w-full text-[13px] cursor-pointer"
                      >
                        <option value="EMP001">Amit Sharma (Admin/Sales)</option>
                        <option value="EMP002">Rudra Sharma (HR Executive)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleUpdateNodeConfig}
                className="w-full btn-primary h-9 text-white font-bold transition-all text-center"
              >
                Apply Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default AutomationBuilder;

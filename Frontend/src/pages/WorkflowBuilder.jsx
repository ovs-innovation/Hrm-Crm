import React, { useState, useEffect } from 'react';
import { FiPlus, FiCpu, FiPlay, FiTrash2, FiSave, FiGitBranch } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState([]);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('LEAD_WON');
  const [nodes, setNodes] = useState([
    { id: '1', type: 'trigger', data: { label: 'Lead Won Trigger' } }
  ]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data } = await api.get('/executive/workflows');
      if (data.success) {
        setWorkflows(data.workflows);
      }
    } catch (err) {
      toast.error('Failed to load workflows list');
    }
  };

  const addActionNode = () => {
    const newId = String(nodes.length + 1);
    setNodes([
      ...nodes,
      { id: newId, type: 'action', data: { label: `New Operation Action ${newId}` } }
    ]);
  };

  const removeNode = (id) => {
    if (id === '1') {
      toast.error('Cannot remove trigger node');
      return;
    }
    setNodes(nodes.filter(node => node.id !== id));
  };

  const saveWorkflowConfig = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      const { data } = await api.post('/executive/workflows/save', {
        workflowName: name,
        triggerEvent: trigger,
        nodes,
        edges: []
      });
      if (data.success) {
        toast.success('Workflow saved successfully!');
        fetchWorkflows();
      }
    } catch (err) {
      toast.error('Failed to save workflow');
    }
  };

  const runTest = async (workflowId) => {
    try {
      const { data } = await api.post('/executive/workflows/test', { workflowId });
      if (data.success) {
        toast.success(`Workflow run completed: Status ${data.status}`);
      }
    } catch (err) {
      toast.error('Failed to run workflow test simulation');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Sidebar Workflows List */}
      <div className="lg:col-span-1 border border-line rounded bg-surface p-4 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-ink border-b border-line pb-2">Active Workflows</h3>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
          {workflows.map((wf) => (
            <div key={wf._id} className="flex items-center justify-between p-2 hover:bg-soft rounded border border-line text-xs">
              <span className="font-semibold text-ink truncate">{wf.workflowName}</span>
              <button 
                onClick={() => runTest(wf._id)}
                className="text-brand hover:bg-brand-xlight rounded p-1"
                title="Run test simulation"
              >
                <FiPlay className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Builder Canvas */}
      <div className="lg:col-span-3 border border-line rounded bg-surface p-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex flex-1 items-center gap-3">
            <input 
              type="text" 
              placeholder="Workflow Name (e.g. Sales Pipeline Auto-onboard)..."
              className="flex-1 rounded border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="rounded border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              <option value="LEAD_WON">Trigger: Lead Won</option>
              <option value="EMPLOYEE_CREATED">Trigger: Employee Joined</option>
              <option value="TICKET_OPENED">Trigger: Ticket Opened</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={addActionNode}
              className="flex items-center gap-1.5 rounded border border-line bg-surface hover:bg-soft px-3 py-1.5 text-xs font-semibold text-ink"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add Action
            </button>
            <button 
              onClick={saveWorkflowConfig}
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
            >
              <FiSave className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Workflow Node Chain Canvas */}
        <div className="flex flex-col items-center gap-4 bg-soft/50 border border-line rounded p-8 min-h-[300px] justify-center overflow-x-auto">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              {index > 0 && (
                <div className="h-8 w-0.5 bg-brand relative flex items-center justify-center">
                  <div className="absolute -bottom-1 border-t-4 border-t-brand border-x-4 border-x-transparent" />
                </div>
              )}
              <div className="w-full max-w-[320px] flex items-center justify-between border border-line bg-surface rounded p-4 shadow-sm relative group">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${node.type === 'trigger' ? 'bg-amber-100 text-amber-700' : 'bg-brand-xlight text-brand'}`}>
                    {node.type === 'trigger' ? <FiGitBranch className="h-4 w-4" /> : <FiCpu className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink uppercase tracking-wide opacity-80">{node.type}</p>
                    <input 
                      type="text"
                      className="text-xs text-ink bg-transparent border-b border-transparent focus:border-brand focus:outline-none py-0.5 w-[200px]"
                      value={node.data.label}
                      onChange={(e) => {
                        const updated = [...nodes];
                        updated[index].data.label = e.target.value;
                        setNodes(updated);
                      }}
                    />
                  </div>
                </div>
                {node.type !== 'trigger' && (
                  <button 
                    onClick={() => removeNode(node.id)}
                    className="text-muted hover:text-red-500 rounded p-1"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;

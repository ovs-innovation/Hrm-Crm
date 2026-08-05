import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiClock, FiActivity, FiCpu } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import AICopilotCard from '../../components/AICopilotCard';
import api from '../../services/api';

const STATUS_STYLES = {
  Active: 'bg-brand-xlight text-brand',
  Lead: 'bg-soft text-ink',
  Inactive: 'bg-soft text-muted',
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Lead',
    notes: '',
  });

  // Split Panel & Timeline States
  const [selectedClient, setSelectedClient] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [aiData, setAiData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setTimelineLoading(true);
    try {
      const { data } = await api.get(`/ai/client-timeline/${client._id}`);
      if (data.success) {
        setTimelineEvents(data.timeline || []);
        setAiData(data.aiSummary || null);
      } else {
        setTimelineEvents([]);
        setAiData(null);
      }
    } catch (err) {
      console.error(err);
      setTimelineEvents([]);
      setAiData(null);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      setFormData({ name: '', company: '', email: '', phone: '', status: 'Lead', notes: '' });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Delete this account?')) {
      try {
        await api.delete(`/clients/${id}`);
        if (selectedClient?._id === id) setSelectedClient(null);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <PageShell
      title="Accounts"
      description="Companies and organizations you work with"
      count={clients.length}
      actions={
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add account
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Accounts Table */}
        <div className={`${selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'} overflow-hidden rounded border border-line bg-surface transition-all duration-300`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-soft text-muted">
                  <th className="px-4 py-2.5 font-medium">Account name</th>
                  <th className="px-4 py-2.5 font-medium">Primary contact</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted animate-pulse">
                      Loading accounts…
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-[13px] text-muted">No accounts yet.</p>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr 
                      key={client._id} 
                      onClick={() => handleSelectClient(client)}
                      className={`border-b border-line last:border-0 cursor-pointer hover:bg-soft/60 ${selectedClient?._id === client._id ? 'bg-brand/5 border-l-2 border-brand' : ''}`}
                    >
                      <td className="px-4 py-3 font-semibold text-ink">{client.company}</td>
                      <td className="px-4 py-3 text-ink">
                        <div>{client.name}</div>
                        <div className="text-[10px] text-muted">{client.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[client.status] || STATUS_STYLES.Lead}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => deleteClient(client._id)}
                          className="rounded p-1 text-muted hover:bg-soft hover:text-danger"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Timeline & AI Copilot Split-panel */}
        {selectedClient && (
          <div className="lg:col-span-1 space-y-6">
            
            {/* AI Advisor Panel */}
            <AICopilotCard 
              title="AI Lead Strategist"
              type="ClientTimeline"
              data={aiData}
              loading={timelineLoading}
            />

            {/* Event Timeline Card */}
            <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Account Timeline</h3>
                <FiClock className="h-4 w-4 text-muted" />
              </div>
              
              {timelineLoading ? (
                <div className="space-y-4 py-4">
                  <div className="h-8 bg-soft rounded animate-pulse" />
                  <div className="h-8 bg-soft rounded animate-pulse" />
                  <div className="h-8 bg-soft rounded animate-pulse" />
                </div>
              ) : timelineEvents.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">No active history logged for this account.</p>
              ) : (
                <div className="relative border-l-2 border-line pl-4 ml-2 space-y-5 py-2">
                  {timelineEvents.map((evt, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Colored dot on the line */}
                      <span className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-surface ${evt.color || 'bg-brand'}`} />
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-ink bg-soft rounded px-1.5 py-0.5">{evt.type}</span>
                        <span className="text-[9px] text-muted">{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-ink/90 leading-relaxed font-medium">{evt.summary}</p>
                      <span className="text-[9px] text-muted block">Logged by: {evt.owner}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-[15px] font-semibold text-ink">New account</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted hover:text-ink">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Contact name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="app-input h-9 text-[13px]" />
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Account name</label>
                  <input required type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="app-input h-9 text-[13px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1 block text-[13px]">Email</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="app-input h-9 text-[13px]" />
                </div>
                <div>
                  <label className="app-label mb-1 block text-[13px]">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="app-input h-9 text-[13px]" />
                </div>
              </div>
              <div>
                <label className="app-label mb-1 block text-[13px]">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="app-input h-9 text-[13px]">
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="app-label mb-1 block text-[13px]">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="app-input min-h-[80px] resize-none text-[13px]" />
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline h-9 px-3 text-[13px]">Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Clients;

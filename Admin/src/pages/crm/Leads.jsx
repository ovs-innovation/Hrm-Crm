import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import CsvImportButton from '../../components/CsvImportButton';
import api from '../../services/api';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', notes: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients?status=Lead');
      setLeads(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', { ...formData, status: 'Lead' });
      setIsModalOpen(false);
      setFormData({ name: '', company: '', email: '', phone: '', notes: '' });
      fetchLeads();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await api.delete(`/clients/${id}`);
    fetchLeads();
  };

  const convertToAccount = async (lead) => {
    await api.put(`/clients/${lead._id}`, { status: 'Active' });
    fetchLeads();
  };

  return (
    <PageShell
      title="Leads"
      description="Prospects not yet converted to accounts"
      count={leads.length}
      actions={
        <div className="flex gap-2">
          <CsvImportButton type="leads" label="Import" onDone={fetchLeads} />
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add lead
          </button>
        </div>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Lead name</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No leads yet.</td></tr>
            ) : leads.map((lead) => (
              <tr key={lead._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{lead.name}</td>
                <td className="px-4 py-3 text-ink">{lead.company}</td>
                <td className="px-4 py-3 text-muted">{lead.email}</td>
                <td className="px-4 py-3 text-muted">{lead.phone || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => convertToAccount(lead)} className="mr-2 text-[13px] font-medium text-brand hover:text-brand-hover">Convert</button>
                  <button type="button" onClick={() => handleDelete(lead._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New lead</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Name</label><input required className="app-input h-9 text-[13px]" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Company</label><input required className="app-input h-9 text-[13px]" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Email</label><input required type="email" className="app-input h-9 text-[13px]" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Phone</label><input className="app-input h-9 text-[13px]" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Leads;

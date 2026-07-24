import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const STATUSES = ['Draft', 'Active', 'Paused', 'Completed'];
const TYPES = ['Email', 'Social', 'Event', 'Ads'];

const Campaigns = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Email', status: 'Draft', budget: '', startDate: '', endDate: '', targetAudience: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/campaigns', { ...form, budget: Number(form.budget) || 0 });
    setModalOpen(false);
    setForm({ name: '', type: 'Email', status: 'Draft', budget: '', startDate: '', endDate: '', targetAudience: '' });
    fetchItems();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/campaigns/${id}`, { status });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.delete(`/campaigns/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Campaigns"
      description="Marketing campaigns and lead generation"
      count={items.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> New campaign
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Campaign</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Budget</th>
              <th className="px-4 py-2.5 font-medium text-right">Leads</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No campaigns yet.</td></tr>
            ) : items.map((c) => (
              <tr key={c._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.type}</td>
                <td className="px-4 py-3">
                  <select value={c.status} onChange={(e) => updateStatus(c._id, e.target.value)} className="h-8 rounded border border-line bg-surface px-2 text-[13px]">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">₹{Number(c.budget || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.leadsGenerated || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(c._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New campaign">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Name</label><input required className="app-input h-9 w-full text-[13px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Type</label><select className="app-input h-9 w-full text-[13px]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="app-label mb-1 block text-[13px]">Budget (₹)</label><input type="number" min="0" className="app-input h-9 w-full text-[13px]" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Start date</label><input type="date" className="app-input h-9 w-full text-[13px]" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">End date</label><input type="date" className="app-input h-9 w-full text-[13px]" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Target audience</label><input className="app-input h-9 w-full text-[13px]" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Create</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Campaigns;

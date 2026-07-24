import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const STATUSES = ['Scheduled', 'Completed', 'Cancelled'];

const Meetings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', relatedTo: '', scheduledAt: '', duration: '30', location: '', notes: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/meetings', { ...form, duration: Number(form.duration) || 30 });
    setModalOpen(false);
    setForm({ title: '', relatedTo: '', scheduledAt: '', duration: '30', location: '', notes: '' });
    fetchItems();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/meetings/${id}`, { status });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    await api.delete(`/meetings/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Meetings"
      description="Schedule and track customer meetings"
      count={items.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Schedule meeting
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Meeting</th>
              <th className="px-4 py-2.5 font-medium">Related to</th>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Location</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No meetings scheduled.</td></tr>
            ) : items.map((m) => (
              <tr key={m._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{m.title}</td>
                <td className="px-4 py-3 text-muted">{m.relatedTo || '—'}</td>
                <td className="px-4 py-3 text-muted">{m.scheduledAt ? new Date(m.scheduledAt).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-3 text-muted">{m.location || '—'}</td>
                <td className="px-4 py-3">
                  <select value={m.status} onChange={(e) => updateStatus(m._id, e.target.value)} className="h-8 rounded border border-line bg-surface px-2 text-[13px]">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(m._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule meeting">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Title</label><input required className="app-input h-9 w-full text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Related to</label><input className="app-input h-9 w-full text-[13px]" placeholder="Account or deal" value={form.relatedTo} onChange={(e) => setForm({ ...form, relatedTo: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Duration (min)</label><input type="number" min="5" className="app-input h-9 w-full text-[13px]" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Date & time</label><input type="datetime-local" required className="app-input h-9 w-full text-[13px]" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Location</label><input className="app-input h-9 w-full text-[13px]" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Notes</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Schedule</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Meetings;

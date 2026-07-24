import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const STATUSES = ['Completed', 'Missed', 'Scheduled'];
const DIRECTIONS = ['Inbound', 'Outbound'];

const Calls = () => {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', contactName: '', client: '', direction: 'Outbound', duration: '5', notes: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [callsRes, clientsRes] = await Promise.all([api.get('/calls'), api.get('/clients')]);
      setItems(callsRes.data);
      setClients(clientsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const client = clients.find((c) => c._id === form.client);
    await api.post('/calls', {
      ...form,
      contactName: client ? client.name : form.contactName,
      duration: Number(form.duration) || 0,
      client: form.client || undefined,
    });
    setModalOpen(false);
    setForm({ subject: '', contactName: '', client: '', direction: 'Outbound', duration: '5', notes: '' });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this call log?')) return;
    await api.delete(`/calls/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Calls"
      description="Log inbound and outbound sales calls"
      count={items.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Log call
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Subject</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Direction</th>
              <th className="px-4 py-2.5 font-medium">Duration</th>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No calls logged.</td></tr>
            ) : items.map((c) => (
              <tr key={c._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{c.subject}</td>
                <td className="px-4 py-3 text-muted">{c.contactName || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{c.direction}</span></td>
                <td className="px-4 py-3 text-muted">{c.duration} min</td>
                <td className="px-4 py-3 text-muted">{c.calledAt ? new Date(c.calledAt).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-3 text-muted">{c.status}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(c._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log call">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Subject</label><input required className="app-input h-9 w-full text-[13px]" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Contact</label><select className="app-input h-9 w-full text-[13px]" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}><option value="">Select or type below</option>{clients.map((cl) => <option key={cl._id} value={cl._id}>{cl.name} · {cl.company}</option>)}</select></div>
            <div><label className="app-label mb-1 block text-[13px]">Or contact name</label><input className="app-input h-9 w-full text-[13px]" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Direction</label><select className="app-input h-9 w-full text-[13px]" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>{DIRECTIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label className="app-label mb-1 block text-[13px]">Duration (min)</label><input type="number" min="0" className="app-input h-9 w-full text-[13px]" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Notes</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Calls;

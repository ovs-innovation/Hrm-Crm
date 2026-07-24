import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';

const CATEGORIES = ['IT', 'HR', 'Facilities', 'General'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const Tickets = () => {
  const user = useSelector((state) => state.auth.user || {});
  const employeeId = user.employeeId;
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', priority: 'Medium' });

  const fetchTickets = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tickets?createdBy=${employeeId}`);
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', {
        ...form,
        createdBy: employeeId,
        createdByName: user.name,
        status: 'Open',
      });
      toast.success('Ticket submitted');
      setModalOpen(false);
      setForm({ title: '', description: '', category: 'General', priority: 'Medium' });
      fetchTickets();
    } catch {
      toast.error('Failed to submit ticket');
    }
  };

  const openCount = tickets.filter((t) => ['Open', 'In Progress'].includes(t.status)).length;

  return (
    <PageShell
      title="Support tickets"
      description="Raise and track internal support requests"
      count={tickets.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> New ticket
        </button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Open</p><p className="text-xl font-semibold text-ink">{openCount}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Total</p><p className="text-xl font-semibold text-ink">{tickets.length}</p></div>
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No tickets yet.</td></tr>
            ) : tickets.map((t) => (
              <tr key={t._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12px] text-muted line-clamp-1">{t.description}</p>}
                </td>
                <td className="px-4 py-3 text-muted">{t.category}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{t.priority}</span></td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{t.status}</span></td>
                <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New ticket</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div><label className="app-label mb-1 block text-[13px]">Title</label><input required className="app-input h-9 w-full text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Category</label><select className="app-input h-9 w-full text-[13px]" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="app-label mb-1 block text-[13px]">Priority</label><select className="app-input h-9 w-full text-[13px]" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
              </div>
              <div><label className="app-label mb-1 block text-[13px]">Description</label><textarea required className="app-input min-h-[80px] w-full text-[13px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Tickets;

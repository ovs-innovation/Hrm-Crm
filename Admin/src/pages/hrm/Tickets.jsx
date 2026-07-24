import React, { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = filter ? `/tickets?status=${filter}` : '/tickets';
      const res = await api.get(url);
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/tickets/${id}`, { status });
    fetchTickets();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    await api.delete(`/tickets/${id}`);
    fetchTickets();
  };

  const openCount = tickets.filter((t) => ['Open', 'In Progress'].includes(t.status)).length;

  return (
    <PageShell
      title="Support tickets"
      description="Manage employee support requests"
      count={tickets.length}
      actions={
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="app-input h-8 text-[13px]">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Open / in progress</p><p className="text-xl font-semibold text-ink">{openCount}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Total</p><p className="text-xl font-semibold text-ink">{tickets.length}</p></div>
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Ticket</th>
              <th className="px-4 py-2.5 font-medium">Raised by</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No tickets.</td></tr>
            ) : tickets.map((t) => (
              <tr key={t._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12px] text-muted line-clamp-1">{t.description}</p>}
                </td>
                <td className="px-4 py-3 text-muted">{t.createdByName || t.createdBy || '—'}</td>
                <td className="px-4 py-3 text-muted">{t.category}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{t.priority}</span></td>
                <td className="px-4 py-3">
                  <select value={t.status} onChange={(e) => updateStatus(t._id, e.target.value)} className="h-8 rounded border border-line bg-surface px-2 text-[13px]">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(t._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default Tickets;

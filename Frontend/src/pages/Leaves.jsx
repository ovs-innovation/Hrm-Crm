import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Leaves = () => {
  const user = useSelector((state) => state.auth.user || {});
  const userId = user._id || user.employeeId;
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/leaves?employeeId=${userId}`);
      setLeaves(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', {
        employeeId: userId,
        employeeName: user.name,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      toast.success('Leave request submitted');
      setModalOpen(false);
      setForm({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch {
      toast.error('Failed to submit leave');
    }
  };

  const pending = leaves.filter((l) => l.status === 'Pending').length;
  const approved = leaves.filter((l) => l.status === 'Approved').length;

  return (
    <PageShell
      title="Leave"
      description="Request time off and track approval status"
      count={leaves.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Request leave
        </button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Pending</p><p className="text-xl font-semibold text-ink">{pending}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Approved</p><p className="text-xl font-semibold text-ink">{approved}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Total requests</p><p className="text-xl font-semibold text-ink">{leaves.length}</p></div>
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">From</th>
              <th className="px-4 py-2.5 font-medium">To</th>
              <th className="px-4 py-2.5 font-medium">Reason</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : leaves.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No leave requests yet.</td></tr>
            ) : leaves.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{l.type}</td>
                <td className="px-4 py-3 text-muted">{l.startDate}</td>
                <td className="px-4 py-3 text-muted">{l.endDate}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted">{l.reason}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded border border-line bg-surface p-4">
            <h3 className="mb-3 font-semibold text-ink">Request leave</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select className="app-input h-9 text-[13px]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Annual Leave</option><option>Sick Leave</option><option>Casual Leave</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input required type="date" className="app-input h-9 text-[13px]" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <input required type="date" className="app-input h-9 text-[13px]" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <textarea required rows={3} className="app-input text-[13px]" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <div className="flex justify-end gap-2">
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

export default Leaves;

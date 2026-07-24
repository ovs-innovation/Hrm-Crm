import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';

const ManageLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      setLeaves(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/leaves/${id}`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      fetchLeaves();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <PageShell title="Leave approvals" description="Review team leave requests" count={leaves.length}>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Dates</th>
              <th className="px-4 py-2.5 font-medium">Reason</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : leaves.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No requests.</td></tr>
            ) : leaves.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{l.employee}</td>
                <td className="px-4 py-3 text-muted">{l.type}</td>
                <td className="px-4 py-3 text-muted">{l.startDate} → {l.endDate}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-muted">{l.reason}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{l.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {l.status === 'Pending' && (
                    <>
                      <button type="button" onClick={() => updateStatus(l.id, 'Approved')} className="mr-2 text-[13px] font-medium text-brand">Approve</button>
                      <button type="button" onClick={() => updateStatus(l.id, 'Rejected')} className="text-[13px] font-medium text-danger">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default ManageLeaves;

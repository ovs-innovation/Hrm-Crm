import React, { useState, useEffect } from 'react';
import PageShell from '../components/PageShell';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Attendance = () => {
  const user = useSelector((state) => state.auth.user || {});
  const userId = user._id || user.employeeId;
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!userId) return;
    api.get(`/attendance?employeeId=${userId}`).then((res) => setRecords(res.data)).catch(console.error);
  }, [userId]);

  const present = records.filter((r) => r.status?.includes('Present') || r.status === 'Completed').length;
  const late = records.filter((r) => r.status?.includes('Late')).length;

  return (
    <PageShell title="Attendance" description="Your check-in history and status" count={records.length}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Total days</p><p className="text-xl font-semibold text-ink">{records.length}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Present</p><p className="text-xl font-semibold text-ink">{present}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Late</p><p className="text-xl font-semibold text-ink">{late}</p></div>
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Check in</th>
              <th className="px-4 py-2.5 font-medium">Check out</th>
              <th className="px-4 py-2.5 font-medium">Mode</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No attendance records.</td></tr>
            ) : records.map((r, i) => (
              <tr key={r.id || i} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{r.date}</td>
                <td className="px-4 py-3 text-muted">{r.checkIn || '—'}</td>
                <td className="px-4 py-3 text-muted">{r.checkOut || '—'}</td>
                <td className="px-4 py-3 text-muted">{r.workMode || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default Attendance;

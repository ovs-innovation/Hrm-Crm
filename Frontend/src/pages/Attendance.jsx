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

  const present = records.filter((r) => r.status === 'Present' || r.status?.includes('Present')).length;
  const late = records.filter((r) => r.status === 'Late' || r.status?.includes('Late')).length;
  const half = records.filter((r) => r.status === 'Half Day').length;
  const formatHours = (mins) => (Number.isFinite(mins) ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m` : '—');

  return (
    <PageShell title="Attendance" description="Shift 10:15 AM – 6:30 PM. Lunch is not counted. Leaving before 6:30 PM is a half day." count={records.length}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total days', records.length],
          ['Present', present],
          ['Late', late],
          ['Half day', half],
        ].map(([label, value]) => (
          <div key={label} className="flex min-h-[76px] flex-col justify-center rounded border border-line bg-surface px-4 py-3">
            <p className="text-[13px] text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Check in</th>
              <th className="px-4 py-2.5 font-medium">Check out</th>
              <th className="px-4 py-2.5 font-medium">Mode</th>
              <th className="px-4 py-2.5 font-medium">Hours</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No attendance records.</td></tr>
            ) : records.map((r, i) => (
              <tr key={r.id || i} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{r.date}</td>
                <td className="px-4 py-3 text-muted">{r.checkIn || '—'}</td>
                <td className="px-4 py-3 text-muted">{r.checkOut || '—'}</td>
                <td className="px-4 py-3 text-muted">{r.workMode || '—'}</td>
                <td className="px-4 py-3 text-muted">{formatHours(r.workedMinutes)}</td>
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

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PageShell from '../components/PageShell';
import api from '../services/api';

const ShiftRoster = () => {
  const user = useSelector((state) => state.auth.user || {});
  const employeeId = user.employeeId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    api.get(`/shifts?employeeId=${employeeId}&month=${month}`)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId, month]);

  return (
    <PageShell
      title="My shifts"
      description="Your assigned shift schedule"
      count={items.length}
      actions={
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="app-input h-8 text-[13px]" />
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Shift</th>
              <th className="px-4 py-2.5 font-medium">Time</th>
              <th className="px-4 py-2.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No shifts assigned this month.</td></tr>
            ) : items.map((s) => (
              <tr key={s._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{s.date}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{s.shiftType}</span></td>
                <td className="px-4 py-3 text-muted">{s.startTime} – {s.endTime}</td>
                <td className="px-4 py-3 text-muted">{s.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default ShiftRoster;

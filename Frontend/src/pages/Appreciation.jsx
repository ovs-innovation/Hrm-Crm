import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiAward } from 'react-icons/fi';
import PageShell from '../components/PageShell';
import api from '../services/api';

const EmployeeAppreciation = () => {
  const user = useSelector((state) => state.auth.user || {});
  const employeeId = user.employeeId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    api.get(`/appreciations?toEmployeeId=${employeeId}`)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  return (
    <PageShell title="Recognition" description="Appreciations you've received" count={items.length}>
      <div className="grid gap-3 sm:grid-cols-2">
        {loading ? (
          <p className="col-span-full py-10 text-center text-[13px] text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="col-span-full py-10 text-center text-[13px] text-muted">No appreciations yet. Keep up the great work!</p>
        ) : items.map((a) => (
          <div key={a._id} className="rounded border border-line bg-surface p-4">
            <span className="inline-flex items-center gap-1 rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              <FiAward className="h-3 w-3" /> {a.badge}
            </span>
            <p className="mt-2 text-[13px] text-ink">{a.message}</p>
            <p className="mt-2 text-[12px] text-muted">From {a.fromEmployeeName || 'HR'} · {new Date(a.date || a.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default EmployeeAppreciation;

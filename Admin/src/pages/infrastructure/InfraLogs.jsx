import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import toast from 'react-hot-toast';

export default function InfraLogs() {
  const [data, setData] = useState({ rows: [], total: 0, page: 1 });
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setData(await infraApi.listLogs({ category: category || undefined, q: q || undefined, page, limit: 50 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  useEffect(() => { load(); }, [category, page]);

  const exportCsv = () => {
    const rows = data.rows || [];
    const csv = ['createdAt,category,level,message', ...rows.map((r) =>
      [r.createdAt, r.category, r.level, JSON.stringify(r.message || '')].join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infra-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="Logs"
      description="Infrastructure events, checks, errors and manual actions"
      count={data.total}
      actions={
        <>
          <input className="app-input h-8 w-48 text-[13px]" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())} />
          <select className="app-input h-8 text-[13px]" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
            <option value="">All categories</option>
            {['event', 'website_check', 'health_check', 'error', 'restart', 'alert', 'manual', 'job'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={exportCsv}>Export</button>
        </>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No logs.</td></tr>
            ) : data.rows.map((l) => (
              <tr key={l._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-muted">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-muted">{l.category}</td>
                <td className="px-4 py-3 text-muted">{l.level}</td>
                <td className="px-4 py-3 text-ink">{l.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
        <span>Page {data.page}</span>
        <div className="flex gap-2">
          <button type="button" className="h-8 rounded border border-line px-3 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <button type="button" className="h-8 rounded border border-line px-3 disabled:opacity-40" disabled={data.rows.length < 50} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </PageShell>
  );
}

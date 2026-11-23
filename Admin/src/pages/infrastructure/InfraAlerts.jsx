import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

export default function InfraAlerts() {
  const [data, setData] = useState({ rows: [], total: 0 });
  const [resolved, setResolved] = useState('false');

  const load = async () => {
    try {
      setData(await infraApi.listAlerts({ resolved, limit: 100 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  useEffect(() => { load(); }, [resolved]);

  return (
    <PageShell
      title="Alerts"
      description="CPU, disk, downtime, SSL/domain expiry and backup failures"
      count={data.total}
      actions={
        <select className="app-input h-8 text-[13px]" value={resolved} onChange={(e) => setResolved(e.target.value)}>
          <option value="false">Open</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Severity</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Alert</th>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No alerts.</td></tr>
            ) : data.rows.map((a) => (
              <tr key={a._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3"><StatusPill value={a.severity} /></td>
                <td className="px-4 py-3 text-muted">{a.type}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="line-clamp-2 text-[12px] text-muted">{a.message}</p>
                </td>
                <td className="px-4 py-3 text-muted">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {!a.resolved && (
                    <button
                      type="button"
                      className="text-brand"
                      onClick={async () => {
                        await infraApi.resolveAlert(a._id, {});
                        toast.success('Resolved');
                        load();
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

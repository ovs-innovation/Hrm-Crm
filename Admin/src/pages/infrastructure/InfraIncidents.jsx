import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

export default function InfraIncidents() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    try {
      const data = await infraApi.listIncidents();
      setRows(Array.isArray(data) ? data : data.rows || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load incidents');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (id, body) => {
    try {
      await infraApi.updateIncident(id, body);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update incident');
    }
  };

  const selected = rows.find((r) => r._id === openId);

  return (
    <PageShell title="Incidents" description="Website and service incidents with owner, status, and timeline" count={rows.length}>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Assigned</th>
              <th className="px-4 py-2.5 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No incidents.</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id} className="cursor-pointer border-b border-line last:border-0" onClick={() => setOpenId(row._id)}>
                <td className="px-4 py-3 text-muted">{row.number}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.title}</td>
                <td className="px-4 py-3"><StatusPill value={row.priority} /></td>
                <td className="px-4 py-3"><StatusPill value={row.status} /></td>
                <td className="px-4 py-3 text-muted">{row.assignedTo || '—'}</td>
                <td className="px-4 py-3 text-muted">{fmt(row.startedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mt-4 rounded border border-line bg-surface p-4">
          <h3 className="text-[14px] font-semibold text-ink">Incident #{selected.number}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] text-muted">Assigned to
              <input className="app-input mt-1 h-9 w-full text-[13px]" defaultValue={selected.assignedTo} key={`${selected._id}-a`} onBlur={(e) => save(selected._id, { assignedTo: e.target.value })} />
            </label>
            <label className="text-[12px] text-muted">Status
              <select className="app-input mt-1 h-9 w-full text-[13px]" value={selected.status} onChange={(e) => save(selected._id, { status: e.target.value })}>
                <option value="open">open</option>
                <option value="investigating">investigating</option>
                <option value="resolved">resolved</option>
              </select>
            </label>
            <label className="text-[12px] text-muted sm:col-span-2">Root cause
              <input className="app-input mt-1 h-9 w-full text-[13px]" defaultValue={selected.rootCause} key={`${selected._id}-r`} onBlur={(e) => save(selected._id, { rootCause: e.target.value })} />
            </label>
          </div>
          <p className="mt-3 text-[12px] text-muted">Started {fmt(selected.startedAt)} · Resolved {fmt(selected.resolvedAt)}</p>
          <ul className="mt-3 divide-y divide-line">
            {(selected.timeline || []).map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="py-2 text-[13px]">
                <span className="text-muted">{fmt(ev.at)}</span>
                <span className="ml-2 text-ink">{ev.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}

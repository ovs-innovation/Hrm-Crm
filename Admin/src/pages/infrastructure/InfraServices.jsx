import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const KINDS = ['docker', 'pm2', 'node', 'nginx', 'apache', 'mysql', 'postgresql', 'mongodb', 'redis', 'rabbitmq', 'other'];
const empty = { name: '', kind: 'node', status: 'unknown', version: '' };

export default function InfraServices() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try { setRows(await infraApi.listServices()); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  useEffect(() => { load(); }, []);

  return (
    <PageShell title="Services" description="Docker, PM2, databases and web servers" count={rows.length}
      actions={<button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add service</button>}>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Kind</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">CPU</th>
              <th className="px-4 py-2.5 font-medium">RAM</th>
              <th className="px-4 py-2.5 font-medium">Restarts</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No services.</td></tr>
            ) : rows.map((s) => (
              <tr key={s._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{s.name}<span className="ml-2 text-[12px] text-muted">{s.version}</span></td>
                <td className="px-4 py-3 text-muted">{s.kind}</td>
                <td className="px-4 py-3"><StatusPill value={s.status} /></td>
                <td className="px-4 py-3 text-muted">{s.cpuUsage}%</td>
                <td className="px-4 py-3 text-muted">{s.ramUsageMb} MB</td>
                <td className="px-4 py-3 text-muted">{s.restartCount}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <select
                    className="rounded border border-line px-2 py-1 text-[12px]"
                    value={s.status}
                    onChange={async (e) => { await infraApi.updateService(s._id, { status: e.target.value }); load(); }}
                  >
                    {['running', 'stopped', 'restarting', 'failed', 'unknown'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <button type="button" className="text-danger" onClick={async () => { if (window.confirm('Delete?')) { await infraApi.deleteService(s._id); load(); } }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded border border-line bg-surface p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await infraApi.createService(form);
              toast.success('Service added');
              setOpen(false);
              setForm(empty);
              load();
            }}
          >
            <h3 className="font-semibold text-ink">Add service</h3>
            <input required className="app-input h-9 w-full text-[13px]" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="app-input h-9 w-full text-[13px]" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <input className="app-input h-9 w-full text-[13px]" placeholder="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
}

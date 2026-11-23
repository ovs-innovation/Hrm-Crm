import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const empty = { name: '', hostname: '', provider: 'local', ipAddress: '', region: '', agentBaseUrl: '', notes: '' };

const fmtPct = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : `${v}%`);

export default function InfraServers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await infraApi.listServers());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await infraApi.createServer(form);
      toast.success('Server added');
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this server?')) return;
    await infraApi.deleteServer(id);
    load();
  };

  return (
    <PageShell
      title="Servers"
      description="VPS inventory. Metrics from Hostinger API and/or the infra-agent (push or pull)."
      count={rows.length}
      actions={
        <>
          <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={async () => {
            try {
              const r = await infraApi.syncServers();
              toast.success(`Synced ${r.synced} · ${r.created} new`);
              load();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Sync failed');
            }
          }}>Sync provider</button>
          <button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add server</button>
        </>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">CPU / RAM / Disk</th>
              <th className="px-4 py-2.5 font-medium">Last check</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No servers yet.</td></tr>
            ) : rows.map((s) => (
              <tr key={s._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-[12px] text-muted">{s.hostname || s.ipAddress || '—'}</p>
                </td>
                <td className="px-4 py-3 text-muted">{s.provider}</td>
                <td className="px-4 py-3"><StatusPill value={s.status} /></td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {fmtPct(s.latestMetrics?.cpuUsage)} / {fmtPct(s.latestMetrics?.ramUsage)} / {fmtPct(s.latestMetrics?.diskUsage)}
                </td>
                <td className="px-4 py-3 text-muted">{s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-danger" onClick={() => remove(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add server" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Hostname" value={form.hostname} onChange={(v) => setForm({ ...form, hostname: v })} />
            <label className="block text-[12px] text-muted">Provider
              <select className="app-input mt-1 h-9 w-full text-[13px]" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                {['local', 'hostinger', 'aws', 'azure', 'digitalocean', 'hetzner', 'contabo', 'other'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <Field label="IP address" value={form.ipAddress} onChange={(v) => setForm({ ...form, ipAddress: v })} />
            <Field label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
            <Field
              label="Agent URL (optional)"
              value={form.agentBaseUrl}
              onChange={(v) => setForm({ ...form, agentBaseUrl: v })}
              placeholder="http://vps-ip:9100"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </PageShell>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
      <div className="w-full max-w-md rounded border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <label className="block text-[12px] text-muted">
      {label}
      <input
        required={required}
        placeholder={placeholder}
        className="app-input mt-1 h-9 w-full text-[13px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

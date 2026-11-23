import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const empty = {
  name: '', domain: '', environment: 'production', protocol: 'https',
  port: '', healthPath: '/health', autoPing: true,
};

const rtColor = (ms) => {
  if (ms == null) return 'text-muted';
  if (ms < 500) return 'text-emerald-700';
  if (ms <= 1500) return 'text-amber-700';
  return 'text-rose-700';
};

export default function InfraWebsites() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await infraApi.listWebsites()); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await infraApi.createWebsite({
        ...form,
        port: form.port === '' ? null : Number(form.port),
      });
      toast.success('Website added');
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    }
  };

  const check = async (id) => {
    const toastId = toast.loading('Checking…');
    try {
      await infraApi.checkWebsite(id);
      toast.success('Check complete', { id: toastId });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check failed', { id: toastId });
    }
  };

  return (
    <PageShell
      title="Websites"
      description="HTTP/HTTPS health checks with optional /health endpoints"
      count={rows.length}
      actions={<button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add website</button>}
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Website</th>
              <th className="px-4 py-2.5 font-medium">Env</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">HTTP</th>
              <th className="px-4 py-2.5 font-medium">Response</th>
              <th className="px-4 py-2.5 font-medium">SSL</th>
              <th className="px-4 py-2.5 font-medium">Uptime</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">No websites configured.</td></tr>
            ) : rows.map((w) => (
              <tr key={w._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{w.name}</p>
                  <p className="text-[12px] text-muted">{w.protocol}://{w.domain}{w.port ? `:${w.port}` : ''}{w.healthPath}</p>
                </td>
                <td className="px-4 py-3 text-muted">{w.environment}</td>
                <td className="px-4 py-3"><StatusPill value={w.status} /></td>
                <td className="px-4 py-3 text-muted">{w.httpStatus ?? '—'}</td>
                <td className={`px-4 py-3 tabular-nums font-medium ${rtColor(w.responseTimeMs)}`}>
                  {w.responseTimeMs != null ? `${w.responseTimeMs} ms` : '—'}
                </td>
                <td className="px-4 py-3"><StatusPill value={w.sslStatus} /></td>
                <td className="px-4 py-3 tabular-nums text-muted">{w.uptimePercent ?? 100}%</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" className="text-brand" onClick={() => check(w._id)}>Check</button>
                  <button type="button" className="text-danger" onClick={async () => { if (window.confirm('Delete?')) { await infraApi.deleteWebsite(w._id); load(); } }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded border border-line bg-surface p-4">
            <h3 className="font-semibold text-ink">Add website</h3>
            <input required placeholder="Name" className="app-input h-9 w-full text-[13px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required placeholder="domain.com" className="app-input h-9 w-full text-[13px]" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="app-input h-9 text-[13px]" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                <option value="https">https</option>
                <option value="http">http</option>
              </select>
              <input placeholder="Port (optional)" className="app-input h-9 text-[13px]" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            </div>
            <input placeholder="Health path /health" className="app-input h-9 w-full text-[13px]" value={form.healthPath} onChange={(e) => setForm({ ...form, healthPath: e.target.value })} />
            <select className="app-input h-9 w-full text-[13px]" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              {['production', 'staging', 'development', 'other'].map((x) => <option key={x}>{x}</option>)}
            </select>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={form.autoPing} onChange={(e) => setForm({ ...form, autoPing: e.target.checked })} /> Auto ping
            </label>
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

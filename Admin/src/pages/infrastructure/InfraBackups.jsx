import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const empty = { name: '', location: '', status: 'unknown', sizeBytes: 0, retentionDays: 14, lastBackupAt: '', nextBackupAt: '', durationSec: 0 };

const fmtSize = (n) => {
  const v = Number(n) || 0;
  if (v > 1e9) return `${(v / 1e9).toFixed(2)} GB`;
  if (v > 1e6) return `${(v / 1e6).toFixed(1)} MB`;
  return `${v} B`;
};

export default function InfraBackups() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try { setRows(await infraApi.listBackups()); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  useEffect(() => { load(); }, []);

  return (
    <PageShell title="Backups" description="Last run, size, retention and next schedule" count={rows.length}
      actions={<button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add backup</button>}>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Size</th>
              <th className="px-4 py-2.5 font-medium">Location</th>
              <th className="px-4 py-2.5 font-medium">Last</th>
              <th className="px-4 py-2.5 font-medium">Next</th>
              <th className="px-4 py-2.5 font-medium">Retention</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">No backups tracked.</td></tr>
            ) : rows.map((b) => (
              <tr key={b._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{b.name}</td>
                <td className="px-4 py-3"><StatusPill value={b.status} /></td>
                <td className="px-4 py-3 text-muted">{fmtSize(b.sizeBytes)}</td>
                <td className="px-4 py-3 text-muted">{b.location || '—'}</td>
                <td className="px-4 py-3 text-muted">{b.lastBackupAt ? new Date(b.lastBackupAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-muted">{b.nextBackupAt ? new Date(b.nextBackupAt).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-muted">{b.retentionDays}d</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-danger" onClick={async () => { if (window.confirm('Delete?')) { await infraApi.deleteBackup(b._id); load(); } }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <form className="w-full max-w-md space-y-3 rounded border border-line bg-surface p-4" onSubmit={async (e) => {
            e.preventDefault();
            await infraApi.createBackup({
              ...form,
              sizeBytes: Number(form.sizeBytes) || 0,
              durationSec: Number(form.durationSec) || 0,
            });
            toast.success('Backup record added');
            setOpen(false); setForm(empty); load();
          }}>
            <h3 className="font-semibold text-ink">Add backup</h3>
            <input required className="app-input h-9 w-full text-[13px]" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="app-input h-9 w-full text-[13px]" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['success', 'failed', 'running', 'unknown'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="app-input h-9 w-full text-[13px]" placeholder="Location / path / bucket" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input type="number" className="app-input h-9 w-full text-[13px]" placeholder="Size bytes" value={form.sizeBytes} onChange={(e) => setForm({ ...form, sizeBytes: e.target.value })} />
            <label className="block text-[12px] text-muted">Last backup<input type="datetime-local" className="app-input mt-1 h-9 w-full text-[13px]" value={form.lastBackupAt} onChange={(e) => setForm({ ...form, lastBackupAt: e.target.value })} /></label>
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

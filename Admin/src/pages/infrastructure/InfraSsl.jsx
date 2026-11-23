import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import toast from 'react-hot-toast';

const empty = { domain: '', provider: '', issuedDate: '', expiryDate: '', autoRenewal: false };

export default function InfraSsl() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try { setRows(await infraApi.listSsl()); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  useEffect(() => { load(); }, []);

  const tone = (days) => {
    if (days == null) return 'text-muted';
    if (days < 0) return 'text-rose-700';
    if (days <= 7) return 'text-rose-700';
    if (days <= 30) return 'text-amber-700';
    return 'text-emerald-700';
  };

  return (
    <PageShell title="SSL Certificates" description="Live certificate reads from TLS — no hardcoded dates" count={rows.length}
      actions={
        <>
          <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={async () => {
            try {
              await infraApi.refreshSsl();
              toast.success('SSL refreshed from live certificates');
              load();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Refresh failed');
            }
          }}>Refresh live</button>
          <button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add certificate</button>
        </>
      }>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Domain</th>
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Issued</th>
              <th className="px-4 py-2.5 font-medium">Expiry</th>
              <th className="px-4 py-2.5 font-medium">Days left</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No SSL records.</td></tr>
            ) : rows.map((s) => (
              <tr key={s._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{s.domain}</td>
                <td className="px-4 py-3 text-muted">{s.provider || '—'}</td>
                <td className="px-4 py-3 text-muted">{s.issuedDate ? new Date(s.issuedDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-muted">{s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : '—'}</td>
                <td className={`px-4 py-3 tabular-nums font-medium ${tone(s.daysRemaining)}`}>{s.daysRemaining ?? '—'}</td>
                <td className="px-4 py-3"><StatusPill value={s.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-danger" onClick={async () => { if (window.confirm('Delete?')) { await infraApi.deleteSsl(s._id); load(); } }}>Delete</button>
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
            await infraApi.createSsl(form);
            toast.success('SSL record added');
            setOpen(false); setForm(empty); load();
          }}>
            <h3 className="font-semibold text-ink">Add SSL certificate</h3>
            <p className="text-[12px] text-muted">Leave dates empty to read issued/expiry from the live TLS certificate.</p>
            <input required className="app-input h-9 w-full text-[13px]" placeholder="domain.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <input className="app-input h-9 w-full text-[13px]" placeholder="Provider (optional — filled from cert issuer)" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            <label className="block text-[12px] text-muted">Issued (optional)<input type="date" className="app-input mt-1 h-9 w-full text-[13px]" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></label>
            <label className="block text-[12px] text-muted">Expiry (optional)<input type="date" className="app-input mt-1 h-9 w-full text-[13px]" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></label>
            <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={form.autoRenewal} onChange={(e) => setForm({ ...form, autoRenewal: e.target.checked })} /> Auto renewal</label>
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

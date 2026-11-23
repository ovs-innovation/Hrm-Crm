import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import toast from 'react-hot-toast';

const empty = { domain: '', registrar: '', expiryDate: '', renewalDate: '', autoRenewal: false, reminderDaysBefore: 30, owner: '', clientName: '', clientEmail: '', notes: '' };

const plainStatus = (d) => {
  if (d.daysRemaining == null) return 'Expiry unknown';
  if (d.daysRemaining < 0) return 'Expired';
  if (d.daysRemaining <= 5) return `${d.daysRemaining} days left`;
  return 'OK';
};

export default function InfraDomains() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try { setRows(await infraApi.listDomains()); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  useEffect(() => { load(); }, []);

  return (
    <PageShell title="Domains" description="Add the client email here. When 5 days are left, you get an alert first. The client gets a mail only after you approve." count={rows.length}
      actions={
        <>
          <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={async () => {
            try {
              await infraApi.refreshDomains();
              toast.success('Domains refreshed via RDAP / metadata');
              load();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Refresh failed');
            }
          }}>Refresh live</button>
          <button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={() => setOpen(true)}>Add domain</button>
        </>
      }>
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Domain</th>
              <th className="px-4 py-2.5 font-medium">Registrar</th>
              <th className="px-4 py-2.5 font-medium">Expiry</th>
              <th className="px-4 py-2.5 font-medium">Days left</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">What this means</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No domains.</td></tr>
            ) : rows.map((d) => (
              <tr key={d._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{d.domain}</td>
                <td className="px-4 py-3 text-muted">{d.registrar || '—'}</td>
                <td className="px-4 py-3 text-muted">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{d.daysRemaining ?? '—'}</td>
                <td className="px-4 py-3">
                  <input className="app-input mb-1 h-8 w-full text-[12px]" placeholder="Client name" defaultValue={d.clientName || ''} onBlur={(e) => { if (e.target.value !== (d.clientName || '')) infraApi.updateDomain(d._id, { clientName: e.target.value }).then(load); }} />
                  <input type="email" className="app-input h-8 w-full text-[12px]" placeholder="Client email" defaultValue={d.clientEmail || ''} onBlur={(e) => { if (e.target.value !== (d.clientEmail || '')) infraApi.updateDomain(d._id, { clientEmail: e.target.value }).then(load); }} />
                </td>
                <td className="px-4 py-3 text-ink">{plainStatus(d)}{d.clientMailStatus === 'pending' ? ' · waiting for your approval' : ''}{d.clientMailStatus === 'sent' ? ' · email sent' : ''}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {d.clientMailStatus === 'pending' && (
                    <button type="button" className="text-brand" onClick={async () => {
                      try {
                        await infraApi.approveDomainMail(d._id);
                        toast.success('Email sent to the client');
                        load();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Could not send');
                      }
                    }}>Send email</button>
                  )}
                  <button type="button" className="text-danger" onClick={async () => { if (window.confirm('Delete?')) { await infraApi.deleteDomain(d._id); load(); } }}>Delete</button>
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
            await infraApi.createDomain(form);
            toast.success('Domain added');
            setOpen(false); setForm(empty); load();
          }}>
            <h3 className="font-semibold text-ink">Add domain</h3>
            <p className="text-[12px] text-muted">Leave expiry empty to look up via RDAP.</p>
            <input required className="app-input h-9 w-full text-[13px]" placeholder="example.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <input className="app-input h-9 w-full text-[13px]" placeholder="Registrar (optional)" value={form.registrar} onChange={(e) => setForm({ ...form, registrar: e.target.value })} />
            <input className="app-input h-9 w-full text-[13px]" placeholder="Client name" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            <input type="email" className="app-input h-9 w-full text-[13px]" placeholder="Client email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            <label className="block text-[12px] text-muted">Expiry date (optional if RDAP works)
              <input type="date" className="app-input mt-1 h-9 w-full text-[13px]" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </label>
            <label className="block text-[12px] text-muted">Reminder days before
              <input type="number" className="app-input mt-1 h-9 w-full text-[13px]" value={form.reminderDaysBefore} onChange={(e) => setForm({ ...form, reminderDaysBefore: Number(e.target.value) })} />
            </label>
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

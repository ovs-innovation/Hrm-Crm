import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const Settings = () => {
  const [form, setForm] = useState({
    companyName: '', legalName: '', email: '', phone: '', website: '', address: '', city: '', country: 'India',
    currency: 'INR', timezone: 'Asia/Kolkata', fiscalYearStart: '04-01', taxId: '',
    leavePolicy: { annualQuota: 18, carryForward: true },
    attendancePolicy: { workStart: '09:00', workEnd: '18:00', graceMinutes: 15 },
  });
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          api.get('/settings/company'),
          api.get('/audit?limit=20'),
        ]);
        setForm((f) => ({ ...f, ...sRes.data, leavePolicy: { ...f.leavePolicy, ...sRes.data.leavePolicy }, attendancePolicy: { ...f.attendancePolicy, ...sRes.data.attendancePolicy } }));
        setAudit(aRes.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setNested = (parent, key, val) => setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: val } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings/company', form);
      setForm((f) => ({ ...f, ...data }));
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageShell title="Settings" description="Company configuration"><p className="text-muted">Loading…</p></PageShell>;
  }

  return (
    <PageShell title="Settings" description="Company profile, policies, and audit trail">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <form onSubmit={save} className="space-y-4">
          <section className="rounded border border-line bg-surface p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Company profile</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company name" value={form.companyName} onChange={(v) => set('companyName', v)} />
              <Field label="Legal name" value={form.legalName} onChange={(v) => set('legalName', v)} />
              <Field label="Email" value={form.email} onChange={(v) => set('email', v)} />
              <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
              <Field label="Website" value={form.website} onChange={(v) => set('website', v)} />
              <Field label="Tax ID / GSTIN" value={form.taxId} onChange={(v) => set('taxId', v)} />
              <Field label="Address" value={form.address} onChange={(v) => set('address', v)} className="sm:col-span-2" />
              <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="Country" value={form.country} onChange={(v) => set('country', v)} />
            </div>
          </section>

          <section className="rounded border border-line bg-surface p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Regional & finance</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Currency" value={form.currency} onChange={(v) => set('currency', v)} />
              <Field label="Timezone" value={form.timezone} onChange={(v) => set('timezone', v)} />
              <Field label="Fiscal year start (MM-DD)" value={form.fiscalYearStart} onChange={(v) => set('fiscalYearStart', v)} />
            </div>
          </section>

          <section className="rounded border border-line bg-surface p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ink">HR policies</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Annual leave quota" type="number" value={form.leavePolicy?.annualQuota} onChange={(v) => setNested('leavePolicy', 'annualQuota', Number(v))} />
              <label className="flex items-center gap-2 text-[13px] text-ink">
                <input type="checkbox" checked={!!form.leavePolicy?.carryForward} onChange={(e) => setNested('leavePolicy', 'carryForward', e.target.checked)} />
                Allow leave carry forward
              </label>
              <Field label="Work start" value={form.attendancePolicy?.workStart} onChange={(v) => setNested('attendancePolicy', 'workStart', v)} />
              <Field label="Work end" value={form.attendancePolicy?.workEnd} onChange={(v) => setNested('attendancePolicy', 'workEnd', v)} />
              <Field label="Grace minutes" type="number" value={form.attendancePolicy?.graceMinutes} onChange={(v) => setNested('attendancePolicy', 'graceMinutes', Number(v))} />
            </div>
          </section>

          <button type="submit" disabled={saving} className="btn-primary h-9 px-4 text-[13px]">{saving ? 'Saving…' : 'Save settings'}</button>
        </form>

        <aside className="rounded border border-line bg-surface p-4">
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Recent audit log</h2>
          {audit.length === 0 ? (
            <p className="text-[13px] text-muted">No activity logged yet.</p>
          ) : (
            <ul className="max-h-[520px] space-y-2 overflow-y-auto">
              {audit.map((log) => (
                <li key={log._id} className="rounded border border-line bg-soft/40 px-2.5 py-2">
                  <p className="text-[12px] font-medium text-ink">{log.action}</p>
                  <p className="text-[11px] text-muted">{log.module} · {log.userName || 'System'}</p>
                  <p className="text-[11px] text-muted">{new Date(log.createdAt).toLocaleString('en-IN')}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </PageShell>
  );
};

const Field = ({ label, value, onChange, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="app-label mb-1 block text-[13px]">{label}</label>
    <input type={type} className="app-input h-9 w-full text-[13px]" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default Settings;

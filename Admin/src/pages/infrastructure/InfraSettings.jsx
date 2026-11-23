import React, { useEffect, useState } from 'react';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import toast from 'react-hot-toast';

export default function InfraSettings() {
  const [form, setForm] = useState(null);
  const [providerToken, setProviderToken] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState('');

  const load = async () => {
    try {
      setForm(await infraApi.settings());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load settings');
    }
  };

  useEffect(() => { load(); }, []);

  if (!form) return <PageShell title="Infrastructure settings"><p className="text-[13px] text-muted">Loading…</p></PageShell>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setChannel = (name, patch) => setForm((f) => ({
    ...f,
    notifications: { ...f.notifications, [name]: { ...f.notifications?.[name], ...patch } },
  }));

  const save = async () => {
    try {
      const body = {
        ...form,
        providerApiToken: providerToken || undefined,
      };
      const res = await infraApi.updateSettings(body);
      setForm(res.settings);
      setProviderToken('');
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <PageShell
      title="Infrastructure settings"
      description="Polling intervals, providers, thresholds and notification channels"
      actions={<button type="button" className="btn-primary h-8 px-3 text-[13px]" onClick={save}>Save</button>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded border border-line bg-surface p-4">
          <h3 className="text-[13px] font-semibold text-ink">Provider</h3>
          <label className="block text-[12px] text-muted">Monitoring provider
            <select className="app-input mt-1 h-9 w-full text-[13px]" value={form.provider} onChange={(e) => set('provider', e.target.value)}>
              {['local', 'hostinger', 'aws', 'azure', 'digitalocean', 'hetzner', 'contabo'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-[12px] text-muted">Provider API token {form.hasProviderApiToken ? `(${form.providerApiTokenMasked})` : ''}
            <input type="password" className="app-input mt-1 h-9 w-full text-[13px]" placeholder="Paste to update" value={providerToken} onChange={(e) => setProviderToken(e.target.value)} autoComplete="off" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={async () => {
              try {
                const r = await infraApi.testProvider();
                toast[r.ok ? 'success' : 'error'](r.message);
              } catch (err) { toast.error(err.response?.data?.message || 'Test failed'); }
            }}>Test provider</button>
            <button type="button" className="btn-outline h-8 px-3 text-[13px]" onClick={async () => {
              const res = await infraApi.updateSettings({ generateAgentIngestToken: true });
              setForm(res.settings);
              setGeneratedAgent(res.generatedAgentToken || '');
              toast.success('Agent token generated — copy it now');
            }}>Generate agent token</button>
          </div>
          {generatedAgent && (
            <p className="break-all rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
              Agent token (shown once): <code>{generatedAgent}</code>
            </p>
          )}
          <p className="text-[12px] text-muted">
            Agent POST <code className="text-ink">/api/infrastructure/agent/metrics</code> with header <code className="text-ink">x-infra-agent-token</code>.
          </p>
        </section>

        <section className="space-y-3 rounded border border-line bg-surface p-4">
          <h3 className="text-[13px] font-semibold text-ink">Intervals & thresholds</h3>
          {[
            ['pollingIntervalSec', 'Default polling (sec)'],
            ['websiteCheckIntervalSec', 'Website check (sec)'],
            ['serverMetricsIntervalSec', 'Server metrics (sec)'],
            ['backupCheckIntervalSec', 'Backup status (sec)'],
            ['logRetentionDays', 'Log retention (days)'],
            ['metricRetentionDays', 'Metric retention (days)'],
            ['cpuAlertThreshold', 'CPU alert %'],
            ['ramAlertThreshold', 'RAM alert %'],
            ['diskAlertThreshold', 'Disk alert %'],
            ['slowResponseMs', 'Slow website ms'],
          ].map(([key, label]) => (
            <label key={key} className="block text-[12px] text-muted">{label}
              <input type="number" className="app-input mt-1 h-9 w-full text-[13px]" value={form[key] ?? ''} onChange={(e) => set(key, Number(e.target.value))} />
            </label>
          ))}
        </section>

        <section className="space-y-3 rounded border border-line bg-surface p-4 lg:col-span-2">
          <h3 className="text-[13px] font-semibold text-ink">Notification channels</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['email', 'whatsapp', 'slack', 'telegram', 'webhook'].map((name) => (
              <div key={name} className="rounded border border-line p-3">
                <label className="flex items-center gap-2 text-[13px] font-medium capitalize text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(form.notifications?.[name]?.enabled)}
                    onChange={(e) => setChannel(name, { enabled: e.target.checked })}
                  />
                  {name}
                </label>
                <input
                  className="app-input mt-2 h-9 w-full text-[13px]"
                  placeholder={name === 'telegram' ? 'botToken:chatId' : name === 'email' ? 'ops@company.com' : 'URL / phone'}
                  value={form.notifications?.[name]?.target || ''}
                  onChange={(e) => setChannel(name, { target: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

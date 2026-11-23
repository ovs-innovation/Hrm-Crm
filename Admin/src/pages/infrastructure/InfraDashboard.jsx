import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { infraApi } from '../../features/infrastructure/services/infraApi';
import StatusPill from '../../features/infrastructure/components/StatusPill';
import InfraSparkline from '../../features/infrastructure/components/InfraSparkline';
import toast from 'react-hot-toast';

const fmtUptime = (sec) => {
  if (sec == null || sec === '') return '—';
  const s = Number(sec);
  if (!Number.isFinite(s)) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((s % 3600) / 60)}m`;
};

const fmtPct = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : `${v}%`);
const fmtNum = (v, suffix = '') => (v == null || Number.isNaN(Number(v)) ? '—' : `${v}${suffix}`);
const fmtNet = (up, down) => {
  if (up == null && down == null) return '—';
  return `${up ?? '—'} / ${down ?? '—'}`;
};

export default function InfraDashboard() {
  const [data, setData] = useState(null);
  const [cpuSeries, setCpuSeries] = useState([]);
  const [ramSeries, setRamSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dash, cpu, ram] = await Promise.all([
        infraApi.dashboard(),
        infraApi.metrics({ kind: 'cpu', range: '24h' }).catch(() => ({ points: [] })),
        infraApi.metrics({ kind: 'ram', range: '24h' }).catch(() => ({ points: [] })),
      ]);
      setData(dash);
      setCpuSeries(cpu.points || []);
      setRamSeries(ram.points || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load infrastructure dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const r = data?.resources || {};
  const c = data?.counts || {};

  return (
    <PageShell
      title="Infrastructure"
      description="A simple view of your server, websites, and domains. Numbers refresh every 30 seconds."
      actions={
        <button type="button" onClick={load} className="btn-outline h-8 px-3 text-[13px]">
          Refresh
        </button>
      }
    >
      {loading && !data ? (
        <p className="text-[13px] text-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          {(data?.fleet || []).map((server) => (
            <div key={server.id} className="rounded border border-line bg-surface p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-ink">{server.name}</h3>
                  <p className="text-[12px] text-muted">
                    {[server.hostname, server.ipAddress, server.osVersion, server.provider].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <StatusPill value={server.status} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ProcessList title="PM2" rows={server.pm2} />
                <ProcessList title="Docker" rows={server.docker} />
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Metrics {server.collectedAt ? new Date(server.collectedAt).toLocaleString() : '—'}
              </p>
            </div>
          ))}

          {data?.business && (
            <div className="rounded border border-line bg-surface p-4">
              <h3 className="mb-3 text-[13px] font-semibold text-ink">Today</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Websites" value={data.business.websites ?? '—'} sub={`${data.business.websitesOnline ?? 0} online · ${data.business.websitesDown ?? 0} down`} />
                <Kpi label="Domains" value={data.business.domains ?? '—'} sub={`${data.business.domainRenewals ?? 0} renewals`} />
                <Kpi label="SSL" value={data.business.ssl ?? '—'} sub={`${data.business.sslExpiring ?? 0} in 30 days`} />
                <Kpi label="Critical alerts" value={data.business.criticalAlerts ?? '—'} />
              </div>
              {(data.health?.reasons || []).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {data.health.reasons.map((reason) => (
                    <li key={reason.key} className="rounded border border-line px-2 py-1 text-[12px] text-ink">
                      {reason.level === 'ok' ? '✔' : '⚠'} {reason.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="System health" value={data?.health?.score == null ? '—' : `${data.health.score}`} sub={data?.health?.label} />
            <Kpi label="Servers online" value={`${c.serversOnline ?? 0}/${c.servers ?? 0}`} />
            <Kpi label="Websites online" value={`${c.websitesOnline ?? 0}`} sub={`${c.websitesOffline ?? 0} offline`} />
            <Kpi label="Services running" value={`${c.servicesRunning ?? 0}/${c.services ?? 0}`} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="CPU" value={fmtPct(r.cpuUsage)} />
            <Kpi label="RAM" value={fmtPct(r.ramUsage)} />
            <Kpi label="Disk" value={fmtPct(r.diskUsage)} />
            <Kpi label="Swap" value={fmtPct(r.swapUsage)} />
            <Kpi label="Net ↑ / ↓" value={fmtNet(r.networkUploadMbps, r.networkDownloadMbps)} sub="Mbps" />
            <Kpi label="Bandwidth" value={fmtNum(r.bandwidthUsageGb)} sub="GB used" />
            <Kpi
              label="Load avg"
              value={
                Array.isArray(r.loadAverage) && r.loadAverage.some((n) => n != null)
                  ? r.loadAverage.map((n) => (n == null ? '—' : Number(n).toFixed(2))).join(' ')
                  : '—'
              }
            />
            <Kpi label="Uptime" value={fmtUptime(r.uptimeSec)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-ink">CPU · 24h</h3>
                <Link to="/infrastructure/servers" className="text-[12px] text-brand">Servers</Link>
              </div>
              <InfraSparkline points={cpuSeries} />
            </div>
            <div className="rounded border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-ink">RAM · 24h</h3>
                <Link to="/infrastructure/logs" className="text-[12px] text-brand">Logs</Link>
              </div>
              <InfraSparkline points={ramSeries} stroke="#0F766E" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="SSL expiring soon" to="/infrastructure/ssl">
              {(data?.sslExpiringSoon || []).length === 0 ? (
                <p className="text-[13px] text-muted">No certificates in the 30-day window.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.sslExpiringSoon.map((s) => (
                    <li key={s._id} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="text-ink">{s.domain}</span>
                      <span className="text-muted">{s.daysRemaining}d · <StatusPill value={s.status} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Upcoming domain renewals" to="/infrastructure/domains">
              {(data?.upcomingRenewals || []).length === 0 ? (
                <p className="text-[13px] text-muted">No renewals in the next 45 days.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcomingRenewals.map((d) => (
                    <li key={d._id} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="text-ink">{d.domain}</span>
                      <span className="text-muted">{d.daysRemaining}d</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Cron" to="/infrastructure/servers">
            {(data?.cronJobs || []).length === 0 ? (
              <p className="text-[13px] text-muted">No cron inventory yet. The agent reads /etc/cron.d on the next push.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.cronJobs.map((job, i) => (
                  <li key={`${job.server}-${job.name}-${job.schedule || i}`} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                    <span className="text-ink">{job.name}</span>
                    <span className="text-right text-muted">
                      {job.status === 'scheduled' || job.status === 'installed' ? '✔' : '—'} {job.source}
                      {job.schedule ? ` · ${job.schedule}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Recent alerts" to="/infrastructure/alerts">
              {(data?.recentAlerts || []).length === 0 ? (
                <p className="text-[13px] text-muted">No alerts.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.recentAlerts.slice(0, 8).map((a) => (
                    <li key={a._id} className="py-2 text-[13px]">
                      <div className="flex items-center gap-2">
                        <StatusPill value={a.severity} />
                        <span className="font-medium text-ink">{a.title}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">{a.resolved ? 'Resolved' : 'Open'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Recent logs" to="/infrastructure/logs">
              {(data?.recentLogs || []).length === 0 ? (
                <p className="text-[13px] text-muted">No logs yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.recentLogs.slice(0, 8).map((l) => (
                    <li key={l._id} className="py-2 text-[13px] text-ink">
                      <p className="line-clamp-2">{l.message}</p>
                      <p className="mt-0.5 text-[12px] text-muted">{l.category} · {l.level}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <p className="text-[11px] text-muted">
            Last refresh {data?.refreshedAt ? new Date(data.refreshedAt).toLocaleString() : '—'}
            {data?.cached ? ' · cached' : ''}
          </p>
        </div>
      )}
    </PageShell>
  );
}

const Kpi = ({ label, value, sub }) => (
  <div className="rounded border border-line bg-surface px-4 py-3">
    <p className="text-[12px] text-muted">{label}</p>
    <p className="mt-1 text-[20px] font-semibold tabular-nums text-ink">{value}</p>
    {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
  </div>
);

const ProcessList = ({ title, rows }) => (
  <div>
    <p className="mb-1 text-[12px] font-medium text-muted">{title} · {rows?.length || 0}</p>
    {!rows?.length ? (
      <p className="text-[13px] text-muted">—</p>
    ) : (
      <ul className="max-h-48 divide-y divide-line overflow-auto">
        {rows.map((row) => (
          <li key={row.name || row.id} className="flex items-center justify-between py-1.5 text-[13px]">
            <span className="text-ink">{row.name}</span>
            <span className="text-muted">
              {row.status || '—'}
              {row.cpu != null ? ` · ${row.cpu}%` : ''}
              {row.memoryMb != null ? ` · ${row.memoryMb} MB` : ''}
              {row.restarts != null ? ` · restarts ${row.restarts}` : ''}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Panel = ({ title, to, children }) => (
  <div className="rounded border border-line bg-surface p-4">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {to && <Link to={to} className="text-[12px] text-brand">View all</Link>}
    </div>
    {children}
  </div>
);

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'ytd', label: 'YTD' },
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatPct = (n) => `${n ?? 0}%`;

const STAGE_COLORS = {
  Qualification: 'bg-slate-400',
  Proposal: 'bg-brand-light',
  Negotiation: 'bg-brand',
  'Closed Won': 'bg-success',
  'Closed Lost': 'bg-danger',
};

const KpiCard = ({ label, value, sub, icon: Icon, accent = 'brand', to }) => {
  const accentBorder = { brand: 'bg-brand', success: 'bg-success', warning: 'bg-warning', navy: 'bg-navy' };
  const accentIcon = {
    brand: 'border-brand bg-brand/5 text-brand',
    success: 'border-success bg-success/5 text-success',
    warning: 'border-warning bg-warning/5 text-warning',
    navy: 'border-navy bg-soft text-navy',
  };
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper
      to={to}
      className={`group relative overflow-hidden rounded-lg border border-line bg-surface p-4 transition hover:border-brand/25 hover:shadow-sm ${to ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${accentBorder[accent] || accentBorder.brand}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-[26px] font-semibold leading-none tabular-nums tracking-tight text-ink">{value}</p>
          {sub && <p className="mt-2 text-[12px] text-muted">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accentIcon[accent] || accentIcon.brand}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      {to && (
        <span className="mt-3 inline-flex items-center gap-1 pl-2 text-[12px] font-medium text-brand opacity-0 transition group-hover:opacity-100">
          View details <FiArrowUpRight className="h-3 w-3" />
        </span>
      )}
    </Wrapper>
  );
};

const BarChart = ({ items, max, valueKey = 'count', labelKey = 'label', formatValue }) => (
  <div className="flex h-[180px] items-end justify-between gap-2 px-1 pt-4">
    {items.map((item) => {
      const val = item[valueKey] ?? 0;
      const height = max ? Math.max(8, (val / max) * 100) : 8;
      return (
        <div key={item[labelKey]} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-[11px] font-medium tabular-nums text-muted">{formatValue ? formatValue(val) : val}</span>
          <div className="flex w-full flex-1 items-end">
            <div className="w-full rounded-t bg-brand/85 transition-all duration-500 hover:bg-brand" style={{ height: `${height}%`, minHeight: 8 }} />
          </div>
          <span className="truncate text-[10px] text-muted">{item[labelKey]}</span>
        </div>
      );
    })}
  </div>
);

const HorizontalBars = ({ items, max, labelKey, valueKey, valueFormat }) => (
  <div className="space-y-3">
    {items.map((item) => {
      const val = item[valueKey] ?? 0;
      const pct = max ? (val / max) * 100 : 0;
      return (
        <div key={item[labelKey]}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="font-medium text-ink">{item[labelKey]}</span>
            <span className="tabular-nums text-muted">{valueFormat ? valueFormat(val) : val}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-soft">
            <div className={`h-full rounded-full ${item.color || 'bg-brand'}`} style={{ width: `${Math.max(pct, val > 0 ? 4 : 0)}%` }} />
          </div>
        </div>
      );
    })}
  </div>
);

const StatusPills = ({ items }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <div key={item.status} className="rounded-lg border border-line bg-soft px-3 py-2">
        <p className="text-[11px] text-muted">{item.status}</p>
        <p className="text-lg font-semibold tabular-nums text-ink">{item.count}</p>
      </div>
    ))}
  </div>
);

const Panel = ({ title, action, children, className = '' }) => (
  <section className={`rounded-lg border border-line bg-surface ${className}`}>
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const Analytics = () => {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get(`/dashboard/reports?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const crm = data?.crm;
  const hrm = data?.hrm;

  const exportSnapshot = () => {
    if (!crm) return;
    const rows = [
      ['Vastora Analytics Snapshot', data.generatedAt, `Range: ${range}`],
      ['Pipeline value', crm.pipelineValue],
      ['Win rate', `${crm.winRate}%`],
      ['Leads', crm.leads],
      ['Employees', hrm?.employees],
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vastora-analytics-${range}.csv`;
    a.click();
  };

  const updatedLabel = data?.generatedAt
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))
    : '';

  return (
    <PageShell
      title="Analytics"
      description="Visual insights — trends, pipeline health, and workforce metrics"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${range === r.id ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => fetchData(true)} className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiRefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={exportSnapshot} disabled={!data} className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-[13px] disabled:opacity-50">
            <FiDownload className="h-3.5 w-3.5" /> Snapshot
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] text-ink">
          <FiBarChart2 className="h-4 w-4 text-brand" />
          <span>Charts & KPIs live here. Need row-level exports and registers?</span>
        </div>
        <Link to="/reports" className="shrink-0 text-[13px] font-medium text-brand hover:underline">Open Reports →</Link>
      </div>

      {updatedLabel && <p className="mb-4 text-[12px] text-muted">Last updated {updatedLabel}</p>}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg border border-line bg-surface" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Revenue won" value={formatINR(crm?.revenueWonInRange)} sub={`${formatINR(crm?.revenueWon)} all time`} icon={FiDollarSign} accent="success" to="/crm/deals" />
            <KpiCard label="Pipeline value" value={formatINR(crm?.pipelineValue)} sub={`${crm?.openDeals ?? 0} open deals`} icon={FiTrendingUp} accent="brand" to="/crm/deals" />
            <KpiCard label="Win rate" value={formatPct(crm?.winRate)} sub={`Avg deal ${formatINR(crm?.avgDealSize)}`} icon={FiTarget} accent="warning" />
            <KpiCard label="Workforce today" value={`${hrm?.presentToday ?? 0}/${hrm?.employees ?? 0}`} sub={`${hrm?.attendanceRate ?? 0}% attendance`} icon={FiUsers} accent="navy" to="/hrm/attendance" />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-12">
            <Panel title="Pipeline by stage" className="xl:col-span-5" action={<Link to="/reports" className="text-[12px] font-medium text-brand">Full pipeline report</Link>}>
              <HorizontalBars
                items={(crm?.pipelineByStage || []).map((row) => ({ label: row.stage, count: row.value, color: STAGE_COLORS[row.stage] }))}
                max={crm?.maxPipelineValue}
                labelKey="label"
                valueKey="count"
                valueFormat={(v) => formatINR(v)}
              />
              <div className="mt-4 space-y-2 border-t border-line pt-4">
                {[
                  { stage: 'Qualification', hint: '20% — validating need & budget' },
                  { stage: 'Proposal', hint: '50% — quote shared, awaiting review' },
                  { stage: 'Negotiation', hint: '75% — terms under discussion' },
                ].map(({ stage, hint }) => (
                  <div key={stage} className="flex items-center gap-2 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[stage]}`} />
                    <span className="font-medium text-ink">{stage}</span>
                    <span className="text-muted">{hint}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Deal activity (6 weeks)" className="xl:col-span-4">
              <BarChart items={crm?.weeklyDeals || []} max={crm?.maxWeeklyDeals} />
            </Panel>
            <Panel title="Lead capture" className="xl:col-span-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-soft p-3"><p className="text-[11px] text-muted">Leads</p><p className="text-xl font-semibold text-ink">{crm?.leads ?? 0}</p></div>
                <div className="rounded-lg bg-soft p-3"><p className="text-[11px] text-muted">New</p><p className="text-xl font-semibold text-ink">{crm?.newLeadsInRange ?? 0}</p></div>
                <div className="rounded-lg bg-soft p-3"><p className="text-[11px] text-muted">Accounts</p><p className="text-xl font-semibold text-ink">{crm?.accounts ?? 0}</p></div>
                <div className="rounded-lg bg-soft p-3"><p className="text-[11px] text-muted">Tasks due</p><p className="text-xl font-semibold text-ink">{crm?.tasksDue ?? 0}</p></div>
              </div>
              <p className="mb-2 mt-4 text-[12px] font-medium text-muted">Weekly new leads</p>
              <BarChart items={crm?.weeklyLeads || []} max={crm?.maxWeeklyLeads} />
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-12">
            <Panel title="Attendance trend (7 days)" className="xl:col-span-5">
              <BarChart items={(hrm?.attendanceTrend || []).map((d) => ({ label: d.label, count: d.present }))} max={hrm?.maxAttendance} />
            </Panel>
            <Panel title="Headcount by department" className="xl:col-span-4">
              <HorizontalBars items={(hrm?.departmentBreakdown || []).map((d) => ({ label: d.name, count: d.count }))} max={hrm?.maxDept} labelKey="label" valueKey="count" />
            </Panel>
            <Panel title="Operations snapshot" className="xl:col-span-3">
              <p className="mb-2 text-[12px] font-medium text-muted">Leaves</p>
              <StatusPills items={hrm?.leaveByStatus || []} />
              <p className="mb-2 mt-4 text-[12px] font-medium text-muted">Tickets</p>
              <StatusPills items={hrm?.ticketByStatus || []} />
            </Panel>
          </div>

          <Panel title="Recent deal momentum" className="mt-4" action={<Link to="/crm/deals" className="text-[12px] font-medium text-brand">All deals</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-2 font-medium">Deal</th>
                    <th className="pb-2 font-medium">Stage</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(crm?.recentDeals || []).length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-muted">No deal data yet.</td></tr>
                  ) : crm.recentDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-line last:border-0">
                      <td className="py-3 font-medium text-ink">{deal.title}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${STAGE_COLORS[deal.stage] || 'bg-brand'}`}>{deal.stage}</span></td>
                      <td className="py-3 text-right tabular-nums">{formatINR(deal.amount)}</td>
                      <td className="py-3 text-right text-muted">{new Date(deal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </PageShell>
  );
};

export default Analytics;

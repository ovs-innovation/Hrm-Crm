import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiTrendingUp,
  FiActivity,
  FiAlertCircle,
  FiTrendingDown,
  FiClock,
  FiPlay,
  FiCpu,
  FiTarget,
  FiCalendar,
  FiDollarSign,
  FiArrowUpRight,
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';

const BREAKDOWN = [
  ['sales', 'Sales'],
  ['hr', 'HR'],
  ['finance', 'Finance'],
  ['recruiting', 'Recruiting'],
  ['support', 'Support'],
];

const prettyWhen = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const inr = (value) => (value == null || value === '' ? '—' : `₹${Number(value).toLocaleString('en-IN')}`);
const count = (value) => (value == null || value === '' ? '—' : Number(value).toLocaleString('en-IN'));

const Panel = ({ title, hint, children, className = '' }) => (
  <section className={`flex flex-col rounded-2xl border border-line bg-surface shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
      <div>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
      </div>
    </div>
    <div className="flex-1 p-5">{children}</div>
  </section>
);

const StatCard = ({ to, icon: Icon, label, value, hint, loading, tone = 'plain' }) => {
  const solid = tone === 'brand' || tone === 'navy';
  const shell = tone === 'brand'
    ? 'brand-gradient text-white'
    : tone === 'navy'
      ? 'bg-navy text-white'
      : 'border border-line bg-surface text-ink hover:border-brand/40';
  const body = (
    <div className={`group flex h-full flex-col rounded-2xl p-5 shadow-sm transition hover:shadow-md ${shell}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[13px] font-medium ${solid ? 'text-white/80' : 'text-muted'}`}>{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${solid ? 'bg-white/15 text-white' : 'bg-brand-xlight text-brand'}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
      {loading ? (
        <div className={`mt-5 h-8 w-24 animate-pulse rounded-md ${solid ? 'bg-white/20' : 'bg-soft'}`} />
      ) : (
        <p className={`mt-4 text-[28px] font-semibold leading-none tabular-nums tracking-tight ${solid ? 'text-white' : 'text-ink'}`}>{value}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className={`min-w-0 truncate text-[12px] ${solid ? 'text-white/75' : 'text-muted'}`}>{hint || ' '}</p>
        {to && (
          <FiArrowUpRight className={`h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100 ${solid ? 'text-white' : 'text-brand'}`} />
        )}
      </div>
    </div>
  );
  if (!to) return body;
  return (
    <Link to={to} className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
      {body}
    </Link>
  );
};

const ScoreBars = ({ breakdown }) => {
  const items = BREAKDOWN.map(([key, label]) => ({
    label,
    value: Math.max(0, Math.min(100, Number(breakdown?.[key]) || 0)),
  }));
  return (
    <div className="flex h-[240px] items-end gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center">
          <span className="text-[12px] font-semibold tabular-nums text-ink">{item.value}</span>
          <div className="relative mt-2 w-full flex-1">
            <div
              className="absolute bottom-0 left-1/2 w-9 max-w-full -translate-x-1/2 rounded-t-lg bg-brand transition-all duration-500"
              style={{ height: `${Math.max(item.value, 3)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="mt-2 truncate text-[11px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const TrendChart = ({ points }) => {
  if (!points?.length) {
    return <p className="py-8 text-center text-[13px] text-muted">Health snapshots will show here after the score is saved.</p>;
  }
  const width = 640;
  const height = 188;
  const pad = { l: 32, r: 8, t: 12, b: 26 };
  const scores = points.map((point) => Number(point.score) || 0);
  const min = 0;
  const max = 100;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (index) => pad.l + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (score) => pad.t + (1 - (score - min) / (max - min)) * innerH;
  const line = scores.map((score, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(score).toFixed(1)}`).join(' ');
  const area = `${line} L${x(scores.length - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[188px] w-full" role="img" aria-label="Health score trend">
      {[0, 50, 100].map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#E2E8F0" />
          <text x={pad.l - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#64748B">{tick}</text>
        </g>
      ))}
      <path d={area} fill="#2E6DB4" opacity="0.12" />
      <path d={line} fill="none" stroke="#2E6DB4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((score, index) => (
        <circle key={`${points[index].date || index}`} cx={x(index)} cy={y(score)} r="3.5" fill="#FFFFFF" stroke="#2E6DB4" strokeWidth="2" />
      ))}
      {points.map((point, index) => (
        index === 0 || index === points.length - 1 ? (
          <text key={`d-${index}`} x={x(index)} y={height - 6} textAnchor={index === 0 ? 'start' : 'end'} fontSize="10" fill="#64748B">
            {prettyWhen(point.date)}
          </text>
        ) : null
      ))}
    </svg>
  );
};

const HealthDial = ({ score }) => {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const ring = 2 * Math.PI * 46;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-28 w-28" viewBox="0 0 112 112" aria-hidden>
        <circle className="text-line" strokeWidth="8" stroke="currentColor" fill="transparent" r="46" cx="56" cy="56" />
        <circle
          className="text-brand"
          strokeWidth="8"
          strokeDasharray={ring}
          strokeDashoffset={ring - (ring * value) / 100}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="46"
          cx="56"
          cy="56"
          transform="rotate(-90 56 56)"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-semibold tabular-nums text-ink">{score == null ? '—' : value}</span>
        <span className="block text-[10px] text-muted">/ 100</span>
      </div>
    </div>
  );
};

const severityClass = (severity) => {
  if (severity === 'High') return 'border-danger/20 bg-danger/10 text-ink';
  if (severity === 'Medium') return 'border-warning/30 bg-warning/10 text-ink';
  return 'border-success/20 bg-success/10 text-ink';
};

const Dashboard = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const adminName = adminInfo.name ? adminInfo.name.split(' ')[0] : 'Admin';

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [aiCard, setAiCard] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const { data } = await api.get('/executive/dashboard/metrics');
      if (data.success) setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchHealthScore = async () => {
    setHealthLoading(true);
    try {
      const { data } = await api.get('/executive/health-score');
      if (data.success) setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.get('/executive/dashboard/ai-summary');
      if (data.success) setAiCard(data.aiCard);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const [metricsRes, healthRes, aiRes, insightsRes] = await Promise.all([
        api.get('/executive/dashboard/metrics').catch((err) => {
          console.error(err);
          return null;
        }),
        api.get('/executive/health-score').catch((err) => {
          console.error(err);
          return null;
        }),
        api.get('/executive/dashboard/ai-summary').catch((err) => {
          console.error(err);
          return null;
        }),
        api.get('/ai/proactive-insights').catch((err) => {
          console.error('[Proactive insights fetch error]', err);
          return null;
        }),
      ]);
      if (!active) return;
      if (metricsRes?.data?.success) setMetrics(metricsRes.data.metrics);
      if (healthRes?.data?.success) setHealth(healthRes.data);
      if (aiRes?.data?.success) setAiCard(aiRes.data.aiCard);
      if (insightsRes?.data?.summary) {
        window.dispatchEvent(new CustomEvent('ai-proactive-speech', { detail: { text: insightsRes.data.summary } }));
      }
      setMetricsLoading(false);
      setHealthLoading(false);
      setAiLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAction = async (toolName, args, label) => {
    setRunningAction(label);
    const toastId = toast.loading(`Executing AI Directive: ${label}...`);
    try {
      const { data: res } = await api.post('/executive/run-tool', {
        toolName,
        arguments: args,
      });
      if (res.success) {
        toast.success(`Success: ${res.message || 'Operation completed successfully'}`, { id: toastId });
        fetchMetrics();
        fetchHealthScore();
        fetchAiSummary();
      } else {
        toast.error(`Action Failed: ${res.message || 'Request was rejected'}`, { id: toastId });
      }
    } catch {
      toast.error('Connection error while executing command directive', { id: toastId });
    } finally {
      setRunningAction(null);
    }
  };

  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const forecastScore = Number(health?.predictedNextWeekScore);
  const currentScore = Number(health?.overallScore);
  const forecastUp = Number.isFinite(forecastScore) && Number.isFinite(currentScore)
    ? forecastScore >= currentScore
    : true;
  const register = [
    ['Staff roster', count(metrics?.totalEmployees), metricsLoading],
    ['Present', count(metrics?.employeesPresent), metricsLoading],
    ['Leaves pending', count(metrics?.leaveRequestsPending), metricsLoading],
    ['Hot leads', count(metrics?.hotLeads), metricsLoading],
    ['Deals at risk', count(metrics?.dealsAtRisk), metricsLoading],
    ['Tasks due today', count(metrics?.tasksDueToday), metricsLoading],
    ['Interviews', count(metrics?.interviewsToday), metricsLoading],
    ['Revenue today', inr(metrics?.revenueToday), metricsLoading],
    ['Revenue trend', metrics?.revenueTrend || '—', metricsLoading],
    ['Health score', health?.overallScore == null ? '—' : `${health.overallScore} / 100`, healthLoading],
    ['Next-week forecast', health?.predictedNextWeekScore == null ? '—' : `${health.predictedNextWeekScore} / 100`, healthLoading],
  ];

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-brand">{todayLabel}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
            {greeting}, {adminName}
          </h2>
          <p className="mt-1 text-[13px] text-muted">Vastora Executive Command Center</p>
        </div>
        {adminInfo.role && (
          <span className="inline-flex w-fit items-center rounded-full bg-brand-xlight px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-brand">
            {adminInfo.role}
          </span>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          to="/crm/invoices"
          icon={FiDollarSign}
          label="Today's revenue"
          value={metricsLoading ? '' : inr(metrics?.revenueToday)}
          hint={metrics?.revenueTrend || 'Revenue trend'}
          loading={metricsLoading}
          tone="brand"
        />
        <StatCard
          to="/hrm/employees"
          icon={FiUsers}
          label="Staff roster"
          value={metricsLoading ? '' : count(metrics?.totalEmployees)}
          hint={metricsLoading ? '' : `${count(metrics?.employeesPresent)} present`}
          loading={metricsLoading}
          tone="navy"
        />
        <StatCard
          to="/hrm/leaves"
          icon={FiCalendar}
          label="Leaves pending"
          value={metricsLoading ? '' : count(metrics?.leaveRequestsPending)}
          hint="Waiting for approval"
          loading={metricsLoading}
        />
        <StatCard
          to="/crm/deals"
          icon={FiActivity}
          label="Deals at risk"
          value={metricsLoading ? '' : count(metrics?.dealsAtRisk)}
          hint="Qualification and proposal"
          loading={metricsLoading}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard to="/hrm/attendance" icon={FiUserCheck} label="Present" value={metricsLoading ? '' : count(metrics?.employeesPresent)} loading={metricsLoading} />
        <StatCard to="/crm/leads" icon={FiTarget} label="Hot leads" value={metricsLoading ? '' : count(metrics?.hotLeads)} loading={metricsLoading} />
        <StatCard to="/work/tasks" icon={FiClock} label="Tasks due today" value={metricsLoading ? '' : count(metrics?.tasksDueToday)} loading={metricsLoading} />
        <StatCard to="/hrm/recruitment" icon={FiCalendar} label="Interviews" value={metricsLoading ? '' : count(metrics?.interviewsToday)} loading={metricsLoading} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Health by function" hint="Scores out of 100 from the business health check">
          {healthLoading ? (
            <div className="h-[240px] animate-pulse rounded-xl bg-soft" />
          ) : (
            <ScoreBars breakdown={health?.breakdown} />
          )}
        </Panel>

        <Panel title="Health trend" hint="Saved snapshots, current score, and next-week forecast">
          {healthLoading ? (
            <div className="h-[240px] animate-pulse rounded-xl bg-soft" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <HealthDial score={health?.overallScore} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    {Number.isFinite(forecastScore) && Number.isFinite(currentScore) && (
                      forecastUp
                        ? <FiTrendingUp className="h-4 w-4 text-brand" />
                        : <FiTrendingDown className="h-4 w-4 text-danger" />
                    )}
                    Forecast {health?.predictedNextWeekScore == null ? '—' : health.predictedNextWeekScore} / 100
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    {health?.predictionReasoning || 'Consistent metrics forecast stable outlook.'}
                  </p>
                </div>
              </div>
              <TrendChart points={health?.historicalTrend || []} />
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <Panel title="Live risk alerts" hint="From the latest health check" className="xl:col-span-4">
          {healthLoading ? (
            <div className="h-28 animate-pulse rounded-xl bg-soft" />
          ) : (
            <div className="space-y-2">
              {(health?.riskDetails || []).map((risk, index) => (
                <div key={`${risk.message}-${index}`} className={`flex gap-2.5 rounded-xl border p-3 text-[13px] ${severityClass(risk.severity)}`}>
                  <FiAlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${risk.severity === 'High' ? 'text-danger' : risk.severity === 'Medium' ? 'text-warning' : 'text-success'}`} />
                  <div>
                    <p>{risk.message}</p>
                    {risk.severity && <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">{risk.severity}</p>}
                  </div>
                </div>
              ))}
              {!health?.riskDetails?.length && (
                <p className="text-[13px] text-muted">No risk details returned.</p>
              )}
            </div>
          )}
        </Panel>

        <section className="rounded-2xl border border-line bg-surface shadow-sm xl:col-span-5">
          <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-xlight text-brand">
              <FiCpu className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">AI Strategy Co-pilot</h3>
              <p className="text-[12px] text-muted">Direct executive summaries</p>
            </div>
          </div>
          {aiLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-[13px] text-muted">Compiling strategic audit insights...</p>
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div>
                <p className="text-[12px] font-medium text-muted">Business summary</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink">
                  {aiCard?.businessSummary || 'System reports standard operating efficiency. No anomalies.'}
                </p>
              </div>
              {aiCard?.topRisks?.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium text-muted">Top risks</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[13px] text-ink">
                    {aiCard.topRisks.map((risk, index) => <li key={index}>{risk}</li>)}
                  </ul>
                </div>
              )}
              {aiCard?.topOpportunities?.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium text-muted">Top opportunities</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[13px] text-ink">
                    {aiCard.topOpportunities.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              )}
              {aiCard?.recommendations?.length > 0 && (
                <div className="border-t border-line pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink">AI directives</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {aiCard.recommendations.map((rec, index) => (
                      <button
                        key={`${rec.label}-${index}`}
                        type="button"
                        disabled={runningAction !== null}
                        onClick={() => handleAction(rec.toolName, rec.args || {}, rec.label)}
                        className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand/10 px-4 py-2.5 text-left text-[13px] font-medium text-brand transition hover:bg-brand/15 disabled:opacity-60"
                      >
                        <span>{rec.label}</span>
                        <FiPlay className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <Panel title="Operating register" hint="Every dashboard figure in one list" className="xl:col-span-3">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Signal</th>
                <th className="pb-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {register.map(([label, value, loading]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 text-muted">{label}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-ink">
                    {loading ? '…' : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

const Card = ({ label, value, note, to }) => (
  <Link to={to} className="rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:border-brand/30">
    <p className="text-[13px] text-muted">{label}</p>
    <p className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight text-ink">{value}</p>
    {note ? <p className="mt-1 truncate text-[12px] text-muted">{note}</p> : null}
  </Link>
);

const Panel = ({ title, hint, action, children }) => (
  <section className="rounded-lg border border-line bg-surface">
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 truncate text-[12px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const SERIES = ['#2E6DB4', '#4A8FD4', '#1E293B', '#64748B', '#93C5FD'];

const LineChart = ({ items }) => {
  const width = 640;
  const height = 180;
  const pad = { l: 32, r: 12, t: 12, b: 28 };
  const max = Math.max(...items.map((item) => item.value), 1);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (index) => pad.l + (items.length === 1 ? innerW / 2 : (index / (items.length - 1)) * innerW);
  const y = (value) => pad.t + (1 - value / max) * innerH;
  const points = items.map((item, index) => ({ ...item, x: x(index), y: y(item.value) }));
  let line = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const mid = (points[i].x + points[i + 1].x) / 2;
    line += ` C${mid.toFixed(1)},${points[i].y.toFixed(1)} ${mid.toFixed(1)},${points[i + 1].y.toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
  }
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${(pad.t + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;
  const ticks = [0, Math.round(max / 2), max];
  const last = points[points.length - 1];

  return (
    <div className="flex flex-1 flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full" role="img">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#E2E8F0" />
            <text x={6} y={y(tick) + 3} fontSize="11" fill="#64748B">{tick}</text>
          </g>
        ))}
        <path d={area} fill="#2E6DB4" opacity="0.1" />
        <path d={line} fill="none" stroke="#2E6DB4" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const end = index === points.length - 1;
          return (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r={end ? 4.5 : 3.25} fill={end ? '#2E6DB4' : '#FFFFFF'} stroke="#2E6DB4" strokeWidth="1.75">
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
              <text x={point.x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748B">{point.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-2.5 text-[12px] text-muted">
        <span>Latest <span className="font-medium text-ink">{last?.value ?? 0}</span> · {last?.label}</span>
        <span>Peak <span className="font-medium text-ink">{max}</span></span>
      </div>
    </div>
  );
};

const SplitChart = ({ items, center, caption }) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5 px-4 py-4">
      <div className="relative h-[96px] w-[96px] shrink-0">
        <svg viewBox="0 0 96 96" className="h-[96px] w-[96px]" role="img">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          {total > 0 && items.map((item, index) => {
            const share = (item.value / total) * circumference;
            const length = Math.max(share - (items.filter((row) => row.value > 0).length > 1 ? 2 : 0), 0);
            const segment = (
              <circle
                key={item.label}
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={SERIES[index % SERIES.length]}
                strokeWidth="10"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 48 48)"
              />
            );
            offset += share;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-semibold tabular-nums leading-none text-ink">{center ?? total}</span>
          {caption && <span className="mt-0.5 text-[10px] text-muted">{caption}</span>}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {items.map((item, index) => {
          const share = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.label} className="min-w-0">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SERIES[index % SERIES.length] }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted">{share}%</span>
              </div>
              <p className="pl-3.5 text-[12px] tabular-nums text-muted">{item.meta || item.value}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const CrmHome = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const role = (adminInfo.role || 'admin').toLowerCase();
  const firstName = (adminInfo.name || 'there').split(' ')[0];
  const [stats, setStats] = useState(null);
  const [hrm, setHrm] = useState(null);
  const [projects, setProjects] = useState(null);
  const [meetings, setMeetings] = useState(null);
  const [notes, setNotes] = useState(null);
  const [taskRows, setTaskRows] = useState(null);
  const [leaveRows, setLeaveRows] = useState(null);
  const [online, setOnline] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [reportRows, setReportRows] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.get('/dashboard/stats'),
      api.get('/dashboard/hrm-stats'),
      api.get('/projects'),
      api.get('/meetings'),
      api.get('/notifications'),
      api.get('/tasks'),
      api.get('/leaves'),
      api.get('/workspace/presence'),
      api.get(`/attendance?month=${new Date().toISOString().slice(0, 7)}`),
      api.get('/reports'),
      api.get('/dashboard/reports?range=30d'),
    ]).then(([s, h, p, m, n, t, l, presence, att, reports, charts]) => {
      if (cancelled) return;
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (h.status === 'fulfilled') setHrm(h.value.data);
      if (p.status === 'fulfilled') setProjects(Array.isArray(p.value.data) ? p.value.data : p.value.data?.projects || []);
      if (m.status === 'fulfilled') setMeetings(Array.isArray(m.value.data) ? m.value.data : []);
      if (n.status === 'fulfilled') setNotes(Array.isArray(n.value.data) ? n.value.data : n.value.data?.notifications || []);
      if (t.status === 'fulfilled') setTaskRows(Array.isArray(t.value.data) ? t.value.data : []);
      if (l.status === 'fulfilled') setLeaveRows(Array.isArray(l.value.data) ? l.value.data : []);
      if (presence.status === 'fulfilled' && Array.isArray(presence.value.data)) {
        setOnline(presence.value.data.filter((row) => row.status === 'online').length);
      }
      if (att.status === 'fulfilled' && Array.isArray(att.value.data)) {
        const day = todayKey();
        setTodayAttendance(att.value.data.filter((row) => row.date === day));
      }
      if (reports.status === 'fulfilled' && Array.isArray(reports.value.data)) setReportRows(reports.value.data);
      if (charts.status === 'fulfilled') setAnalytics(charts.value.data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const kind = role === 'sales' ? 'sales' : role === 'hr' ? 'hr' : role === 'manager' ? 'manager' : 'company';

  const running = (projects || []).filter((p) => p.status === 'Active' || p.status === 'Planning');
  const absent = hrm && Number.isFinite(hrm.employees) && Number.isFinite(hrm.presentToday)
    ? Math.max(hrm.employees - hrm.presentToday, 0)
    : null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const todayMeetings = (meetings || []).filter((item) => {
    const when = new Date(item.scheduledAt);
    return when >= start && when <= end && item.status !== 'Cancelled';
  });

  const day = todayKey();
  const tasks = taskRows || [];
  const completedTasks = tasks.filter((task) => task.status === 'Completed').length;
  const overdueTasks = tasks.filter((task) => task.status !== 'Completed' && task.dueDate && task.dueDate < day).length;
  const openTasks = tasks.filter((task) => task.status !== 'Completed' && !(task.dueDate && task.dueDate < day)).length;
  const reportsIn = (reportRows || []).filter((row) => row.date === day).length;
  const reportsPending = todayAttendance ? Math.max(todayAttendance.length - reportsIn, 0) : null;
  const onLeave = (leaveRows || []).filter((row) => row.status === 'Approved' && row.startDate <= day && row.endDate >= day).length;

  const pipelineRows = (analytics?.crm?.pipelineByStage || stats?.pipelineByStage || [])
    .filter((row) => row.stage !== 'Closed Lost')
    .map((row) => ({
      label: row.stage,
      value: Number(row.value) || Number(row.count) || 0,
      count: Number(row.count) || 0,
      meta: `${row.count} · ${formatINR(row.value)}`,
    }));

  const attendanceBars = (analytics?.hrm?.attendanceTrend || []).map((row) => ({
    label: row.label,
    value: row.present ?? 0,
  }));

  const dealBars = (analytics?.crm?.weeklyDeals || []).map((row) => ({
    label: row.label,
    value: row.count ?? 0,
  }));

  const leaveBars = (analytics?.hrm?.leaveByStatus || []).map((row) => ({
    label: row.status,
    value: row.count ?? 0,
    meta: String(row.count ?? 0),
  }));

  const taskBars = [
    { label: 'Completed', value: completedTasks, meta: String(completedTasks) },
    { label: 'Open', value: openTasks, meta: String(openTasks) },
    { label: 'Overdue', value: overdueTasks, meta: String(overdueTasks) },
  ];

  const winRate = analytics?.crm?.winRate;
  const attendanceRate = analytics?.hrm?.attendanceRate;
  const salesCards = stats ? [
    { label: 'Open leads', value: stats.leads ?? 0, note: stats.newLeads != null ? `${stats.newLeads} new this week` : '', to: '/crm/leads' },
    { label: 'Open deals', value: stats.openDeals ?? 0, note: analytics?.crm?.avgDealSize ? `Avg ${formatINR(analytics.crm.avgDealSize)}` : '', to: '/crm/deals' },
    { label: 'Pipeline', value: formatINR(stats.pipelineValue), note: Number.isFinite(winRate) ? `Win rate ${winRate}%` : '', to: '/crm/deals' },
    { label: 'Tasks due', value: stats.tasksDue ?? 0, note: tasks.length ? `${overdueTasks} overdue` : '', to: '/work/tasks' },
  ] : [];

  const hrCards = [
    hrm ? { label: 'Present', value: hrm.presentToday ?? 0, note: Number.isFinite(attendanceRate) ? `${attendanceRate}% of staff` : '', to: '/hrm/attendance' } : null,
    absent !== null ? { label: 'Absent', value: absent, note: hrm?.employees != null ? `of ${hrm.employees}` : '', to: '/hrm/attendance' } : null,
    hrm ? { label: 'Leave requests', value: hrm.pendingLeaves ?? 0, note: leaveRows ? `${onLeave} on leave today` : '', to: '/hrm/leaves' } : null,
    hrm ? { label: 'Payroll drafts', value: hrm.draftPayslips ?? 0, to: '/hrm/payroll' } : null,
    hrm ? { label: 'Open tickets', value: hrm.openTickets ?? 0, to: '/support/tickets' } : null,
  ].filter(Boolean);

  const managerCards = [
    { label: 'Tasks pending', value: tasks.length - completedTasks, note: tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}% done` : '', to: '/work/tasks' },
    { label: 'Overdue', value: overdueTasks, to: '/work/tasks' },
    reportsPending !== null ? { label: 'Reports today', value: `${reportsIn} in · ${reportsPending} pending`, to: '/hrm/daily-reports' } : null,
    leaveRows ? { label: 'On leave today', value: onLeave, note: hrm ? `${hrm.pendingLeaves ?? 0} waiting approval` : '', to: '/hrm/leaves' } : null,
  ].filter(Boolean);

  const companyCards = [
    stats ? { label: 'Pipeline', value: formatINR(stats.pipelineValue), note: Number.isFinite(winRate) ? `Win rate ${winRate}%` : '', to: '/crm/deals' } : null,
    stats ? { label: 'Open deals', value: stats.openDeals ?? 0, note: analytics?.crm?.avgDealSize ? `Avg ${formatINR(analytics.crm.avgDealSize)}` : '', to: '/crm/deals' } : null,
    stats ? { label: 'Tasks due', value: stats.tasksDue ?? 0, note: tasks.length ? `${overdueTasks} overdue` : '', to: '/work/tasks' } : null,
    hrm ? { label: 'Present', value: hrm.presentToday ?? 0, note: Number.isFinite(attendanceRate) ? `${attendanceRate}% of staff` : '', to: '/hrm/attendance' } : null,
    hrm ? { label: 'Leave requests', value: hrm.pendingLeaves ?? 0, note: leaveRows ? `${onLeave} on leave today` : '', to: '/hrm/leaves' } : null,
  ].filter(Boolean);

  const cards = kind === 'sales' ? salesCards : kind === 'hr' ? hrCards : kind === 'manager' ? managerCards : companyCards;

  const charts = [];
  if ((kind === 'company' || kind === 'sales') && pipelineRows.length > 0) {
    charts.push({
      key: 'pipeline',
      title: 'Pipeline',
      hint: 'Open stages by value',
      to: '/crm/deals',
      link: 'Deals',
      body: <SplitChart items={pipelineRows} center={pipelineRows.reduce((sum, row) => sum + row.count, 0)} caption="deals" />,
    });
  }
  if (kind === 'sales' && dealBars.length > 0) {
    charts.push({
      key: 'deals',
      title: 'Deals added',
      hint: 'New deals each week',
      to: '/crm/deals',
      link: 'Deals',
      body: <LineChart items={dealBars} />,
    });
  }
  if (kind === 'manager' && tasks.length > 0) {
    charts.push({
      key: 'tasks',
      title: 'Tasks',
      hint: 'Completed, open, and overdue',
      to: '/work/tasks',
      link: 'Tasks',
      body: <SplitChart items={taskBars} caption="tasks" />,
    });
  }
  if (kind !== 'sales' && attendanceBars.length > 0) {
    charts.push({
      key: 'attendance',
      title: 'Attendance this week',
      hint: 'People checked in',
      to: '/hrm/attendance',
      link: 'Attendance',
      body: <LineChart items={attendanceBars} />,
    });
  }
  if (kind === 'hr' && leaveBars.length > 0) {
    charts.push({
      key: 'leaves',
      title: 'Leave requests',
      hint: 'Pending, approved, and rejected',
      to: '/hrm/leaves',
      link: 'Leave',
      body: <SplitChart items={leaveBars} caption="requests" />,
    });
  }

  const visibleCharts = charts.slice(0, 2);

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 p-6 lg:p-8">
      <header>
        <p className="text-[13px] text-muted">{todayLabel}</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">{greeting}, {firstName}</h1>
        {todayAttendance && kind !== 'sales' && (
          <p className="mt-1 text-[13px] text-muted">
            Office {todayAttendance.filter((row) => row.workMode === 'Office').length}
            {' · '}Remote {todayAttendance.filter((row) => row.workMode === 'Home').length}
            {' · '}Still in {todayAttendance.filter((row) => row.checkIn && !row.checkOut).length}
            {online !== null ? ` · Online ${online}` : ''}
          </p>
        )}
      </header>

      {loading && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[76px] animate-pulse rounded-lg border border-line bg-surface" />
          ))}
        </section>
      )}

      {!loading && cards.length > 0 && (
        <section className={`grid gap-3 sm:grid-cols-2 ${cards.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
          {cards.map((card) => (
            <Card key={card.label} {...card} />
          ))}
        </section>
      )}

      {!loading && visibleCharts.length > 0 && (
        <section className={`grid items-start gap-4 ${visibleCharts.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {visibleCharts.map((chart) => (
            <Panel
              key={chart.key}
              title={chart.title}
              hint={chart.hint}
              action={<Link to={chart.to} className="text-[13px] font-medium text-brand">{chart.link}</Link>}
            >
              {chart.body}
            </Panel>
          ))}
        </section>
      )}

      <div className={`grid items-start gap-4 ${kind !== 'hr' || running.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : ''}`}>
        {(kind !== 'hr' || running.length > 0) && (
        <div className="space-y-4">
          {kind !== 'hr' && (
            <Panel
              title="Today's schedule"
              action={<Link to="/crm/meetings" className="text-[13px] font-medium text-brand">Meetings</Link>}
            >
              {todayMeetings.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-muted">No meetings scheduled today.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {todayMeetings.slice(0, 6).map((item) => (
                    <li key={item._id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                      <span className="min-w-0 truncate text-ink">{item.title}</span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {new Date(item.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          {kind !== 'sales' && running.length > 0 && (
            <Panel
              title="Projects running"
              action={<Link to="/work/projects" className="text-[13px] font-medium text-brand">Work</Link>}
            >
              <ul className="divide-y divide-line">
                {running.slice(0, 6).map((project) => (
                  <li key={project._id} className="flex items-center justify-between px-4 py-3 text-[13px] hover:bg-soft">
                    <span className="text-ink">{project.name}</span>
                    <span className="text-muted">{project.status}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
        )}

        <Panel title="Notifications">
          {!notes || notes.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-line">
              {notes.slice(0, 6).map((note) => (
                <li key={note._id} className="px-4 py-3 hover:bg-soft">
                  <p className="text-[13px] text-ink">{note.title}</p>
                  {note.message && <p className="mt-0.5 text-[12px] text-muted">{note.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default CrmHome;

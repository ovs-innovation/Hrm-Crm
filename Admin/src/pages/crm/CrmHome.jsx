import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Card = ({ label, value, to }) => (
  <Link to={to} className="rounded-lg border border-line bg-surface p-4 hover:border-brand/40">
    <p className="text-[13px] text-muted">{label}</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
  </Link>
);

const Panel = ({ title, action, children }) => (
  <section className="rounded-lg border border-line bg-surface">
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

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
    ]).then(([s, h, p, m, n, t, l, presence, att, reports]) => {
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
        const day = new Date().toISOString().slice(0, 10);
        setTodayAttendance(att.value.data.filter((row) => row.date === day));
      }
      if (reports.status === 'fulfilled' && Array.isArray(reports.value.data)) setReportRows(reports.value.data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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

  const salesCards = stats ? [
    { label: 'Open leads', value: stats.leads ?? 0, to: '/crm/leads' },
    { label: 'Open deals', value: stats.openDeals ?? 0, to: '/crm/deals' },
    { label: 'Pipeline', value: formatINR(stats.pipelineValue), to: '/crm/deals' },
    { label: 'Tasks due', value: stats.tasksDue ?? 0, to: '/work/tasks' },
  ] : [];

  const hrCards = hrm ? [
    { label: 'Present', value: hrm.presentToday ?? 0, to: '/hrm/attendance' },
    absent !== null ? { label: 'Absent', value: absent, to: '/hrm/attendance' } : null,
    { label: 'Leave requests', value: hrm.pendingLeaves ?? 0, to: '/hrm/leaves' },
    { label: 'Payroll drafts', value: hrm.draftPayslips ?? 0, to: '/hrm/payroll' },
    { label: 'Open tickets', value: hrm.openTickets ?? 0, to: '/support/tickets' },
  ].filter(Boolean) : [];

  const companyCards = [
    hrm ? { label: 'Tickets', value: hrm.openTickets ?? 0, to: '/support/tickets' } : null,
    absent !== null ? { label: 'Absent', value: absent, to: '/hrm/attendance' } : null,
    stats ? { label: 'Open tasks', value: stats.tasksDue ?? 0, to: '/work/tasks' } : null,
    stats ? { label: 'Revenue pipeline', value: formatINR(stats.pipelineValue), to: '/crm/deals' } : null,
    projects ? { label: 'Projects', value: running.length, to: '/work/projects' } : null,
    hrm ? { label: 'Present', value: hrm.presentToday ?? 0, to: '/hrm/attendance' } : null,
  ].filter(Boolean).slice(0, 6);

  const managerCards = taskRows ? [
    { label: 'Tasks assigned', value: taskRows.length, to: '/work/tasks' },
    { label: 'Tasks completed', value: taskRows.filter((task) => task.status === 'Completed').length, to: '/work/tasks' },
    { label: 'Tasks pending', value: taskRows.filter((task) => task.status !== 'Completed').length, to: '/work/tasks' },
    { label: 'Overdue', value: taskRows.filter((task) => task.status !== 'Completed' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)).length, to: '/work/tasks' },
    taskRows.length ? { label: 'Completion', value: `${Math.round((taskRows.filter((task) => task.status === 'Completed').length / taskRows.length) * 100)}%`, to: '/work/tasks' } : null,
    reportRows && todayAttendance ? {
      label: 'Reports today',
      value: `${reportRows.filter((row) => row.date === new Date().toISOString().slice(0, 10)).length} in · ${Math.max(todayAttendance.length - reportRows.filter((row) => row.date === new Date().toISOString().slice(0, 10)).length, 0)} pending`,
      to: '/hrm/daily-reports',
    } : null,
    online !== null ? { label: 'Employees online', value: online, to: '/workspace' } : null,
    leaveRows ? { label: 'On leave today', value: leaveRows.filter((row) => row.status === 'Approved' && row.startDate <= new Date().toISOString().slice(0, 10) && row.endDate >= new Date().toISOString().slice(0, 10)).length, to: '/hrm/leaves' } : null,
  ].filter(Boolean).slice(0, 6) : [];

  const cards = role === 'sales' ? salesCards.slice(0, 6) : role === 'hr' ? hrCards.slice(0, 6) : (managerCards.length ? managerCards : companyCards);
  const pipeline = (stats?.pipelineByStage || []).filter((row) => row.stage !== 'Closed Won');

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6 lg:p-8">
      <header>
        <p className="text-[13px] text-muted">{todayLabel}</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">{greeting}, {firstName}</h1>
        {todayAttendance && role !== 'sales' && (
          <p className="mt-1 text-[13px] text-muted">
            Office {todayAttendance.filter((row) => row.workMode === 'Office').length}
            {' · '}Remote {todayAttendance.filter((row) => row.workMode === 'Home').length}
            {' · '}Still in {todayAttendance.filter((row) => row.checkIn && !row.checkOut).length}
          </p>
        )}
      </header>

      {loading && <p className="text-[13px] text-muted">Loading the company snapshot…</p>}

      {!loading && cards.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label} {...card} />
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Panel
            title="Today's schedule"
            action={<Link to="/crm/meetings" className="text-[13px] font-medium text-brand">Meetings</Link>}
          >
            {todayMeetings.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-muted">No meetings scheduled today.</p>
            ) : (
              <ul className="divide-y divide-line">
                {todayMeetings.slice(0, 6).map((item) => (
                  <li key={item._id} className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="text-ink">{item.title}</span>
                    <span className="text-muted">
                      {new Date(item.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {role !== 'hr' && pipeline.length > 0 && (
            <Panel
              title="Pipeline"
              action={<Link to="/crm/deals" className="text-[13px] font-medium text-brand">Deals</Link>}
            >
              <table className="w-full text-left text-[13px]">
                <tbody>
                  {pipeline.map((row) => (
                    <tr key={row.stage} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-ink">{row.stage}</td>
                      <td className="px-4 py-3 tabular-nums text-muted">{row.count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{formatINR(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          {role !== 'sales' && running.length > 0 && (
            <Panel
              title="Projects running"
              action={<Link to="/work/projects" className="text-[13px] font-medium text-brand">Work</Link>}
            >
              <ul className="divide-y divide-line">
                {running.slice(0, 6).map((project) => (
                  <li key={project._id} className="flex items-center justify-between px-4 py-3 text-[13px]">
                    <span className="text-ink">{project.name}</span>
                    <span className="text-muted">{project.status}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel title="Notifications">
          {!notes || notes.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-muted">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-line">
              {notes.slice(0, 6).map((note) => (
                <li key={note._id} className="px-4 py-3">
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

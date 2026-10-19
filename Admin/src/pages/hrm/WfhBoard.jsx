import { useEffect, useState } from 'react';
import api, { getFileUrl } from '../../services/api';
import PageShell from '../../components/PageShell';

const statusStyle = {
  online: 'bg-green-50 text-green-700',
  working: 'bg-green-50 text-green-700',
  meeting: 'bg-brand-xlight text-brand',
  away: 'bg-amber-50 text-amber-700',
  break: 'bg-amber-50 text-amber-700',
  offline: 'bg-soft text-muted',
  logged_out: 'bg-soft text-muted',
};

const statusLabel = {
  online: 'Online',
  working: 'Working',
  meeting: 'Meeting',
  away: 'Away',
  break: 'Break',
  offline: 'Offline',
  logged_out: 'Logged out',
};

const clock = (minutes) => {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const WfhBoard = () => {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [report, setReport] = useState(null);
  const [range, setRange] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/wfh/board');
      setBoard(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the work-from-home board');
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const loadReport = async (next) => {
    const end = new Date();
    const start = new Date();
    if (next === 'week') start.setDate(end.getDate() - 6);
    if (next === 'month') start.setDate(end.getDate() - 29);
    const stamp = (d) => {
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    };
    const { data } = await api.get(`/wfh/report?from=${stamp(start)}&to=${stamp(end)}`);
    setRange(next);
    setReport(data);
  };

  const s = board?.summary || {};
  const people = board?.people || [];
  const open = people.find((p) => String(p.employeeId) === String(openId)) || null;
  const cards = [
    ['WFH today', s.total || 0],
    ['Online', s.online || 0],
    ['In a meeting', s.meeting || 0],
    ['Away', s.away || 0],
    ['On break', s.break || 0],
    ['Offline', s.offline || 0],
    ['Late check-in', s.late || 0],
    ['Active time', clock(s.activeMinutes)],
    ['Idle time', clock(s.idleMinutes)],
  ];

  return (
    <PageShell
      title="Work from home"
      description="People who checked in from home today. The board refreshes every 30 seconds. Three minutes without the mouse or keyboard shows as away."
      actions={['day', 'week', 'month'].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => loadReport(item)}
          className={`rounded border px-3 py-1.5 text-[13px] capitalize ${range === item ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-ink'}`}
        >
          {item}
        </button>
      ))}
    >
      {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface px-4 py-3">
            <p className="text-[12px] text-muted">{label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>

      <p className="mb-3 text-[13px] text-muted">
        Tasks for these people: {board?.tasks?.open || 0} open · {board?.tasks?.progress || 0} in progress · {board?.tasks?.done || 0} done
      </p>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-[13px] text-ink">
          <thead className="border-b border-line bg-soft text-[12px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Check-in</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Idle</th>
              <th className="px-4 py-3 font-medium">Break</th>
              <th className="px-4 py-3 font-medium">Productivity</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const selected = String(p.employeeId) === String(openId);
              return (
                <tr
                  key={p.employeeId}
                  onClick={() => setOpenId(selected ? null : p.employeeId)}
                  className={`cursor-pointer border-t border-line ${selected ? 'bg-brand-xlight' : 'hover:bg-soft'}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-[12px] text-muted">{p.code}{p.designation ? ` · ${p.designation}` : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-[12px] font-medium ${statusStyle[p.status] || statusStyle.offline}`}>
                      {statusLabel[p.status] || 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{p.checkIn || '—'}</p>
                    <p className="text-[12px] text-muted">{p.attendanceStatus || ''}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{clock(p.activeMinutes)}</td>
                  <td className="px-4 py-3 tabular-nums">{clock(p.idleMinutes)}</td>
                  <td className="px-4 py-3 tabular-nums">{clock(p.breakMinutes)}</td>
                  <td className="px-4 py-3 tabular-nums">{p.productivity || 0}%</td>
                </tr>
              );
            })}
            {people.length === 0 && (
              <tr><td className="px-4 py-8 text-muted" colSpan={7}>No home check-in yet today.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <section className="mt-4 rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">{open.name}</h2>
              <p className="text-[12px] text-muted">{open.email || open.code}</p>
            </div>
            <p className="text-[13px] text-ink">{open.mouseClicks || 0} clicks · {open.keyCount || 0} keys</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Detail title="Applications" rows={(open.apps || []).map((p) => `${p.name} · ${clock(p.minutes)}`)} empty="No app time yet. This appears after the laptop agent is running." />
            <Detail title="Browser windows" rows={(open.sites || []).map((p) => `${p.name} · ${clock(p.minutes)}`)} empty="No browser windows yet." />
            <Detail title="Projects" rows={(open.projects || []).map((p) => `${p.name} · ${clock(p.minutes)}`)} empty="No project detected." />
            <Detail title="Files" rows={(open.files || []).map((f) => `${f.action} · ${f.name}`)} empty="No file changes yet." />
          </div>
          <div className="mt-4">
            <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted">Screenshots</h3>
            {(open.shots || []).length === 0 && <p className="mt-2 text-[13px] text-muted">Screenshots are not collected. App, idle, and click tracking still run.</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {(open.shots || []).map((shot) => (
                <a key={shot.path} href={getFileUrl(shot.path)} target="_blank" rel="noreferrer">
                  <img src={getFileUrl(shot.path)} alt="" className="h-28 w-44 rounded border border-line object-cover" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Log label="Completed" value={open.log?.completed} />
            <Log label="Pending" value={open.log?.pending} />
            <Log label="Tomorrow" value={open.log?.tomorrow} />
            <Log label="Remarks" value={open.log?.remarks} />
          </div>
        </section>
      )}

      {report && (
        <section className="mt-4 rounded-lg border border-line bg-surface p-4">
          <h2 className="text-[15px] font-semibold text-ink">{report.from} to {report.to}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(report.departments || []).map((d) => (
              <p key={d.department} className="rounded border border-line px-3 py-2 text-[13px] text-ink">{d.department}: {d.people} people · {d.productivity}% average</p>
            ))}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px] text-ink">
              <thead className="text-[12px] text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Employee</th>
                  <th className="py-2 pr-3 font-medium">Active</th>
                  <th className="py-2 pr-3 font-medium">Idle</th>
                  <th className="py-2 pr-3 font-medium">Break</th>
                  <th className="py-2 font-medium">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {(report.lines || []).map((line) => (
                  <tr key={`${line.date}-${line.code}`} className="border-t border-line">
                    <td className="py-2 pr-3">{line.date}</td>
                    <td className="py-2 pr-3">{line.name}{line.late ? ' · late' : ''}</td>
                    <td className="py-2 pr-3 tabular-nums">{clock(line.activeMinutes)}</td>
                    <td className="py-2 pr-3 tabular-nums">{clock(line.idleMinutes)}</td>
                    <td className="py-2 pr-3 tabular-nums">{clock(line.breakMinutes)}</td>
                    <td className="py-2 tabular-nums">{line.productivity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageShell>
  );
};

const Detail = ({ title, rows, empty }) => (
  <div>
    <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted">{title}</h3>
    {rows.length === 0 && <p className="mt-2 text-[13px] text-muted">{empty}</p>}
    <ul className="mt-2 space-y-1">
      {rows.map((row) => <li key={row} className="text-[13px] text-ink">{row}</li>)}
    </ul>
  </div>
);

const Log = ({ label, value }) => (
  <div className="rounded border border-line bg-soft px-3 py-2">
    <p className="text-[12px] text-muted">{label}</p>
    <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink">{value || '—'}</p>
  </div>
);

export default WfhBoard;

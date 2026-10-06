import { useEffect, useState } from 'react';
import api from '../../services/api';

const WfhBoard = () => {
  const [board, setBoard] = useState(null);
  const [open, setOpen] = useState(null);
  const [report, setReport] = useState(null);

  const load = async () => {
    const { data } = await api.get('/wfh/board');
    setBoard(data);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const s = board?.summary || {};
  const cards = [
    ['WFH today', s.total || 0],
    ['Online', s.online || 0],
    ['Meeting', s.meeting || 0],
    ['Away', s.away || 0],
    ['Break', s.break || 0],
    ['Offline', s.offline || 0],
    ['Late', s.late || 0],
    ['Active min', s.activeMinutes || 0],
    ['Idle min', s.idleMinutes || 0],
  ];

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-white">Work from home</h1>
      <p className="mb-4 text-sm text-muted">Home check-ins for today. Status updates about every 30 seconds. Three minutes without mouse or keyboard counts as away.</p>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="app-card rounded-xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-muted">
        Tasks across these people: open {board?.tasks?.open || 0} · in progress {board?.tasks?.progress || 0} · done {board?.tasks?.done || 0}
      </p>
      <div className="app-card overflow-x-auto rounded-xl">
        <table className="w-full text-left text-sm text-white">
          <thead className="text-muted">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Status</th>
              <th className="p-3">Check-in</th>
              <th className="p-3">Active</th>
              <th className="p-3">Idle</th>
              <th className="p-3">Break</th>
              <th className="p-3">Productivity</th>
            </tr>
          </thead>
          <tbody>
            {(board?.people || []).map((p) => (
              <tr key={p.employeeId} className="cursor-pointer border-t border-line" onClick={() => setOpen(p)}>
                <td className="p-3">{p.name}<div className="text-xs text-muted">{p.code}</div></td>
                <td className="p-3 capitalize">{p.status?.replace('_', ' ')}</td>
                <td className="p-3">{p.checkIn || '—'} · {p.attendanceStatus || ''}</td>
                <td className="p-3">{p.activeMinutes}m</td>
                <td className="p-3">{p.idleMinutes}m</td>
                <td className="p-3">{p.breakMinutes}m</td>
                <td className="p-3">{p.productivity}%</td>
              </tr>
            ))}
            {(board?.people || []).length === 0 && (
              <tr><td className="p-3 text-muted" colSpan={7}>No Home check-in today.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mb-4 flex gap-2">
        {['day', 'week', 'month'].map((range) => (
          <button key={range} type="button" className="rounded-lg border border-line px-3 py-1 text-sm text-white" onClick={async () => {
            const end = new Date();
            const start = new Date();
            if (range === 'week') start.setDate(end.getDate() - 6);
            if (range === 'month') start.setDate(end.getDate() - 29);
            const stamp = (d) => {
              const p = (n) => String(n).padStart(2, '0');
              return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
            };
            const { data } = await api.get(`/wfh/report?from=${stamp(start)}&to=${stamp(end)}`);
            setReport(data);
          }}>{range}</button>
        ))}
      </div>
      {report && (
        <div className="app-card mb-4 rounded-xl p-4 text-sm text-white">
          <p className="mb-2">{report.from} to {report.to}</p>
          {(report.departments || []).map((d) => <p key={d.department}>{d.department}: {d.people} people · {d.productivity}% avg</p>)}
          {(report.lines || []).map((line) => (
            <p key={`${line.date}-${line.code}`}>{line.date} · {line.name} · active {line.activeMinutes}m · idle {line.idleMinutes}m · break {line.breakMinutes}m · {line.productivity}%{line.late ? ' · late' : ''}</p>
          ))}
        </div>
      )}
      {open && (
        <div className="mt-4 app-card rounded-xl p-4 text-sm text-white">
          <p className="mb-2 font-medium">{open.name}</p>
          <p>Clicks {open.mouseClicks || 0} · Keys {open.keyCount || 0}</p>
          <p className="mt-3 text-muted">Projects</p>
          {(open.projects || []).map((p) => <p key={p.name}>{p.name} · {p.minutes} min</p>)}
          <p className="mt-3 text-muted">Files</p>
          {(open.files || []).map((f, i) => <p key={`${f.name}-${i}`}>{f.action} · {f.name}</p>)}
          <p className="mt-3 text-muted">Applications</p>
          {(open.apps || []).map((p) => <p key={p.name}>{p.name} · {p.minutes} min</p>)}
          <p className="mt-3 text-muted">Browser windows</p>
          {(open.sites || []).map((p) => <p key={p.name}>{p.name} · {p.minutes} min</p>)}
          <p className="mt-3 text-muted">Screenshots</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(open.shots || []).map((shot) => (
              <a key={shot.path} href={shot.path} target="_blank" rel="noreferrer">
                <img src={shot.path} alt="" className="h-24 w-40 object-cover" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-muted">Work log</p>
          <p>Completed: {open.log?.completed || '—'}</p>
          <p>Pending: {open.log?.pending || '—'}</p>
          <p>Tomorrow: {open.log?.tomorrow || '—'}</p>
          <p>Remarks: {open.log?.remarks || '—'}</p>
        </div>
      )}
    </div>
  );
};

export default WfhBoard;

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageShell from '../components/PageShell';

const empty = { completed: '', pending: '', tomorrow: '', remarks: '' };

const Wfh = () => {
  const [session, setSession] = useState(null);
  const [log, setLog] = useState(empty);
  const [onBreak, setOnBreak] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/wfh/me');
      setSession(data);
      setLog({ ...empty, ...(data.log || {}) });
      setOnBreak(data.status === 'break');
    } catch {
      // Keep last known session; avoid unhandled rejection every 30s.
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const toggleBreak = () => {
    const next = !onBreak;
    setOnBreak(next);
    window.dispatchEvent(new CustomEvent('wfh-break', { detail: next }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/wfh/log', log);
      toast.success('Work log saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the log');
    }
  };

  const statusLabel = { online: 'Online', away: 'Away', break: 'Break', waiting: 'Waiting for Home check-in', logged_out: 'Logged out', offline: 'Offline' };

  return (
    <PageShell title="Work from home" description="Same shift as office. Time is tracked inside this portal after a Home check-in.">
      {!session?.tracking && (
        <p className="mb-4 border border-line bg-surface px-3 py-2 text-sm text-ink">
          Download does not start tracking. On the dashboard, check in and choose Home. Time stops at checkout.
        </p>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Status', onBreak ? 'Break' : (statusLabel[session?.status] || '—')],
          ['Active', `${session?.activeMinutes || 0} min`],
          ['Idle', `${session?.idleMinutes || 0} min`],
          ['Break', `${session?.breakMinutes || 0} min`],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-surface px-3 py-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-lg text-ink">{value}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={toggleBreak} disabled={!session?.tracking} className="mb-6 border border-line bg-surface px-3 py-2 text-sm text-ink disabled:opacity-50">
        {onBreak ? 'End break' : 'Start break'}
      </button>
      <div className="mb-6 border border-line bg-surface px-3 py-3">
        <p className="mb-1 text-sm text-ink">Laptop activity</p>
        <p className="mb-3 text-sm text-muted">
          Download Windows, then double-click the file. Windows will say Unknown Publisher: click Run, and wait until the window says Installed. The laptop then tracks the open app, idle time, and click counts. It does not take screenshots and it does not send the keys you type. Check in with Home. Phones cannot run the agent. Download it again after 30 days.
        </p>
        <p className="mb-3 text-sm text-ink">
          {session?.laptop
            ? (session?.tracking ? 'Laptop agent is connected.' : 'Laptop agent is connected. Check in with Home to start counting time.')
            : 'Laptop agent is not running. The site has not received a signal from this PC in the last 2 minutes. Download Windows, double-click the file, and leave it installed. Then refresh this page.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['/wfh/agent.cmd', 'VastoraAgent.cmd', 'Windows'],
            ['/wfh/agent-mac.sh', 'VastoraAgent-mac.sh', 'Mac'],
            ['/wfh/agent-linux.sh', 'VastoraAgent-linux.sh', 'Linux'],
          ].map(([path, filename, label]) => (
            <button key={path} type="button" className="border border-line bg-canvas px-3 py-2 text-sm text-ink" onClick={async () => {
              try {
                const { data } = await api.get(path, { responseType: 'blob' });
                const url = URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Could not download the laptop agent');
              }
            }}>{label}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Windows: after the download, double-click VastoraAgent.cmd, click Run, and leave the window open until it says Installed. Then refresh this page. Mac or Linux: run the file once in Terminal.</p>
        <p className="mb-2 mt-4 text-sm text-ink">Apps</p>
        {(session?.apps || []).length === 0 && <p className="text-sm text-muted">No app time yet. It appears after the agent sends a pulse.</p>}
        {(session?.apps || []).map((p) => (
          <p key={p.name} className="text-sm text-ink">{p.name} · {p.minutes} min</p>
        ))}
      </div>
      <div className="mb-6 border border-line bg-surface px-3 py-3">
        <p className="mb-2 text-sm text-ink">Time on portal pages</p>
        {(session?.pages || []).length === 0 && <p className="text-sm text-muted">No page time yet.</p>}
        {(session?.pages || []).map((p) => (
          <p key={p.path} className="text-sm text-ink">{p.path} · {p.minutes} min</p>
        ))}
      </div>
      <form onSubmit={save} className="grid gap-3 border border-line bg-surface p-3">
        <p className="text-sm text-ink">End of day</p>
        {['completed', 'pending', 'tomorrow', 'remarks'].map((key) => (
          <label key={key} className="grid gap-1 text-sm text-ink capitalize">
            {key === 'completed' ? 'Today completed' : key === 'tomorrow' ? 'Tomorrow plan' : key}
            <textarea className="border border-line bg-canvas px-2 py-2 text-ink" rows={3} value={log[key]} onChange={(e) => setLog({ ...log, [key]: e.target.value })} />
          </label>
        ))}
        <button type="submit" className="w-fit border border-line bg-canvas px-3 py-2 text-sm text-ink">Save work log</button>
      </form>
    </PageShell>
  );
};

export default Wfh;

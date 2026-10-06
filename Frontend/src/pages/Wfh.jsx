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
    const { data } = await api.get('/wfh/me');
    setSession(data);
    setLog({ ...empty, ...(data.log || {}) });
    setOnBreak(data.status === 'break');
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

  const statusLabel = { online: 'Online', away: 'Away', break: 'Break', logged_out: 'Logged out' };

  return (
    <PageShell title="Work from home" description="Same shift as office. Time is tracked inside this portal after a Home check-in.">
      {!session?.tracking && (
        <p className="mb-4 border border-line bg-surface px-3 py-2 text-sm text-ink">
          Tracking starts after you check in with Home, and stops at checkout.
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

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PageShell from '../components/PageShell';
import api from '../services/api';

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [done, setDone] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchReports = async () => {
    const res = await api.get('/reports/my');
    setReports(res.data);
    const todayReport = res.data.find((r) => r.date === today);
    if (todayReport?.reportText) {
      const parts = todayReport.reportText.split('\n\n');
      setDone((parts[0] || '').replace(/^Today's work\n/, ''));
      setBlockers((parts[1] || '').replace(/^Blockers\n/, ''));
      setTomorrow((parts[2] || '').replace(/^Tomorrow\n/, ''));
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reportText = [`Today's work\n${done.trim()}`, `Blockers\n${blockers.trim() || 'None'}`, `Tomorrow\n${tomorrow.trim()}`].join('\n\n');
    if (!done.trim()) return toast.error('Add what you completed today');
    setLoading(true);
    try {
      await api.post('/reports', { date: today, reportText });
      toast.success('Report saved');
      fetchReports();
    } catch {
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Daily report" description={`Today · ${format(new Date(), 'dd MMM yyyy')}`}>
      <div className="mb-6 rounded border border-line bg-surface p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="app-label text-[13px]">Today’s work</label>
          <textarea value={done} onChange={(e) => setDone(e.target.value)} rows={4} className="app-input resize-none text-[13px]" placeholder="What you finished" />
          <label className="app-label text-[13px]">Blockers</label>
          <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={2} className="app-input resize-none text-[13px]" placeholder="Waiting on someone, or none" />
          <label className="app-label text-[13px]">Tomorrow</label>
          <textarea value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} rows={2} className="app-input resize-none text-[13px]" placeholder="What you will do next" />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary h-9 px-4 text-[13px]">
              {loading ? 'Saving…' : 'Save report'}
            </button>
          </div>
        </form>
      </div>

      <h2 className="mb-3 text-[13px] font-semibold text-ink">History</h2>
      <div className="space-y-2">
        {reports.length === 0 ? (
          <p className="text-[13px] text-muted">No past reports.</p>
        ) : reports.map((r) => (
          <div key={r._id} className="rounded border border-line bg-surface p-4">
            <p className="text-xs font-medium text-muted">{format(new Date(r.date), 'dd MMM yyyy')}</p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] text-ink">{r.reportText}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default DailyReports;

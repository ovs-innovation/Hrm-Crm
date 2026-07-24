import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PageShell from '../components/PageShell';
import api from '../services/api';

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchReports = async () => {
    const res = await api.get('/reports/my');
    setReports(res.data);
    const todayReport = res.data.find((r) => r.date === today);
    if (todayReport) setReportText(todayReport.reportText);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return toast.error('Write something first');
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
          <label className="app-label text-[13px]">What did you work on today?</label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={5}
            className="app-input resize-none text-[13px]"
            placeholder="Tasks completed, blockers, notes for manager…"
          />
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

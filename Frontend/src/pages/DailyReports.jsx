import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FiEdit3, FiSave, FiClock } from 'react-icons/fi';

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports/my');
      setReports(response.data);
      // Pre-fill today's report if it exists
      const todaysReport = response.data.find(r => r.date === today);
      if (todaysReport) {
        setReportText(todaysReport.reportText);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return toast.error('Report cannot be empty');

    setLoading(true);
    try {
      await api.post('/reports', { date: today, reportText });
      toast.success('Report saved successfully!');
      fetchReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Daily Work Reports</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Write your end-of-day report and checkout.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiEdit3 className="text-blue-500" />
          Today's Report ({format(new Date(), 'MMM dd, yyyy')})
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="What did you work on today? Any blockers?"
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <FiSave />
              {loading ? 'Saving...' : 'Save Report & Checkout'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <FiClock className="text-blue-500" />
            Report History
          </h3>
          <div className="relative">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-3 pr-4 py-2 w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-700 dark:text-slate-200 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              style={{ colorScheme: 'light dark' }}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports
            .filter(r => !filterDate || r.date === filterDate)
            .map((report) => (
            <div key={report._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                {format(new Date(report.date), 'MMM dd, yyyy')}
              </div>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm line-clamp-4">
                {report.reportText}
              </p>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              No reports found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReports;

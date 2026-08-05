import React, { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FiTrendingUp, FiActivity, FiDollarSign, FiClock, FiList, FiCpu } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AiCostDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get('/ai/logs/stats'),
          api.get('/ai/logs')
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data || []);
      } catch (err) {
        setStats(null);
        setLogs([]);
        toast.error(err.response?.data?.message || 'Failed to load AI cost analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageShell
      title="AI Resource & Cost Analytics"
      description="Real-time monitoring of model completions usage, latency parameters, and token cost metrics"
    >
      <div className="space-y-6 text-ink text-[13px]">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : (
          <>
            {/* Stats row cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-line bg-surface p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase">Today's AI Requests</span>
                  <p className="mt-1.5 text-2xl font-black text-ink">{stats?.todayCount || 0}</p>
                </div>
                <div className="p-2.5 rounded bg-brand/5 border border-brand/10 text-brand">
                  <FiActivity className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded border border-line bg-surface p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase">Today's Cost (USD)</span>
                  <p className="mt-1.5 text-2xl font-black text-ink">${stats?.todayCost?.toFixed(5) || '0.00000'}</p>
                </div>
                <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-500">
                  <FiDollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded border border-line bg-surface p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase">Monthly Accum. Cost</span>
                  <p className="mt-1.5 text-2xl font-black text-ink">${stats?.monthlyCost?.toFixed(4) || '0.0000'}</p>
                </div>
                <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded border border-line bg-surface p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-muted uppercase">Total Audited Hits</span>
                  <p className="mt-1.5 text-2xl font-black text-ink">{stats?.totalRequests || 0}</p>
                </div>
                <div className="p-2.5 rounded bg-purple-500/5 border border-purple-500/10 text-purple-500">
                  <FiCpu className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Logs audit list */}
            <div className="rounded border border-line bg-surface p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <h4 className="text-sm font-bold flex items-center gap-1.5 text-ink"><FiList className="text-brand" /> AI Completion Transaction Logs</h4>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wide">Showing latest 50 hits</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-10 text-muted font-semibold">No AI transaction logs recorded yet.</div>
              ) : (
                <div className="overflow-x-auto border border-line/60 rounded bg-soft/15">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-soft text-muted font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Prompt Query</th>
                        <th className="px-4 py-3 text-right">Tokens (In/Out)</th>
                        <th className="px-4 py-3 text-right">Latency</th>
                        <th className="px-4 py-3 text-right">Cost (USD)</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, idx) => (
                        <tr key={idx} className="border-b border-line/60 last:border-0 hover:bg-soft/40">
                          <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleTimeString()}</td>
                          <td className="px-4 py-3 capitalize font-bold text-ink">{log.provider || 'gemini'}</td>
                          <td className="px-4 py-3 text-muted font-mono text-[11px]">{log.model || 'gemini-2.0-flash'}</td>
                          <td className="px-4 py-3 text-ink font-semibold">{log.user}</td>
                          <td className="px-4 py-3 text-ink font-medium max-w-xs truncate" title={log.prompt}>
                            {log.prompt}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-ink">
                            {log.promptTokens !== undefined ? `${log.promptTokens}/${log.completionTokens}` : log.tokensCount}
                          </td>
                          <td className="px-4 py-3 text-right text-muted font-medium flex items-center justify-end gap-1"><FiClock /> {log.latencyMs}ms</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">${log.costUSD?.toFixed(5)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'Failed' 
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`} title={log.errorMessage || 'Success'}>
                              {log.status || 'Success'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default AiCostDashboard;

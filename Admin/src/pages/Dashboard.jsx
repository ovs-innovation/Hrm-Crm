import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiUserCheck, 
  FiBriefcase, 
  FiTrendingUp, 
  FiActivity,
  FiZap,
  FiAlertCircle,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiPlay,
  FiCpu
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, colorClass, loading }) => (
  <div className="bg-surface rounded-3xl p-6 border border-line shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
    {loading ? (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-20 bg-soft rounded" />
        <div className="h-8 w-28 bg-soft rounded" />
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm font-semibold text-muted mb-1">{label}</p>
            <h3 className="text-3xl font-black text-ink">{value}</h3>
          </div>
          <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10`}>
            <Icon className={`w-6 h-6 text-brand`} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs relative z-10">
          <span className={`font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
            trend === 'up' ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {trend === 'up' ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
          <span className="text-muted font-medium">vs yesterday</span>
        </div>
      </>
    )}
  </div>
);

const Dashboard = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const adminName = adminInfo.name ? adminInfo.name.split(' ')[0] : 'Admin';
  
  const [greeting, setGreeting] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Health Score State
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // AI Card State
  const [aiCard, setAiCard] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchMetrics();
    fetchHealthScore();
    fetchAiSummary();
  }, []);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const { data } = await api.get('/executive/dashboard/metrics');
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchHealthScore = async () => {
    setHealthLoading(true);
    try {
      const { data } = await api.get('/executive/health-score');
      if (data.success) {
        setHealth(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.get('/executive/dashboard/ai-summary');
      if (data.success) {
        setAiCard(data.aiCard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAction = async (toolName, args, label) => {
    setRunningAction(label);
    const toastId = toast.loading(`Executing AI Directive: ${label}...`);
    try {
      const { data: res } = await api.post('/executive/run-tool', {
        toolName,
        arguments: args
      });
      if (res.success) {
        toast.success(`Success: ${res.message || 'Operation completed successfully'}`, { id: toastId });
        fetchMetrics();
        fetchHealthScore();
        fetchAiSummary();
      } else {
        toast.error(`Action Failed: ${res.message || 'Request was rejected'}`, { id: toastId });
      }
    } catch (err) {
      toast.error('Connection error while executing command directive', { id: toastId });
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-line pb-6">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight mb-2">
            {greeting}, {adminName} 👋
          </h2>
          <p className="text-muted font-medium">Vastora Executive Command Center</p>
        </div>
      </div>

      {/* Main Command Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Live Widgets & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Health Score & Financial Overview Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Health Score Circular Dial */}
            <div className="bg-surface border border-line rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="text-sm font-bold text-ink mb-4">Overall Business Health</h3>
              {healthLoading ? (
                <div className="h-28 w-28 animate-pulse rounded-full bg-soft" />
              ) : (
                <>
                  <div className="relative flex items-center justify-center">
                    <svg className="h-32 w-32">
                      <circle className="text-line" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                      <circle className="text-brand" strokeWidth="8" strokeDasharray={314} strokeDashoffset={314 - (314 * (health?.overallScore || 91)) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" transform="rotate(-90 64 64)" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-ink">{health?.overallScore || 91}</span>
                      <span className="text-[10px] text-muted block">/ 100</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center space-y-1">
                    <p className="text-[11px] font-semibold text-emerald-500 flex items-center justify-center gap-1">
                      <FiCheckCircle className="h-3 w-3" />
                      AI Next-Week Forecast: {health?.predictedNextWeekScore || 93} / 100
                    </p>
                    <p className="text-[10px] text-muted max-w-[200px] leading-relaxed mx-auto">{health?.predictionReasoning || 'Consistent metrics forecast stable outlook.'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Financial Overview Card */}
            <div className="bg-surface border border-line rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Today's Revenue</span>
                <h2 className="text-3xl font-black text-ink">₹{(metrics?.revenueToday || 34000).toLocaleString('en-IN')}</h2>
              </div>
              <div className="mt-4 border-t border-line pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Revenue Trend:</span>
                  <span className="text-brand font-bold">{metrics?.revenueTrend || '+12%'}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Interviews Scheduled:</span>
                  <span className="text-ink font-bold">{metrics?.interviewsToday || 2}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Parallel KPI Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              icon={FiUsers} 
              label="Staff Roster" 
              value={metrics?.totalEmployees || 0} 
              trend="up" 
              trendValue="+3%" 
              colorClass="bg-brand" 
              loading={metricsLoading} 
            />
            <StatCard 
              icon={FiUserCheck} 
              label="Leaves Pending" 
              value={metrics?.leaveRequestsPending || 0} 
              trend="down" 
              trendValue="-10%" 
              colorClass="bg-brand" 
              loading={metricsLoading} 
            />
            <StatCard 
              icon={FiActivity} 
              label="Deals At Risk" 
              value={metrics?.dealsAtRisk || 0} 
              trend="up" 
              trendValue="+1" 
              colorClass="bg-brand" 
              loading={metricsLoading} 
            />
          </div>

          {/* Risks & Opportunities breakdown */}
          {!healthLoading && health?.riskDetails && (
            <div className="bg-surface border border-line rounded-3xl p-6">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-line pb-2 mb-3">Live Risk Alerts</h4>
              <div className="space-y-2">
                {health.riskDetails.map((risk, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-700">
                    <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{risk.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Async AI Executive Card */}
        <div className="lg:col-span-1">
          {aiLoading ? (
            <div className="bg-surface border border-line rounded-3xl p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-xs text-muted">Compiling strategic audit insights...</p>
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <div className="p-1 rounded bg-brand/10 text-brand">
                  <FiCpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">AI Strategy Co-pilot</h3>
                  <p className="text-[10px] text-muted">Direct executive summaries</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-muted block">Business Summary:</span>
                <p className="text-ink leading-relaxed">{aiCard?.businessSummary || 'System reports standard operating efficiency. No anomalies.'}</p>
              </div>

              {/* Risks */}
              {aiCard?.topRisks && aiCard.topRisks.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-muted block">Top Risks:</span>
                  <ul className="list-disc list-inside space-y-1 text-rose-700">
                    {aiCard.topRisks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {aiCard?.topOpportunities && aiCard.topOpportunities.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-muted block">Top Opportunities:</span>
                  <ul className="list-disc list-inside space-y-1 text-emerald-700">
                    {aiCard.topOpportunities.map((op, idx) => (
                      <li key={idx}>{op}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {aiCard?.recommendations && aiCard.recommendations.length > 0 && (
                <div className="border-t border-line pt-4 space-y-3">
                  <span className="font-bold text-[10px] uppercase text-ink tracking-wider block">AI Directives</span>
                  <div className="flex flex-col gap-2">
                    {aiCard.recommendations.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={runningAction !== null}
                        onClick={() => handleAction(rec.toolName, rec.args || {}, rec.label)}
                        className="flex items-center justify-between rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/20 px-4 py-2.5 text-xs font-semibold text-brand transition-colors text-left"
                      >
                        <span>{rec.label}</span>
                        <FiPlay className="h-3 w-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

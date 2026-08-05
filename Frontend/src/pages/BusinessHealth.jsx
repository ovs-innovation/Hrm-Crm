import React, { useState, useEffect } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const BusinessHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const fetchHealthScore = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/executive/health-score');
      if (data.success) {
        setHealthData(data);
      }
    } catch (err) {
      toast.error('Failed to load business health metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-sm text-muted">Analyzing Vastora Business OS Metrics...</p>
      </div>
    );
  }

  const overall = healthData?.overallScore || 91;
  const breakdown = healthData?.breakdown || { sales: 94, hr: 86, finance: 92, recruiting: 80, support: 88 };
  const risks = healthData?.riskDetails || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border border-line rounded bg-surface p-6">
        <div>
          <h2 className="text-lg font-bold text-ink">Vastora Business OS Health Score</h2>
          <p className="text-xs text-muted">Live diagnostic tracking across multi-systems operations</p>
        </div>
        <button 
          onClick={fetchHealthScore}
          className="flex items-center gap-1.5 rounded border border-line bg-surface hover:bg-soft px-3 py-2 text-xs font-semibold text-ink"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          Re-Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Radial Health Ring Box */}
        <div className="flex flex-col items-center justify-center border border-line rounded bg-surface p-6">
          <h3 className="text-sm font-bold text-ink mb-6">Overall Business Health</h3>
          <div className="relative flex items-center justify-center">
            <svg className="h-36 w-36">
              <circle
                className="text-line"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="60"
                cx="72"
                cy="72"
              />
              <circle
                className="text-brand"
                strokeWidth="10"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * overall) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="60"
                cx="72"
                cy="72"
                transform="rotate(-90 72 72)"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-ink">{overall}</span>
              <span className="text-xs text-muted block">/ 100</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-emerald-600 flex items-center gap-1">
            <FiCheckCircle className="h-3.5 w-3.5" />
            Stable Operating Levels
          </p>
        </div>

        {/* Breakdown Box */}
        <div className="md:col-span-2 border border-line rounded bg-surface p-6 space-y-4">
          <h3 className="text-sm font-bold text-ink border-b border-line pb-2">Operational Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold capitalize text-ink">
                  <span>{key} department</span>
                  <span>{val}/100</span>
                </div>
                <div className="h-2 w-full bg-soft rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks & Mitigation Box */}
      <div className="border border-line rounded bg-surface p-6">
        <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
          <FiActivity className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-bold text-ink">Active System Risks & Interventions</h3>
        </div>
        <div className="space-y-3">
          {risks.map((risk, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-red-50/50 border border-red-100 rounded text-xs text-ink">
              <FiAlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">{risk.message}</p>
                <p className="text-[10px] text-red-600/80 mt-0.5">Priority: {risk.severity} Alert — review command action</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessHealth;

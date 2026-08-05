import React, { useState } from 'react';
import { FiCpu, FiPlay, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const AICopilotCard = ({ title = 'AI Copilot Advisor', data, loading, onActionCompleted }) => {
  const [runningAction, setRunningAction] = useState(null);

  if (loading) {
    return (
      <div className="border border-line rounded bg-surface p-6 flex flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-xs text-muted">Consulting AI model...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

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
        if (onActionCompleted) onActionCompleted();
      } else {
        toast.error(`Action Failed: ${res.message || 'Request was rejected'}`, { id: toastId });
      }
    } catch (err) {
      toast.error('Connection error while executing command directive', { id: toastId });
    } finally {
      setRunningAction(null);
    }
  };

  // Structured metrics
  const summary = data.insights?.overallRating || data.insights?.summary || 'Standard profile review.';
  const promotion = data.insights?.promotionSuggestion || 'Pending evaluation cycle.';
  const attrition = data.insights?.riskLevel || 'Low';
  const skillsGap = Array.isArray(data.insights?.strengths) ? data.insights.strengths.join(', ') : 'None marked';
  const attendanceAnalysis = data.insights?.attendanceScore ? `Score: ${data.insights.attendanceScore}%` : 'Normal checks.';
  const leavePattern = data.insights?.leavePattern || 'No anomaly.';
  const performanceTrend = data.insights?.performance || 'Steady output.';
  const gpsAnomaliesCount = data.insights?.gpsAnomaliesCount || 0;
  const dailyTrends = data.insights?.dailyTrends || [];
  
  // Custom action recommendations based on parsed values
  const recommendations = [
    {
      label: 'Schedule 1:1 Sync',
      toolName: 'scheduleMeeting',
      args: { title: `1:1 Performance Alignment: ${data.employeeName}`, duration: 30, scheduledAt: new Date(Date.now() + 86400000).toISOString() }
    },
    {
      label: 'Assign System Task',
      toolName: 'createTask',
      args: { title: 'AWS / Cloud Integration Training', description: 'Complete designated team skills upgrade program.', assignedTo: data.insights?.employeeId || '#EMP0001', dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0] }
    },
    {
      label: 'Send Check-in Email',
      toolName: 'sendEmail',
      args: { to: 'employee@company.com', subject: 'Vastora OS: Skills & Development Discussion', body: 'Hi, I would like to schedule a quick checkpoint to align on learning pathways and promotion readiness.' }
    }
  ];

  return (
    <div className="border border-line rounded bg-surface p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <div className="p-1 rounded bg-brand-xlight text-brand">
          <FiCpu className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <p className="text-[10px] text-muted">Vastora OS Contextual Co-pilot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1 md:col-span-2">
          <span className="font-semibold text-muted">Summary:</span>
          <p className="text-ink">{summary}</p>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Promotion Readiness:</span>
          <p className="text-ink">{promotion}</p>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Attrition Risk:</span>
          <span className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${attrition.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {attrition}
          </span>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Key Strengths / Skills:</span>
          <p className="text-ink">{skillsGap}</p>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Attendance Analysis:</span>
          <p className="text-ink">{attendanceAnalysis}</p>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Leave Pattern:</span>
          <p className="text-ink">{leavePattern}</p>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-muted">Performance Trend:</span>
          <p className="text-ink">{performanceTrend}</p>
        </div>
        {gpsAnomaliesCount > 0 && (
          <div className="md:col-span-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded p-2 text-red-700">
            <FiAlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">GPS Distance Anomaly Detected</p>
              <p className="text-[10px] text-red-600/90">{gpsAnomaliesCount} check-ins detected outside authorized geofence.</p>
            </div>
          </div>
        )}

        {/* Attendance daily trends chart/indicators */}
        {dailyTrends.length > 0 && (
          <div className="md:col-span-2 border border-line rounded p-3 bg-soft/50 space-y-2">
            <div className="flex items-center gap-1.5 border-b border-line pb-1.5 mb-1.5">
              <FiActivity className="h-3.5 w-3.5 text-brand" />
              <span className="font-semibold text-[10px] uppercase text-ink">Check-in Trend Analysis</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {dailyTrends.map((t, idx) => (
                <div key={idx} className="flex flex-col items-center min-w-[32px] p-1 bg-surface border border-line rounded text-[9px]">
                  <span className="text-muted">{t.date.split('-')[2] || t.date}</span>
                  <span className={`h-2.5 w-2.5 rounded-full mt-1 ${t.isGpsAnomaly ? 'bg-red-500 animate-pulse' : (t.status.includes('Late') ? 'bg-amber-400' : 'bg-green-500')}`} title={`${t.status}${t.isGpsAnomaly ? ' (GPS Outlier)' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Recommendation Buttons */}
      <div className="border-t border-line pt-4 space-y-2">
        <p className="text-[10px] font-bold text-ink uppercase tracking-wide">Recommended Actions</p>
        <div className="flex flex-wrap gap-2">
          {recommendations.map((rec, i) => (
            <button
              key={i}
              type="button"
              disabled={runningAction !== null}
              onClick={() => handleAction(rec.toolName, rec.args, rec.label)}
              className="flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
            >
              <FiPlay className="h-3 w-3" />
              {rec.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICopilotCard;

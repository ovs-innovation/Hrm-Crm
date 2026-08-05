import React, { useState } from 'react';
import { FiCpu, FiPlay, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCalendar, FiUser, FiGlobe } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const AICopilotCard = ({ title = 'AI Copilot Advisor', type = 'Deal', data, loading, onActionCompleted }) => {
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

  // Structured fields
  const score = data.score || 'Warm';
  const probability = data.probability ? `${data.probability}%` : '70%';
  const confidence = data.confidenceScore ? `${data.confidenceScore * 100}%` : (data.confidence ? `${data.confidence * 100}%` : '85%');
  const reason = data.explanation || data.reason || 'Calculated using pipeline history.';

  // Custom action recommendations based on type
  let recommendations = [];
  if (type === 'Payroll') {
    recommendations = [
      {
        label: 'Generate Bulk Payroll Slips',
        toolName: 'generatePayroll',
        args: { employeeId: '#ALL', employeeName: 'Bulk', month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), basicSalary: 55000, allowances: 5000, deductions: 2000 }
      },
      {
        label: 'Run Cost Simulator',
        toolName: 'searchKnowledge',
        args: { query: 'Run workforce payroll sandbox projections' }
      }
    ];
  } else if (type === 'Recruitment') {
    recommendations = [
      {
        label: 'Schedule Interview',
        toolName: 'scheduleMeeting',
        args: { title: `Technical Interview: ${data.name || 'Candidate'}`, duration: 45, scheduledAt: new Date(Date.now() + 86400000).toISOString(), location: 'Vastora Meet' }
      },
      {
        label: 'Hire Candidate',
        toolName: 'createEmployee',
        args: { employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, name: data.name || 'Candidate', email: data.email || 'candidate@company.com', department: 'Engineering', designation: 'Software Engineer', joinDate: new Date(Date.now() + 1209600000).toISOString().split('T')[0] }
      },
      {
        label: 'Reject Candidate',
        toolName: 'sendEmail',
        args: { to: data.email || 'candidate@company.com', subject: 'Vastora Recruitment Update', body: `Hi ${data.name || 'Candidate'}, thank you for your interest in our openings.` }
      }
    ];
  } else if (type === 'ClientTimeline') {
    recommendations = [
      {
        label: 'Schedule Renewal Meeting',
        toolName: 'scheduleMeeting',
        args: { title: 'Account Review & Renewal Alignment', duration: 45, scheduledAt: new Date(Date.now() + 172800000).toISOString() }
      },
      {
        label: 'Draft Follow-up Email',
        toolName: 'sendEmail',
        args: { to: data.email || 'client@company.com', subject: 'Vastora Account Follow-up', body: 'Hi, following up regarding our recent projects.' }
      },
      {
        label: 'Send WhatsApp Ping',
        toolName: 'sendWhatsapp',
        args: { to: '919999999999', message: 'Hello, checking in regarding the pending proposals.' }
      }
    ];
  } else if (type === 'Document') {
    recommendations = [
      {
        label: 'Create Review Task',
        toolName: 'createTask',
        args: { title: `Review compliance items: ${data.documentType || 'Doc'}`, description: `Audit actions & deadlines: ${data.actionItems ? data.actionItems.join(', ') : 'Audit document clauses'}`, dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0] }
      },
      {
        label: 'Schedule Follow-up Meeting',
        toolName: 'scheduleMeeting',
        args: { title: `Doc Strategy Align: ${data.documentType || 'Review'}`, duration: 30, scheduledAt: new Date(Date.now() + 86400000).toISOString() }
      },
      {
        label: 'Draft Summary Email',
        toolName: 'sendEmail',
        args: { to: 'legal@company.com', subject: 'Document Audit Review Alert', body: `Identified risks: ${data.risks ? data.risks.map(r => r.message).join('; ') : 'No high risks identified'}` }
      }
    ];
  } else {
    recommendations = [
      {
        label: 'Draft Propose Invoice',
        toolName: 'createInvoice',
        args: { number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, clientName: data.clientName || 'Client', total: data.amount || 50000, dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0] }
      },
      {
        label: 'Assign Sales Owner',
        toolName: 'assignSalesperson',
        args: { clientId: data.client || '603d...', salespersonName: 'Self' }
      },
      {
        label: 'Send Follow-up Message',
        toolName: 'sendWhatsapp',
        args: { to: '919999999999', message: 'Hello, following up regarding the proposed agreement.' }
      }
    ];
  }

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
        {type === 'Payroll' ? (
          <>
            <div className="space-y-1 md:col-span-2">
              <span className="font-semibold text-muted">Forecast Prediction:</span>
              <p className="text-ink font-bold text-brand">{data.prediction || 'Steady payroll overhead expected.'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Trend direction:</span>
              <p className="text-ink uppercase font-bold text-brand">{data.trend || 'Stable'}</p>
            </div>
          </>
        ) : type === 'Recruitment' ? (
          <>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Candidate Match %:</span>
              <p className="text-brand font-black text-sm">{data.matchPercentage || '85'}%</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Recommendation:</span>
              <p className="text-ink font-semibold">{data.hiringRecommendation || 'Highly Recommended'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Target Salary:</span>
              <p className="text-ink font-medium">₹{Number(data.salaryRecommendation || 65000).toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Risk Profile:</span>
              <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold">Low Risk</span>
            </div>
          </>
        ) : type === 'ClientTimeline' ? (
          <>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Client Health Score:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-brand font-black text-sm">{data.healthScore || '92'} / 100</span>
                {data.trend === 'up' ? <FiTrendingUp className="text-brand h-3 w-3" /> : <FiTrendingDown className="text-rose-500 h-3 w-3" />}
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Relationship Summary:</span>
              <p className="text-ink leading-relaxed">{data.relationshipSummary || 'Healthy active accounts interaction.'}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="font-semibold text-muted">Growth Opportunities:</span>
              <p className="text-emerald-600 font-medium">{data.growthOpportunities || 'Upsell advanced support modules.'}</p>
            </div>
            {data.riskAnalysis && (
              <div className="space-y-1 md:col-span-2 flex items-start gap-1 bg-rose-50 border border-rose-100 rounded p-2 text-rose-700">
                <FiAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[10px]">Risk Alert:</span>
                  <p className="text-[10px] text-rose-600">{data.riskAnalysis}</p>
                </div>
              </div>
            )}
            {data.nextBestAction && (
              <div className="space-y-1 md:col-span-2 border-l-2 border-brand pl-2.5 bg-soft/50 py-1">
                <span className="font-semibold text-muted uppercase text-[9px]">Next Best Action:</span>
                <p className="text-ink font-semibold">{data.nextBestAction}</p>
              </div>
            )}
          </>
        ) : type === 'Document' ? (
          <>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Classification:</span>
              <p className="text-brand font-black text-xs uppercase">{data.documentType || 'Contract'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Analysis Summary:</span>
              <p className="text-ink leading-relaxed">{data.summary || 'Summary generated upon parsing.'}</p>
            </div>
            {data.importantDates && data.importantDates.length > 0 && (
              <div className="space-y-1 md:col-span-2 flex items-start gap-1 bg-soft/50 rounded p-2">
                <FiCalendar className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[9px] uppercase block mb-0.5">Identified Deadlines / Dates</span>
                  <p className="text-[10px] text-ink">{data.importantDates.join(', ')}</p>
                </div>
              </div>
            )}
            {data.peopleMentioned && data.peopleMentioned.length > 0 && (
              <div className="space-y-0.5 md:col-span-2">
                <span className="font-semibold text-muted">Key Parties:</span>
                <p className="text-ink">{data.peopleMentioned.join(', ')}</p>
              </div>
            )}
            {data.risks && data.risks.length > 0 && (
              <div className="md:col-span-2 border border-red-100 bg-red-50 rounded p-2.5 text-red-700 space-y-1">
                <span className="font-bold text-[9px] uppercase block mb-1">Contract Compliance Risk Flags</span>
                {data.risks.map((r, idx) => (
                  <div key={idx} className="text-[10px] space-y-0.5">
                    <p className="font-semibold flex items-center gap-1">
                      <FiAlertTriangle className="text-red-500 h-3 w-3 shrink-0" />
                      [{r.severity}] {r.message}
                    </p>
                    <p className="text-[9px] text-red-600/90 pl-4">{r.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1 md:col-span-2">
              <span className="font-semibold text-muted">Win Predictor:</span>
              <p className="text-ink font-bold text-brand">{probability} Probability ({score})</p>
            </div>
            {data.reasoningList && data.reasoningList.length > 0 && (
              <div className="space-y-1 md:col-span-2 bg-soft/50 rounded p-2.5">
                <span className="font-semibold text-muted block mb-1">Explainable Factors:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-ink/80">
                  {data.reasoningList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.nextBestAction && (
              <div className="space-y-1 md:col-span-2 border-l-2 border-brand pl-2.5 py-0.5">
                <span className="font-semibold text-muted text-[10px] uppercase">Next Best Action:</span>
                <p className="text-ink font-medium">{data.nextBestAction}</p>
              </div>
            )}
          </>
        )}
        
        {type !== 'Recruitment' && type !== 'ClientTimeline' && type !== 'Document' && (
          <div className="space-y-1 md:col-span-2">
            <span className="font-semibold text-muted">Reasoning Summary:</span>
            <p className="text-ink">{reason}</p>
          </div>
        )}
        
        <div className="space-y-1">
          <span className="font-semibold text-muted">AI Confidence:</span>
          <p className="text-ink">{confidence}</p>
        </div>
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

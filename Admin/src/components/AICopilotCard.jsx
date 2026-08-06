import React, { useState } from 'react';
import { FiCpu, FiPlay, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCalendar, FiUser, FiInfo, FiX, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const AICopilotCard = ({ title = 'AI Copilot Advisor', type = 'Deal', data, loading, onActionCompleted }) => {
  const [runningAction, setRunningAction] = useState(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

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

  const handleFetchExplanation = async () => {
    setExplainOpen(true);
    setLoadingExplain(true);
    try {
      const { data: res } = await api.get(`/ai/explain/${type}`);
      if (res.success) {
        setExplanation(res.explanation);
      }
    } catch (err) {
      toast.error('Failed to retrieve reasoning explanation log');
    } finally {
      setLoadingExplain(false);
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
      }
    ];
  } else if (type === 'Document') {
    recommendations = [
      {
        label: 'Create Review Task',
        toolName: 'createTask',
        args: { title: `Review compliance items: ${data.documentType || 'Doc'}`, description: `Audit actions & deadlines: ${data.actionItems ? data.actionItems.join(', ') : 'Audit document clauses'}`, dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0] }
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
      }
    ];
  }

  return (
    <div className="border border-line rounded-3xl bg-surface p-6 space-y-4 shadow-sm relative">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-brand-xlight text-brand">
            <FiCpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="text-[10px] text-muted">Vastora OS Contextual Co-pilot</p>
          </div>
        </div>
        <button
          onClick={handleFetchExplanation}
          className="btn-outline h-7 px-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand rounded-full border border-brand/20 hover:bg-brand/5"
        >
          <FiInfo className="h-3.5 w-3.5" /> Why?
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {type === 'Payroll' ? (
          <>
            <div className="space-y-1 md:col-span-2">
              <span className="font-semibold text-muted">Forecast Prediction:</span>
              <p className="text-brand font-bold text-sm">{data.prediction || 'Steady payroll overhead expected.'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-muted">Trend direction:</span>
              <p className="text-brand uppercase font-black">{data.trend || 'Stable'}</p>
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
              <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-bold">Low Risk</span>
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
                <p className="text-brand font-semibold">{data.nextBestAction}</p>
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
              <p className="text-brand font-bold">{probability} Probability ({score})</p>
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
                <p className="text-brand font-semibold">{data.nextBestAction}</p>
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
          <p className="text-brand font-black">{confidence}</p>
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

      {/* Explainability Modal Panel */}
      {explainOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-line rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <FiCpu className="text-brand h-5 w-5" />
                <h3 className="text-sm font-bold text-ink">AI Decision Audit Log</h3>
              </div>
              <button onClick={() => setExplainOpen(false)} className="text-muted hover:text-ink"><FiX className="h-4 w-4" /></button>
            </div>

            {loadingExplain ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="text-xs text-muted">Fetching audit trial logs...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-ink/95">
                
                {/* Confidence bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Audit Confidence Match</span>
                    <span className="text-brand">{explanation?.confidence || 92}%</span>
                  </div>
                  <div className="h-2 bg-soft rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${explanation?.confidence || 92}%` }} />
                  </div>
                </div>

                {/* Sources Used */}
                <div className="space-y-1.5 bg-soft/50 rounded-2xl p-4">
                  <span className="font-bold text-muted uppercase text-[10px] tracking-wide block">Context Sources Retrieved</span>
                  <ul className="space-y-1.5 pl-2 list-disc list-inside">
                    {explanation?.sources?.map((src, i) => (
                      <li key={i}>{src}</li>
                    ))}
                  </ul>
                </div>

                {/* Reasoning bullet points */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted uppercase text-[10px] tracking-wide block">Explainable Factors</span>
                  <ul className="space-y-1.5">
                    {explanation?.reasoning?.map((reason, i) => (
                      <li key={i} className="flex gap-2 items-start bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-emerald-800">
                        <FiCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Models used */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted uppercase text-[10px] tracking-wide block">Models & Inference Engine</span>
                  <p className="text-muted leading-relaxed font-semibold">{explanation?.modelsUsed?.join(', ')}</p>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AICopilotCard;

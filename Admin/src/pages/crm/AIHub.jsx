import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiActivity,
  FiAlertTriangle,
  FiBookOpen,
  FiCheckCircle,
  FiCpu,
  FiExternalLink,
  FiFileText,
  FiMic,
  FiMicOff,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSettings,
  FiTrash2,
  FiTrendingUp,
  FiUploadCloud,
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FiActivity },
  { id: 'search', label: 'NL Search', icon: FiSearch },
  { id: 'resume', label: 'Candidate screener', icon: FiUploadCloud },
  { id: 'docs', label: 'Document studio', icon: FiFileText },
  { id: 'kb', label: 'Knowledge base', icon: FiBookOpen },
  { id: 'meeting', label: 'Meeting summary', icon: FiCheckCircle },
  { id: 'automation', label: 'Automation', icon: FiSettings },
];
const TAB_IDS = TABS.map((t) => t.id);
const FORECAST_TYPES = ['Sales', 'Payroll', 'Attrition'];
const DOC_TEMPLATES = {
  'Offer Letter': {
    content: `{{date}}

To,
{{employeeName}}

Dear {{employeeName}},

We are pleased to offer you the position of {{designation}} at Vastora. Your annual compensation package will be {{salary}}.

Sincerely,
Operations Management`,
    placeholders: () => ({
      date: new Date().toLocaleDateString('en-IN'),
      employeeName: '',
      designation: '',
      salary: '',
    }),
  },
  'Appointment Letter': {
    content: `To,
{{employeeName}}

Dear {{employeeName}},

We are pleased to appoint you as {{designation}} with a salary of {{salary}} effective {{date}}.

Sincerely,
HR Manager`,
    placeholders: () => ({
      employeeName: '',
      designation: '',
      salary: '',
      date: new Date().toLocaleDateString('en-IN'),
    }),
  },
  'Warning Letter': {
    content: `To,
{{employeeName}}

Dear {{employeeName}},

This is a formal warning letter regarding attendance. Your attendance report indicates {{lateDays}} late marks this month.

Best,
HR Operations`,
    placeholders: () => ({
      employeeName: '',
      lateDays: '',
    }),
  },
};
const AUTOMATION_STEPS = [
  'Assign Account Owner',
  'Send Welcome Email',
  'Create Follow-up Task',
  'Notify Sales Slack',
  'Schedule Kickoff Meeting',
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const apiError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const Spinner = ({ label = 'Working…' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
    <FiRefreshCw className="h-4 w-4 animate-spin text-brand" />
    {label}
  </div>
);

const EmptyState = ({ children }) => (
  <div className="rounded border border-dashed border-line bg-soft/40 px-4 py-10 text-center text-[13px] text-muted">
    {children}
  </div>
);

const AIHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = TAB_IDS.includes(tabParam) ? tabParam : 'dashboard';

  const [busy, setBusy] = useState('');
  const [aiHealth, setAiHealth] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [nlSearchResults, setNlSearchResults] = useState(null);
  const [searchCollection, setSearchCollection] = useState('');
  const [searchExplanation, setSearchExplanation] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [parsedResume, setParsedResume] = useState(null);
  const [candidateRankings, setCandidateRankings] = useState(null);
  const [jobReqs, setJobReqs] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState('Offer Letter');
  const [docContent, setDocContent] = useState(DOC_TEMPLATES['Offer Letter'].content);
  const [placeholders, setPlaceholders] = useState(DOC_TEMPLATES['Offer Letter'].placeholders());

  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [meetingSummaryResult, setMeetingSummaryResult] = useState(null);

  const [kbDocs, setKbDocs] = useState([]);
  const [kbQuestion, setKbQuestion] = useState('');
  const [kbChatHistory, setKbChatHistory] = useState([
    { sender: 'ai', text: 'Ask a question about uploaded policies, SOPs, or handbooks. Answers come only from indexed documents.' },
  ]);
  const [kbSources, setKbSources] = useState([]);
  const chatEndRef = useRef(null);
  const kbInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [workflowName, setWorkflowName] = useState('Lead welcome sequence');
  const [newStepLabel, setNewStepLabel] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState([
    { id: '1', type: 'trigger', label: 'Lead Created' },
    { id: '2', type: 'action', label: 'Assign Account Owner' },
    { id: '3', type: 'action', label: 'Send Welcome Email' },
  ]);

  const [forecastType, setForecastType] = useState('Sales');
  const [forecastResult, setForecastResult] = useState(null);
  const [salesCoachData, setSalesCoachData] = useState(null);

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  const validateFile = (file, { acceptPdfOnly = false } = {}) => {
    if (!file) return 'Please choose a file.';
    if (file.size > MAX_FILE_BYTES) return 'File is too large. Maximum size is 10MB.';
    const name = file.name.toLowerCase();
    if (acceptPdfOnly && !name.endsWith('.pdf') && file.type !== 'application/pdf') {
      return 'Only PDF files are supported here.';
    }
    return '';
  };

  const fetchHealth = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/health');
      setAiHealth({ ...data, authError: false });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setAiHealth({ authError: true, activeProvider: null, providers: {} });
        return;
      }
      setAiHealth({ authError: false, activeProvider: 'unknown', providers: {} });
    }
  }, []);

  const fetchDashboardData = useCallback(async ({ signal } = {}) => {
    setBusy('dashboard');
    setDashboardError('');
    try {
      const res = await api.get('/ai/dashboard', { signal });
      setDashboardData(res.data);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      setDashboardError(apiError(err, 'Failed to load AI insights'));
      toast.error(apiError(err, 'Failed to load AI insights'));
    } finally {
      setBusy('');
    }
  }, []);

  const fetchKbDocs = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/documents');
      setKbDocs(Array.isArray(data) ? data : []);
    } catch {
      setKbDocs([]);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (activeTab !== 'dashboard') return undefined;
    const controller = new AbortController();
    fetchDashboardData({ signal: controller.signal });
    return () => controller.abort();
  }, [activeTab, fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'kb') fetchKbDocs();
  }, [activeTab, fetchKbDocs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kbChatHistory]);

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const healthOk = useMemo(() => {
    const providers = aiHealth?.providers || {};
    return Object.values(providers).some((p) => p?.configured && p?.reachable);
  }, [aiHealth]);

  const handleNLSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setBusy('search');
    try {
      const res = await api.get('/ai/search', { params: { query: searchQuery.trim() } });
      setNlSearchResults(Array.isArray(res.data.results) ? res.data.results : []);
      setSearchCollection(res.data.collection || '');
      setSearchExplanation(res.data.explanation || '');
    } catch (err) {
      setNlSearchResults([]);
      toast.error(apiError(err, 'Natural language search failed'));
    } finally {
      setBusy('');
    }
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice commands need Chrome or Edge with microphone access.');
      return;
    }

    if (voiceActive && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setVoiceActive(true);
      toast('Listening…', { icon: '🎙️' });
    };
    rec.onerror = () => {
      setVoiceActive(false);
      toast.error('Could not recognize speech. Check microphone permission.');
    };
    rec.onend = () => setVoiceActive(false);
    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setSearchQuery(text);
      try {
        const response = await api.post('/ai/voice-command', { transcript: text });
        if (response.data?.confirmationMessage) {
          toast.success(response.data.confirmationMessage);
        }
        if (response.data?.intent === 'search_employee' && response.data?.parameters?.name) {
          setSearchQuery(`Show employee details for ${response.data.parameters.name}`);
        }
      } catch (err) {
        toast.error(apiError(err, 'Voice command could not be processed'));
      }
    };

    rec.start();
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    const fileError = validateFile(resumeFile, { acceptPdfOnly: true });
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setBusy('resume');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription.trim());

    try {
      const res = await api.post('/ai/resume-parser', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });
      setParsedResume(res.data);
      toast.success('Resume parsed');
    } catch (err) {
      toast.error(apiError(err, 'Failed to parse resume'));
    } finally {
      setBusy('');
    }
  };

  const handleCandidatesRanking = async () => {
    if (!jobReqs.trim()) {
      toast.error('Enter job requirements before ranking.');
      return;
    }
    setBusy('rank');
    try {
      const res = await api.post('/ai/recruitment/rank', { jobRequirements: jobReqs.trim() });
      const rankings = res.data?.rankings || [];
      setCandidateRankings(rankings);
      if (!rankings.length) {
        toast('No applications found to rank. Add candidates in Recruitment first.');
      } else {
        toast.success('Applicants ranked');
      }
    } catch (err) {
      toast.error(apiError(err, 'Failed to rank candidates'));
    } finally {
      setBusy('');
    }
  };

  const handleDownloadDocPdf = async () => {
    if (!docContent.trim()) {
      toast.error('Template content is empty.');
      return;
    }
    setBusy('pdf');
    try {
      const res = await api.post(
        '/ai/doc-generator',
        { templateName: selectedTemplate, content: docContent, placeholders },
        { responseType: 'blob', timeout: 60000 }
      );

      const blob = res.data;
      if (blob?.type && blob.type.includes('json')) {
        const text = await blob.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'PDF generation failed');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTemplate.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(apiError(err, 'Failed to generate document PDF'));
    } finally {
      setBusy('');
    }
  };

  const handleMeetingSummary = async () => {
    if (!meetingTranscript.trim()) {
      toast.error('Paste a transcript first.');
      return;
    }
    setBusy('meeting');
    try {
      const res = await api.post('/ai/meeting-summary', { transcript: meetingTranscript.trim() });
      setMeetingSummaryResult(res.data);
      toast.success('Transcript summarized');
    } catch (err) {
      toast.error(apiError(err, 'Failed to summarize meeting'));
    } finally {
      setBusy('');
    }
  };

  const handleKbUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const fileError = validateFile(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setBusy('kb-upload');
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name.replace(/\.[^.]+$/, ''));
    formData.append('category', 'General Info');

    try {
      await api.post('/ai/kb/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      });
      toast.success('Document indexed');
      fetchKbDocs();
    } catch (err) {
      toast.error(apiError(err, 'Knowledge upload failed'));
    } finally {
      setBusy('');
    }
  };

  const handleKbQuery = async (e) => {
    e.preventDefault();
    if (!kbQuestion.trim() || busy === 'kb-query') return;

    const userMsg = kbQuestion.trim();
    setKbQuestion('');
    setKbChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setBusy('kb-query');

    try {
      const res = await api.post('/ai/kb/query', { question: userMsg });
      setKbChatHistory((prev) => [...prev, { sender: 'ai', text: res.data.answer || 'No answer returned.' }]);
      setKbSources(res.data.sources || []);
    } catch (err) {
      setKbChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: apiError(err, 'Could not fetch an answer. Try again.') },
      ]);
    } finally {
      setBusy('');
      kbInputRef.current?.focus();
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error('Give the automation a name.');
      return;
    }
    if (!workflowNodes.length) {
      toast.error('Add at least one step.');
      return;
    }
    const edges = workflowNodes.slice(0, -1).map((n, i) => ({
      id: `e-${n.id}-${workflowNodes[i + 1].id}`,
      source: n.id,
      target: workflowNodes[i + 1].id,
    }));
    setBusy('workflow');
    try {
      await api.post('/ai/workflow', {
        name: workflowName.trim(),
        nodes: workflowNodes,
        edges,
      });
      toast.success('Workflow saved');
    } catch (err) {
      toast.error(apiError(err, 'Failed to save workflow'));
    } finally {
      setBusy('');
    }
  };

  const addWorkflowStep = () => {
    const label = newStepLabel.trim();
    if (!label) {
      toast.error('Choose or type a step label.');
      return;
    }
    setWorkflowNodes((nodes) => [
      ...nodes,
      { id: `${Date.now()}`, type: 'action', label },
    ]);
    setNewStepLabel('');
  };

  const handleGetForecast = async () => {
    setBusy('forecast');
    try {
      const res = await api.get(`/ai/forecasts/${forecastType}`);
      setForecastResult(res.data);
    } catch (err) {
      toast.error(apiError(err, 'Forecasting failed'));
    } finally {
      setBusy('');
    }
  };

  const fetchSalesCoach = async () => {
    setBusy('coach');
    try {
      const res = await api.get('/ai/sales-coach');
      setSalesCoachData(res.data);
    } catch (err) {
      toast.error(apiError(err, 'Sales coach failed'));
    } finally {
      setBusy('');
    }
  };

  const applyTemplate = (val) => {
    setSelectedTemplate(val);
    const tpl = DOC_TEMPLATES[val];
    if (tpl) {
      setDocContent(tpl.content);
      setPlaceholders(tpl.placeholders());
    }
  };

  const insightItems = Array.isArray(dashboardData?.insights?.insights)
    ? dashboardData.insights.insights
    : [];

  return (
    <PageShell
      title="AI Hub"
      description="Tenant-scoped co-pilot for search, documents, recruiting, and knowledge. Results depend on indexed data and your AI provider."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/crm/knowledge-base" className="btn-outline h-9 text-xs">
            Manage documents
          </Link>
          <Link to="/crm/ai-costs" className="btn-outline h-9 text-xs">
            Usage & cost
          </Link>
        </div>
      }
    >
      <div className="space-y-5 text-ink">
        {aiHealth?.authError && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FiAlertTriangle /> Session expired. Sign in again to use AI Hub.
            </span>
            <Link to="/login" className="font-semibold underline">Go to login</Link>
          </div>
        )}
        {aiHealth && !aiHealth.authError && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-[12px] ${
              healthOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              {healthOk ? <FiCheckCircle /> : <FiAlertTriangle />}
              Provider: {aiHealth.activeProvider || 'not configured'}
              {aiHealth.activeModel ? ` · ${aiHealth.activeModel}` : ''}
            </span>
            {!healthOk && (
              <span>Configure an AI key in the backend environment before using generation features.</span>
            )}
          </div>
        )}

        <nav className="flex flex-wrap gap-2 border-b border-line pb-3" aria-label="AI Hub sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-brand text-white'
                  : 'border border-line bg-soft text-muted hover:text-ink'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-h-[400px] rounded border border-line bg-surface p-5 shadow-sm md:p-7">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {busy === 'dashboard' && !dashboardData && <Spinner label="Loading insights…" />}
              {dashboardError && !dashboardData && (
                <EmptyState>
                  {dashboardError}
                  <div className="mt-3">
                    <button type="button" onClick={() => fetchDashboardData()} className="btn-primary h-8 px-3 text-xs">
                      Retry
                    </button>
                  </div>
                </EmptyState>
              )}

              {dashboardData && (
                <>
                  <div className="rounded border border-brand/20 bg-brand/5 p-5">
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand">AI summary</h4>
                    <p className="text-[15px] font-semibold text-ink">
                      {dashboardData?.insights?.businessSummary || 'No commentary yet. Metrics below still load independently.'}
                    </p>
                    <div className="mt-4 grid gap-2">
                      {insightItems.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-muted">
                          <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand" />
                          <span>
                            {typeof ins === 'object'
                              ? `[${ins.priority || 'Medium'}] ${ins.problem || ''} ${ins.cause ? `— ${ins.cause}` : ''} ${ins.recommendation ? `Recommendation: ${ins.recommendation}` : ''}`
                              : ins}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded border border-line bg-soft p-4">
                      <span className="text-[12px] font-bold uppercase text-muted">Today&apos;s attendance</span>
                      <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.attendanceToday?.presentCount || 0}</p>
                      <p className="mt-1 text-xs text-muted">
                        {dashboardData?.stats?.attendanceToday?.absentCount || 0} not checked in
                        {dashboardData?.stats?.attendanceToday?.totalCount
                          ? ` of ${dashboardData.stats.attendanceToday.totalCount}`
                          : ''}
                      </p>
                    </div>
                    <div className="rounded border border-line bg-soft p-4">
                      <span className="text-[12px] font-bold uppercase text-muted">Top deals</span>
                      <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.salesStats?.length || 0}</p>
                      <p className="mt-1 text-xs text-muted">Highest-value deals in pipeline sample</p>
                    </div>
                    <div className="rounded border border-line bg-soft p-4">
                      <span className="text-[12px] font-bold uppercase text-muted">Leads</span>
                      <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.leadsStats?.totalLeads || 0}</p>
                      <p className="mt-1 text-xs text-muted">Open lead records</p>
                    </div>
                    <div className="rounded border border-line bg-soft p-4">
                      <span className="text-[12px] font-bold uppercase text-muted">Top task performers</span>
                      <div className="mt-2 space-y-1 text-xs font-semibold text-brand/90">
                        {(dashboardData?.stats?.topPerformers || []).length === 0 && (
                          <p className="font-medium text-muted">No completed tasks yet</p>
                        )}
                        {(dashboardData?.stats?.topPerformers || []).map((p, i) => (
                          <div key={i} className="truncate">• {p}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-line pt-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                      <FiTrendingUp className="text-brand" /> Forecasts
                    </h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {FORECAST_TYPES.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setForecastType(f)}
                          className={`rounded px-3 py-1.5 text-xs font-semibold ${
                            forecastType === f ? 'bg-brand text-white' : 'border border-line bg-soft text-muted'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleGetForecast}
                        disabled={busy === 'forecast'}
                        className="btn-primary ml-auto h-8 px-4 text-xs"
                      >
                        {busy === 'forecast' ? 'Running…' : 'Run projection'}
                      </button>
                    </div>
                    {forecastResult && (
                      <div className="grid gap-3 rounded border border-line bg-soft p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted">{forecastType} projection</span>
                          <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-black text-brand">
                            Confidence: {forecastResult.confidenceScore || 0}%
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-ink">{forecastResult.prediction}</p>
                        <p className="text-xs font-medium text-muted">{forecastResult.explanation}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-line pt-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                        <FiCpu className="text-brand" /> Sales coach
                      </h3>
                      <button
                        type="button"
                        onClick={fetchSalesCoach}
                        disabled={busy === 'coach'}
                        className="btn-outline h-8 px-4 text-xs font-bold text-brand"
                      >
                        {busy === 'coach' ? 'Analyzing…' : 'Analyze pipeline'}
                      </button>
                    </div>
                    {salesCoachData && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 rounded border border-line bg-soft p-4">
                          <span className="text-xs font-bold uppercase text-brand">Win insight</span>
                          <p className="text-xs text-ink">{salesCoachData.winProbabilityInsight || 'No insight returned.'}</p>
                          <p className="text-xs font-semibold text-ink">Next: {salesCoachData.nextBestAction || '—'}</p>
                        </div>
                        <div className="space-y-2 rounded border border-line bg-soft p-4">
                          <span className="text-xs font-bold uppercase text-brand">Suggestions</span>
                          {(salesCoachData.coachingSuggestions || []).map((s, i) => (
                            <div key={i} className="text-xs text-ink">• {typeof s === 'string' ? s : JSON.stringify(s)}</div>
                          ))}
                          {(salesCoachData.riskDeals || []).map((s, i) => (
                            <div key={`r-${i}`} className="text-xs text-rose-600">Risk: {typeof s === 'string' ? s : JSON.stringify(s)}</div>
                          ))}
                          {(salesCoachData.followUps || []).map((f, i) => (
                            <div key={`f-${i}`} className="text-xs text-ink">
                              <span className="font-semibold">{f.dealTitle}</span>: {f.action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-ink">Natural language search</h3>
                <p className="text-xs font-medium text-muted">
                  Queries run only on allowed collections (employees, clients, deals, invoices, leaves, tasks).
                </p>
              </div>
              <form onSubmit={handleNLSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Show invoices above 50000"
                  className="app-input h-10 w-full text-sm"
                />
                <button
                  type="button"
                  onClick={handleVoiceCommand}
                  aria-label={voiceActive ? 'Stop listening' : 'Voice search'}
                  className={`flex items-center justify-center rounded border border-line px-3.5 ${
                    voiceActive ? 'animate-pulse bg-rose-500 text-white' : 'bg-soft text-muted hover:text-ink'
                  }`}
                >
                  {voiceActive ? <FiMicOff /> : <FiMic />}
                </button>
                <button type="submit" disabled={busy === 'search'} className="btn-primary h-10 px-5 text-sm">
                  {busy === 'search' ? 'Searching…' : 'Search'}
                </button>
              </form>

              {searchExplanation && (
                <div className="space-y-2 rounded border border-line bg-soft p-4">
                  <p className="text-xs font-bold uppercase text-muted">How this was interpreted</p>
                  <p className="text-sm font-semibold text-brand/90">{searchExplanation}</p>
                  <p className="font-mono text-[11px] text-muted">Collection: {searchCollection}</p>
                </div>
              )}

              {nlSearchResults && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-muted">Results ({nlSearchResults.length})</h4>
                  {nlSearchResults.length === 0 ? (
                    <EmptyState>No matching records. Try a simpler query.</EmptyState>
                  ) : (
                    <div className="overflow-x-auto rounded border border-line bg-soft/30">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-line bg-soft font-bold text-muted">
                            <th className="px-4 py-3">Record</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Attributes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nlSearchResults.map((r, i) => (
                            <tr key={r._id || i} className="border-b border-line last:border-0 hover:bg-soft/45">
                              <td className="px-4 py-3 font-semibold text-ink">
                                {r.name || r.title || r.number || 'Record'}
                              </td>
                              <td className="px-4 py-3 text-muted">
                                {r.department || r.company || r.stage || r.status || '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-brand">
                                {r.amount || r.total ? formatINR(r.amount || r.total) : r.email || r.employeeId || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-ink">Resume parser</h3>
                <form onSubmit={handleResumeUpload} className="space-y-4">
                  <div className="relative cursor-pointer rounded border-2 border-dashed border-line p-6 text-center hover:border-brand/50">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <FiUploadCloud className="mx-auto mb-3 h-10 w-10 text-muted" />
                    <p className="text-sm font-semibold">{resumeFile ? resumeFile.name : 'Upload PDF resume'}</p>
                    <p className="mt-1 text-xs text-muted">Max 10MB</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted">Job description</label>
                    <textarea
                      rows={4}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the role requirements to score fit."
                      className="app-input w-full py-2 text-xs"
                    />
                  </div>
                  <button type="submit" disabled={!resumeFile || busy === 'resume'} className="btn-primary w-full py-2.5 text-sm">
                    {busy === 'resume' ? 'Scoring resume…' : 'Parse & score fit'}
                  </button>
                </form>

                {parsedResume && (
                  <div className="space-y-4 rounded border border-line bg-soft p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-ink">{parsedResume.name || 'Candidate'}</h4>
                        <p className="text-xs text-muted">{parsedResume.email} · {parsedResume.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-brand">{parsedResume.matchPercentage ?? 0}%</span>
                        {parsedResume.confidence !== undefined && (
                          <span className="text-[10px] font-bold text-muted">Confidence {parsedResume.confidence}%</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-ink">{parsedResume.experience}</p>
                    <div className="flex flex-wrap gap-1">
                      {(parsedResume.skills || []).map((s, i) => (
                        <span key={i} className="rounded border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] text-brand">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-ink">{parsedResume.jobDescriptionScoreExplanation}</p>
                    {parsedResume.breakdown?.requiredSkills?.length > 0 && (
                      <div className="space-y-1.5 border-t border-line pt-3">
                        <p className="text-[10px] font-bold uppercase text-muted">JD skill match</p>
                        <div className="flex flex-wrap gap-1">
                          {parsedResume.breakdown.requiredSkills.map((s) => (
                            <span
                              key={s.skill}
                              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                s.matched
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {s.matched ? '✓' : '✗'} {s.skill}
                            </span>
                          ))}
                          {(parsedResume.breakdown.plusSkills || []).map((s) => (
                            <span
                              key={`plus-${s.skill}`}
                              className={`rounded px-2 py-0.5 text-[10px] ${
                                s.matched
                                  ? 'bg-brand/10 text-brand border border-brand/20'
                                  : 'bg-soft text-muted border border-line'
                              }`}
                            >
                              + {s.skill}
                            </span>
                          ))}
                        </div>
                        {parsedResume.breakdown.yearsRequired && (
                          <p className="text-[11px] text-muted">
                            Experience: resume {parsedResume.breakdown.yearsFound ?? 'not stated'} yrs
                            {' · '}JD {parsedResume.breakdown.yearsRequired.min}–{parsedResume.breakdown.yearsRequired.max} yrs
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 border-line md:border-l md:pl-6">
                <h3 className="text-lg font-bold text-ink">Application ranker</h3>
                <p className="text-xs text-muted">Ranks existing recruitment applications against the requirements you enter.</p>
                <textarea
                  rows={3}
                  value={jobReqs}
                  onChange={(e) => setJobReqs(e.target.value)}
                  placeholder="e.g. Senior engineer, MongoDB, Node.js, 4+ years"
                  className="app-input w-full py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleCandidatesRanking}
                  disabled={busy === 'rank'}
                  className="btn-outline w-full py-2.5 text-sm font-bold text-brand"
                >
                  {busy === 'rank' ? 'Ranking…' : 'Rank applications'}
                </button>
                {candidateRankings && (
                  <div className="space-y-2.5">
                    {candidateRankings.length === 0 && <EmptyState>No applications to rank.</EmptyState>}
                    {candidateRankings.map((c, i) => (
                      <div key={i} className="space-y-2 rounded border border-line bg-soft p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink">#{c.rank} {c.candidateName}</span>
                          {c.score != null && <span className="text-[10px] font-black text-brand">{c.score}</span>}
                        </div>
                        <p className="text-[11px] text-muted">{c.fitReason}</p>
                        {(c.questions || []).length > 0 && (
                          <div className="space-y-1 border-t border-line/50 pt-2 text-[10px] font-medium text-brand/90">
                            {c.questions.map((q, idx) => <div key={idx}>• {q}</div>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-ink">Document studio</h3>
                <select
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="app-input h-9 cursor-pointer text-xs"
                >
                  {Object.keys(DOC_TEMPLATES).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(placeholders).map(([key, val]) => (
                    <div key={key} className="space-y-0.5">
                      <label className="text-[10px] capitalize text-muted">{key}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setPlaceholders({ ...placeholders, [key]: e.target.value })}
                        className="app-input h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDocPdf}
                  disabled={busy === 'pdf'}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {busy === 'pdf' ? 'Generating…' : 'Generate & export PDF'}
                </button>
              </div>
              <div className="space-y-4 border-line md:border-l md:pl-6">
                <h3 className="text-lg font-bold text-ink">Template editor</h3>
                <textarea
                  rows={12}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="app-input w-full py-2 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'kb' && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-4 border-line md:border-r md:pr-6">
                <h3 className="text-lg font-bold text-ink">Training desk</h3>
                <div className="relative cursor-pointer rounded border-2 border-dashed border-line p-6 text-center hover:border-brand/40">
                  <input
                    type="file"
                    accept=".pdf,.txt,.csv,.docx,application/pdf,text/plain"
                    onChange={handleKbUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <FiUploadCloud className="mx-auto mb-2 h-8 w-8 text-muted" />
                  <p className="text-xs font-semibold">{busy === 'kb-upload' ? 'Indexing…' : 'Upload PDF, DOCX, TXT, or CSV'}</p>
                  <p className="mt-1 text-[10px] text-muted">Max 10MB · tenant-scoped</p>
                </div>
                <div className="space-y-2 rounded border border-line bg-soft p-3">
                  <span className="text-[11px] font-bold uppercase text-muted">Indexed sources</span>
                  {kbDocs.length === 0 ? (
                    <p className="text-xs text-muted">No documents yet. Upload a file or use the full knowledge base page.</p>
                  ) : (
                    kbDocs.map((d) => (
                      <div key={d._id} className="truncate text-xs font-medium text-ink">• {d.title || d.fileName}</div>
                    ))
                  )}
                  <Link to="/crm/knowledge-base" className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-brand">
                    Open knowledge base <FiExternalLink />
                  </Link>
                </div>
              </div>

              <div className="flex h-[450px] flex-col space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold text-ink">Policy advisor</h3>
                <div className="flex flex-1 flex-col space-y-3 overflow-y-auto rounded border border-line bg-soft/45 p-4">
                  {kbChatHistory.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] rounded p-3 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'self-end rounded-tr-none bg-brand text-white'
                          : 'self-start rounded-tl-none border border-line bg-surface text-ink'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {busy === 'kb-query' && <p className="text-xs text-muted">Thinking…</p>}
                  <div ref={chatEndRef} />
                </div>
                {kbSources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    <strong>Sources:</strong>
                    {kbSources.map((s, idx) => (
                      <span key={idx} className="rounded border border-brand/20 bg-brand/10 px-1.5 py-0.5 text-brand">
                        {s.title} {s.pageNumber ? `(p. ${s.pageNumber})` : ''}
                        {typeof s.score === 'number' ? ` · ${Math.round(s.score * 100)}%` : ''}
                      </span>
                    ))}
                  </div>
                )}
                <form onSubmit={handleKbQuery} className="flex gap-2">
                  <input
                    ref={kbInputRef}
                    type="text"
                    value={kbQuestion}
                    onChange={(e) => setKbQuestion(e.target.value)}
                    placeholder="Ask a policy question"
                    className="app-input h-9 text-xs"
                  />
                  <button type="submit" disabled={busy === 'kb-query'} className="btn-primary h-9 px-4" aria-label="Send">
                    <FiSend className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'meeting' && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-ink">Meeting summary</h3>
                <textarea
                  rows={10}
                  value={meetingTranscript}
                  onChange={(e) => setMeetingTranscript(e.target.value)}
                  placeholder="Paste meeting notes or a transcript…"
                  className="app-input w-full py-2.5 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleMeetingSummary}
                  disabled={busy === 'meeting'}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {busy === 'meeting' ? 'Summarizing…' : 'Summarize meeting'}
                </button>
              </div>
              <div className="space-y-4 border-line md:border-l md:pl-6">
                <h3 className="text-lg font-bold text-ink">Insights</h3>
                {meetingSummaryResult ? (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded border border-line bg-soft p-4">
                      <span className="text-xs font-bold uppercase text-brand">Summary</span>
                      <p className="text-xs font-semibold leading-relaxed text-ink">{meetingSummaryResult.summary}</p>
                    </div>
                    <div className="space-y-2 rounded border border-line bg-soft p-4">
                      <span className="text-xs font-bold uppercase text-brand">Decisions</span>
                      <ul className="list-disc space-y-1 pl-4 text-xs font-medium text-ink">
                        {(meetingSummaryResult.decisions || []).map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-2 rounded border border-line bg-soft p-4">
                      <span className="text-xs font-bold uppercase text-brand">Tasks</span>
                      {(meetingSummaryResult.tasks || []).map((t, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-line py-1 text-xs last:border-0">
                          <div>
                            <p className="font-semibold text-ink">{t.task}</p>
                            <p className="text-[10px] text-muted">Assigned to: {t.assignee}</p>
                          </div>
                          <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] text-brand">Due: {t.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState>Paste a transcript to extract decisions and tasks.</EmptyState>
                )}
              </div>
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink">Quick automation</h3>
                  <p className="text-xs font-medium text-muted">Saves a linear workflow for this tenant. Use the full builder for branching flows.</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/crm/automation" className="btn-outline h-9 text-xs">Open builder</Link>
                  <button type="button" onClick={handleSaveWorkflow} disabled={busy === 'workflow'} className="btn-primary h-9 px-4 text-xs">
                    {busy === 'workflow' ? 'Saving…' : 'Save automation'}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="app-input max-w-md text-xs"
                placeholder="Automation name"
              />
              <div className="flex flex-col items-center justify-center gap-6 rounded border border-line bg-soft p-6 md:flex-row md:flex-wrap">
                {workflowNodes.map((n, i) => (
                  <React.Fragment key={n.id}>
                    <div className="group relative min-w-[150px] rounded border border-line bg-surface p-4 text-center shadow-sm">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        n.type === 'trigger' ? 'bg-brand/10 text-brand' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {n.type}
                      </span>
                      <p className="mt-2 text-xs font-bold text-ink">{n.label}</p>
                      {n.type !== 'trigger' && (
                        <button
                          type="button"
                          onClick={() => setWorkflowNodes(workflowNodes.filter((node) => node.id !== n.id))}
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-rose-600 p-1 text-white opacity-0 group-hover:opacity-100"
                          aria-label="Remove step"
                        >
                          <FiTrash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    {i < workflowNodes.length - 1 && <div className="text-lg font-bold text-muted">→</div>}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={newStepLabel}
                  onChange={(e) => setNewStepLabel(e.target.value)}
                  className="app-input h-9 max-w-xs text-xs"
                >
                  <option value="">Add a step…</option>
                  {AUTOMATION_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="text"
                  value={newStepLabel}
                  onChange={(e) => setNewStepLabel(e.target.value)}
                  placeholder="Or type a custom action"
                  className="app-input h-9 max-w-xs text-xs"
                />
                <button type="button" onClick={addWorkflowStep} className="btn-outline h-9 gap-1 px-3 text-xs">
                  <FiPlus /> Add step
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default AIHub;

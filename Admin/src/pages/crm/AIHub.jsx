import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiCpu, 
  FiSearch, 
  FiUploadCloud, 
  FiFileText, 
  FiActivity, 
  FiMic, 
  FiMicOff,
  FiSend, 
  FiBookOpen, 
  FiSettings, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiMail, 
  FiMessageSquare,
  FiPlus,
  FiTrash2,
  FiFile
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const AIHub = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Module 1: Dashboard Stats & Insights
  const [dashboardData, setDashboardData] = useState(null);
  
  // Module 2: NL Search
  const [searchQuery, setSearchQuery] = useState('');
  const [nlSearchResults, setNlSearchResults] = useState(null);
  const [searchCollection, setSearchCollection] = useState('');
  const [searchExplanation, setSearchExplanation] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);

  // Module 4 & 17: Resume Parser & Candidates Ranker
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('Full Stack Node.js & React developer with 3+ years experience.');
  const [parsedResume, setParsedResume] = useState(null);
  const [candidateRankings, setCandidateRankings] = useState(null);
  const [jobReqs, setJobReqs] = useState('Senior engineer proficient in MongoDB, Node.js and Tailwind CSS');

  // Module 8: Document Generator
  const [selectedTemplate, setSelectedTemplate] = useState('Offer Letter');
  const [docContent, setDocContent] = useState(`{{date}}

To,
{{employeeName}}

Dear {{employeeName}},

We are pleased to offer you the position of {{designation}} at Vastora. Your annual compensation package will be {{salary}}.

Sincerely,
Operations Management`);
  const [placeholders, setPlaceholders] = useState({
    date: new Date().toLocaleDateString('en-IN'),
    employeeName: 'Rahul Kumar',
    designation: 'Backend Engineer',
    salary: '₹12,00,000'
  });

  // Module 9: Meeting Summary
  const [meetingTranscript, setMeetingTranscript] = useState(`Project kickoff meeting. Amit says we must finish the database setup by next Friday. Priya agrees to handle the frontend routes. Sanya will review all API designs by Tuesday.`);
  const [meetingSummaryResult, setMeetingSummaryResult] = useState(null);

  // Module 11: Knowledge Base (RAG)
  const [kbFile, setKbFile] = useState(null);
  const [kbQuestion, setKbQuestion] = useState('');
  const [kbChatHistory, setKbChatHistory] = useState([
    { sender: 'ai', text: 'Hello! Ask me any question about the corporate policies and employee handbooks.' }
  ]);
  const [kbSources, setKbSources] = useState([]);
  const chatEndRef = useRef(null);

  // Module 13: Automation Builder
  const [workflowName, setWorkflowName] = useState('Automated Welcome sequence');
  const [workflowNodes, setWorkflowNodes] = useState([
    { id: '1', type: 'trigger', label: 'Lead Created' },
    { id: '2', type: 'action', label: 'Assign Account Owner' },
    { id: '3', type: 'action', label: 'Send AI Cold Email' }
  ]);

  // Module 14: Forecasts
  const [forecastType, setForecastType] = useState('Sales');
  const [forecastResult, setForecastResult] = useState(null);

  // Module 18: Sales Coach
  const [salesCoachData, setSalesCoachData] = useState(null);

  // Fetch Dashboard Statistics and AI Insights
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kbChatHistory]);

  // Exec NL Search
  const handleNLSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/ai/search?query=${encodeURIComponent(searchQuery)}`);
      setNlSearchResults(res.data.results);
      setSearchCollection(res.data.collection);
      setSearchExplanation(res.data.explanation);
    } catch (err) {
      toast.error('Natural language parsing failed');
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Voice command processor
  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice commands not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setVoiceActive(true);
      toast('Listening for command...', { icon: '🎙️' });
    };

    rec.onerror = () => {
      setVoiceActive(false);
      toast.error('Failed to recognize voice');
    };

    rec.onend = () => {
      setVoiceActive(false);
    };

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setSearchQuery(text);
      toast(`Command received: "${text}"`, { icon: '✅' });
      
      // Let's call the backend voice command analyzer
      try {
        const response = await api.post('/ai/voice-command', { transcript: text });
        if (response.data.intent !== 'unknown') {
          // If a known command, trigger actions or prefill search
          toast.success(`Action confirmed: ${response.data.confirmationMessage}`);
          if (response.data.intent === 'search_employee') {
            setSearchQuery(`Show employee details for ${response.data.parameters.name}`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    rec.start();
  };

  // Upload and parse resume
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await api.post('/ai/resume-parser', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedResume(res.data);
      toast.success('Resume parsed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  // Rank job applications
  const handleCandidatesRanking = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/recruitment/rank', { jobRequirements: jobReqs });
      setCandidateRankings(res.data.rankings);
      toast.success('Applicants ranked!');
    } catch (err) {
      toast.error('Failed to rank candidates');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF Document
  const handleDownloadDocPdf = async () => {
    try {
      const res = await api.post('/ai/doc-generator', {
        templateName: selectedTemplate,
        content: docContent,
        placeholders
      }, { responseType: 'blob' });

      // Create download link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTemplate.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF generated and downloaded!');
    } catch (err) {
      toast.error('Failed to generate document PDF');
    }
  };

  // Summarize meeting transcript
  const handleMeetingSummary = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/meeting-summary', { transcript: meetingTranscript });
      setMeetingSummaryResult(res.data);
      toast.success('Transcript summarized!');
    } catch (err) {
      toast.error('Failed to summarize meeting');
    } finally {
      setLoading(false);
    }
  };

  // Knowledge base document upload
  const handleKbUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name);

    try {
      await api.post('/ai/kb/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded and indexed into knowledge base!');
    } catch (err) {
      toast.error('Knowledge upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Chat with Knowledge Base
  const handleKbQuery = async (e) => {
    e.preventDefault();
    if (!kbQuestion.trim()) return;

    const userMsg = kbQuestion;
    setKbQuestion('');
    setKbChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    
    try {
      const res = await api.post('/ai/kb/query', { question: userMsg });
      setKbChatHistory(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
      setKbSources(res.data.sources || []);
    } catch (err) {
      toast.error('Could not fetch query answer');
    }
  };

  // Save workflow visual automation builder
  const handleSaveWorkflow = async () => {
    try {
      await api.post('/ai/workflow', {
        name: workflowName,
        nodes: workflowNodes,
        edges: []
      });
      toast.success('Workflow automation saved!');
    } catch (err) {
      toast.error('Failed to save workflow');
    }
  };

  // Calculate Forecasts
  const handleGetForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ai/forecasts/${forecastType}`);
      setForecastResult(res.data);
      toast.success('Forecast compiled!');
    } catch (err) {
      toast.error('Forecasting failed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Sales Coach insights
  const fetchSalesCoach = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/sales-coach');
      setSalesCoachData(res.data);
    } catch (err) {
      toast.error('Sales Coach compilation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-6 lg:p-8 text-ink">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[13px] text-muted">Vastora Intelligence Desk</p>
          <h1 className="mt-1 text-[24px] font-black tracking-tight text-ink flex items-center gap-2">
            <FiCpu className="h-6 w-6 text-brand" /> AI Co-Pilot Co-Center
          </h1>
        </div>
      </header>

      {/* Tabs Menu Navigation */}
      <nav className="flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          { id: 'dashboard', label: 'Dashboard & Insights', icon: FiActivity },
          { id: 'search', label: 'NL Search (Database)', icon: FiSearch },
          { id: 'resume', label: 'Candidate Screener', icon: FiUploadCloud },
          { id: 'docs', label: 'Document Studio', icon: FiFileText },
          { id: 'kb', label: 'AI Knowledge base', icon: FiBookOpen },
          { id: 'meeting', label: 'Meeting summarizer', icon: FiCheckCircle },
          { id: 'automation', label: 'Automation Hub', icon: FiSettings },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === t.id 
                ? 'bg-brand text-white shadow-md shadow-brand/10' 
                : 'bg-soft text-muted hover:bg-soft/80 border border-line'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </nav>

      {/* TABS CONTAINER */}
      <div className="bg-surface rounded border border-line shadow-sm min-h-[400px] p-6 md:p-8">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Business dynamic AI Insights banner */}
            <div className="rounded border border-brand/20 bg-brand/5 p-5">
              <h4 className="text-sm font-bold text-brand uppercase tracking-wider mb-3">AI Intelligence Summary</h4>
              <p className="text-[15px] font-semibold text-ink">
                {dashboardData?.insights?.businessSummary || "Analyzing business parameters..."}
              </p>
              <div className="mt-4 grid gap-2">
                {dashboardData?.insights?.insights?.map((ins, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-[13px] text-muted font-medium">
                    <span className="w-2.5 h-2.5 mt-1 rounded-full bg-brand flex-shrink-0"></span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* General metrics grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-line bg-soft p-4">
                <span className="text-[12px] font-bold text-muted uppercase">Today's Attendance</span>
                <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.attendanceToday?.presentCount || 0}</p>
                <p className="text-xs text-muted mt-1">{dashboardData?.stats?.attendanceToday?.absentCount || 0} absent marks today</p>
              </div>
              <div className="rounded border border-line bg-soft p-4">
                <span className="text-[12px] font-bold text-muted uppercase">Active Pipeline Deals</span>
                <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.salesStats?.length || 0}</p>
                <p className="text-xs text-muted mt-1">Closed-won deals listed</p>
              </div>
              <div className="rounded border border-line bg-soft p-4">
                <span className="text-[12px] font-bold text-muted uppercase">Leads Queue</span>
                <p className="mt-2 text-3xl font-black text-ink">{dashboardData?.stats?.leadsStats?.totalLeads || 0}</p>
                <p className="text-xs text-muted mt-1">Requires active outreach</p>
              </div>
              <div className="rounded border border-line bg-soft p-4">
                <span className="text-[12px] font-bold text-muted uppercase">Top Task Performers</span>
                <div className="mt-1 text-xs text-brand/90 space-y-1">
                  {dashboardData?.stats?.topPerformers?.map((p, i) => (
                    <div key={i} className="truncate font-semibold">• {p}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Module 14: Predictive Forecasts Section */}
            <div className="pt-6 border-t border-line">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-brand" /> Predictive Analytics Engine
              </h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {['Sales', 'Payroll', 'Attrition'].map(f => (
                  <button
                    key={f}
                    onClick={() => setForecastType(f)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold ${
                      forecastType === f ? 'bg-brand text-white' : 'bg-soft text-muted border border-line'
                    }`}
                  >
                    {f} Forecast
                  </button>
                ))}
                <button
                  onClick={handleGetForecast}
                  className="rounded bg-brand px-4 py-1.5 text-xs font-bold hover:bg-brand/90 transition-colors ml-auto"
                >
                  Run Projection
                </button>
              </div>

              {forecastResult && (
                <div className="rounded bg-soft border border-line p-4 grid gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">{forecastType} projection</span>
                    <span className="text-xs font-black bg-brand/10 text-brand px-2 py-0.5 rounded">
                      Confidence: {forecastResult.confidenceScore || 0}%
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink">{forecastResult.prediction}</p>
                  <p className="text-xs text-muted font-medium">{forecastResult.explanation}</p>
                </div>
              )}
            </div>

            {/* Module 18: Sales Coach section */}
            <div className="pt-6 border-t border-line">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-ink">
                  <FiCpu className="text-brand" /> AI Sales Coach Assistant
                </h3>
                <button 
                  onClick={fetchSalesCoach}
                  className="rounded bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Analyze Pipeline
                </button>
              </div>

              {salesCoachData && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Follow-up strategies</span>
                    {salesCoachData.followUps?.map((f, i) => (
                      <div key={i} className="text-xs text-ink">
                        <span className="font-semibold">{f.dealTitle}</span>: {f.action}
                      </div>
                    ))}
                  </div>
                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Upsell recommendations</span>
                    {salesCoachData.upsells?.map((u, i) => (
                      <div key={i} className="text-xs text-ink">
                        <span className="font-semibold">{u.clientName}</span>: {u.recommendation}
                      </div>
                    ))}
                  </div>
                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Re-engagement deals</span>
                    {salesCoachData.inactiveRecoveries?.map((r, i) => (
                      <div key={i} className="text-xs text-ink">
                        <span className="font-semibold">{r.clientName}</span>: {r.recoveryAction}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-ink">Natural Language Database Queries</h3>
            <p className="text-xs text-muted font-medium">Type commands in normal conversational English. The AI constructs and executes secure queries on authorized collections.</p>
            
            <form onSubmit={handleNLSearch} className="flex gap-2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Examples: 'Show invoices above 50000', 'Show support employees', 'Latest sales'"
                className="app-input h-10 w-full text-sm"
              />
              <button
                type="button"
                onClick={handleVoiceCommand}
                className={`rounded border border-line px-3.5 flex items-center justify-center transition-colors ${
                  voiceActive ? 'bg-rose-500 text-white animate-pulse' : 'bg-soft text-muted hover:text-ink'
                }`}
              >
                {voiceActive ? <FiMicOff className="h-4.5 w-4.5" /> : <FiMic className="h-4.5 w-4.5" />}
              </button>
              <button
                type="submit"
                className="rounded bg-brand px-5 font-bold hover:bg-brand/90 transition-colors text-sm text-white flex items-center gap-1.5"
              >
                <FiSearch /> Search
              </button>
            </form>

            {searchExplanation && (
              <div className="rounded bg-soft border border-line p-4 space-y-2">
                <p className="text-xs text-muted uppercase font-bold">Query logic explanation</p>
                <p className="text-sm font-semibold text-brand/90">{searchExplanation}</p>
                <p className="text-[11px] font-mono text-muted">Target database schema: {searchCollection}</p>
              </div>
            )}

            {nlSearchResults && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-muted uppercase">Retrieved results ({nlSearchResults.length})</h4>
                <div className="rounded border border-line overflow-hidden bg-soft/30">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line bg-soft text-muted font-bold">
                        <th className="px-4 py-3">Record Detail</th>
                        <th className="px-4 py-3">Details / Status</th>
                        <th className="px-4 py-3 text-right">Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nlSearchResults.map((r, i) => (
                        <tr key={i} className="border-b border-line last:border-0 hover:bg-soft/45">
                          <td className="px-4 py-3 font-semibold text-ink">
                            {r.name || r.title || r.number || 'Record details'}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {r.department || r.company || r.stage || r.status || 'Active'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-brand">
                            {r.amount || r.total ? formatINR(r.amount || r.total) : r.email || r.employeeId || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Candidate parsing upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink">Resume AI Parser</h3>
              <form onSubmit={handleResumeUpload} className="space-y-4">
                <div className="border-2 border-dashed border-line rounded p-6 text-center hover:border-brand/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setResumeFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FiUploadCloud className="h-10 w-10 text-muted mx-auto mb-3" />
                  <p className="text-sm font-semibold">{resumeFile ? resumeFile.name : 'Upload PDF Resume'}</p>
                  <p className="text-xs text-muted mt-1">Drag and drop file here</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted uppercase font-bold">Job Description match criteria</label>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    className="w-full app-input py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!resumeFile}
                  className="w-full rounded bg-brand py-2.5 font-bold hover:bg-brand/90 text-white transition-colors text-sm disabled:opacity-50"
                >
                  Parse & Score Fit
                </button>
              </form>

              {parsedResume && (
                <div className="rounded border border-line bg-soft p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-bold text-ink">{parsedResume.name}</h4>
                      <p className="text-xs text-muted">{parsedResume.email} · {parsedResume.phone}</p>
                    </div>
                    {/* Score & Confidence indicators */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-brand">{parsedResume.matchPercentage}%</span>
                        <span className="text-[10px] uppercase font-bold text-muted">Fit score</span>
                      </div>
                      {parsedResume.confidence !== undefined && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted font-bold">
                          <span>Confidence:</span>
                          <span className={`px-1 rounded text-white ${
                            parsedResume.confidence >= 85 ? 'bg-emerald-600' : parsedResume.confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}>{parsedResume.confidence}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted font-bold uppercase">Experience & Skills</p>
                    <p className="text-xs font-semibold text-ink">{parsedResume.experience}</p>
                    <div className="flex flex-wrap gap-1">
                      {parsedResume.skills?.map((s, i) => (
                        <span key={i} className="text-[10px] bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 bg-brand/5 border border-brand/10 p-3 rounded">
                    <p className="text-[11px] font-bold text-brand uppercase">Recruitment Rationale</p>
                    <p className="text-xs text-ink font-medium">{parsedResume.jobDescriptionScoreExplanation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate ranker module */}
            <div className="space-y-4 border-l border-line pl-6">
              <h3 className="text-lg font-bold text-ink">Applications Group Ranker</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted uppercase font-bold">Target Job Requirements</label>
                  <textarea
                    rows={3}
                    value={jobReqs}
                    onChange={e => setJobReqs(e.target.value)}
                    className="w-full app-input py-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCandidatesRanking}
                  className="w-full rounded bg-brand/10 text-brand border border-brand/30 py-2.5 font-bold hover:bg-brand/20 transition-all text-sm"
                >
                  Rank Candidate Applications
                </button>
              </div>

              {candidateRankings && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted uppercase">Ranked Pipeline</h4>
                  <div className="space-y-2.5">
                    {candidateRankings.map((c, i) => (
                      <div key={i} className="rounded border border-line bg-soft p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-ink">#{c.rank} {c.candidateName}</span>
                          <span className="text-[10px] bg-brand/10 px-2 py-0.5 rounded text-brand font-black">Rank {c.rank}</span>
                        </div>
                        <p className="text-[11px] text-muted">{c.fitReason}</p>
                        <div className="space-y-1 border-t border-line/50 pt-2 text-[10px] text-brand/90 font-medium">
                          <strong>Key Interview Questions:</strong>
                          {c.questions?.map((q, idx) => (
                            <div key={idx}>• {q}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink">AI Document Studio</h3>
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase font-bold">Template Type</label>
                <select
                  value={selectedTemplate}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedTemplate(val);
                    if (val === 'Warning Letter') {
                      setDocContent(`To,\n{{employeeName}}\n\nDear {{employeeName}},\n\nThis is a formal warning letter regarding your repeated late log-ins. Your attendance report indicates {{lateDays}} late marks this month.\n\nBest,\nHR Operations`);
                      setPlaceholders({ employeeName: 'Amit Sharma', lateDays: '7 days' });
                    } else if (val === 'Appointment Letter') {
                      setDocContent(`To,\n{{employeeName}}\n\nDear {{employeeName}},\n\nWe are pleased to appoint you as {{designation}} with a salary of {{salary}} effective {{date}}.\n\nSincerely,\nHR Manager`);
                      setPlaceholders({ employeeName: 'Rohit Sharma', designation: 'QA Lead', salary: '₹8,50,000', date: '01/08/2026' });
                    } else {
                      setDocContent(`{{date}}\n\nTo,\n{{employeeName}}\n\nDear {{employeeName}},\n\nWe are pleased to offer you the position of {{designation}} at Vastora. Your annual compensation package will be {{salary}}.\n\nSincerely,\nOperations Management`);
                      setPlaceholders({ date: new Date().toLocaleDateString('en-IN'), employeeName: 'Rahul Kumar', designation: 'Backend Engineer', salary: '₹12,00,000' });
                    }
                  }}
                  className="app-input h-9 text-xs cursor-pointer"
                >
                  <option>Offer Letter</option>
                  <option>Appointment Letter</option>
                  <option>Warning Letter</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-muted font-bold uppercase">Dynamic Fields</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(placeholders).map(([key, val]) => (
                    <div key={key} className="space-y-0.5">
                      <label className="text-[10px] text-muted capitalize">{key}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={e => setPlaceholders({ ...placeholders, [key]: e.target.value })}
                        className="app-input h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadDocPdf}
                className="w-full rounded bg-brand py-2.5 font-bold hover:bg-brand/90 text-white transition-colors text-sm"
              >
                Generate & Export PDF
              </button>
            </div>

            <div className="space-y-4 border-l border-line pl-6">
              <h3 className="text-lg font-bold text-ink">Template Content Editor</h3>
              <textarea
                rows={12}
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                className="w-full app-input py-2 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'kb' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Knowledge base document uploader */}
            <div className="space-y-4 border-r border-line pr-6">
              <h3 className="text-lg font-bold text-ink">Training Desk</h3>
              <div className="border-2 border-dashed border-line rounded p-6 text-center relative hover:border-brand/40 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleKbUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FiUploadCloud className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-xs font-semibold">Upload Policy manual PDF</p>
                <p className="text-[10px] text-muted mt-1">Automatically chunked and vectorized</p>
              </div>

              <div className="rounded bg-soft p-3 space-y-2 border border-line">
                <span className="text-[11px] font-bold text-muted uppercase">Active Sources</span>
                <div className="text-xs text-brand/90 font-medium space-y-1">
                  <div>• LeavePolicy_HR.pdf</div>
                  <div>• EmployeeHandbook_2026.pdf</div>
                </div>
              </div>
            </div>

            {/* Chatbot Interface */}
            <div className="md:col-span-2 space-y-4 flex flex-col h-[450px]">
              <h3 className="text-lg font-bold text-ink">AI Policies Advisor</h3>
              
              <div className="flex-1 overflow-y-auto border border-line rounded bg-soft/45 p-4 space-y-3 flex flex-col">
                {kbChatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-brand text-white self-end rounded-tr-none'
                        : 'bg-surface border border-line self-start rounded-tl-none text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {kbSources.length > 0 && (
                <div className="text-[10px] text-muted flex flex-wrap gap-2 items-center">
                  <strong>References cited:</strong>
                  {kbSources.map((s, idx) => (
                    <span key={idx} className="bg-brand/10 border border-brand/20 text-brand px-1.5 py-0.5 rounded">
                      {s.title} (Page {s.pageNumber || 1}) · Score: {Math.round(s.score * 100)}%
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={handleKbQuery} className="flex gap-2">
                <input
                  type="text"
                  value={kbQuestion}
                  onChange={e => setKbQuestion(e.target.value)}
                  placeholder="Ask policy questions e.g. 'How many leave limits do we have?'"
                  className="app-input h-9 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-brand px-4 text-white hover:bg-brand/90 transition-colors"
                >
                  <FiSend className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'meeting' && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink">Meeting Summary Studio</h3>
              <textarea
                rows={10}
                value={meetingTranscript}
                onChange={e => setMeetingTranscript(e.target.value)}
                placeholder="Paste meeting logs, transcript or text here..."
                className="w-full app-input py-2.5 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleMeetingSummary}
                className="w-full rounded bg-brand py-2.5 font-bold text-white hover:bg-brand/90 transition-colors text-sm"
              >
                Summarize Meeting
              </button>
            </div>

            <div className="space-y-4 border-l border-line pl-6">
              <h3 className="text-lg font-bold text-ink">AI Meeting Insights</h3>
              {meetingSummaryResult ? (
                <div className="space-y-4">
                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Summary Overview</span>
                    <p className="text-xs text-ink leading-relaxed font-semibold">{meetingSummaryResult.summary}</p>
                  </div>

                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Decisions Made</span>
                    <ul className="list-disc pl-4 text-xs text-ink font-medium space-y-1">
                      {meetingSummaryResult.decisions?.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded border border-line bg-soft p-4 space-y-2">
                    <span className="text-xs font-bold text-brand uppercase">Assigned tasks</span>
                    <div className="space-y-2">
                      {meetingSummaryResult.tasks?.map((t, i) => (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-line last:border-0 pb-1 pt-1">
                          <div>
                            <p className="font-semibold text-ink">{t.task}</p>
                            <p className="text-[10px] text-muted">Assigned to: {t.assignee}</p>
                          </div>
                          <span className="text-[10px] font-mono bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                            Due: {t.deadline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-60 flex justify-center items-center text-xs text-muted font-semibold">
                  Upload transcript logs to parse meeting actions
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-ink">SaaS Smart Automation Flow</h3>
                <p className="text-xs text-muted font-medium">Visual visual workflow builder to execute CRM and HR actions dynamically.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveWorkflow}
                className="rounded bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand/90 transition-colors"
              >
                Save Automation
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">Automation title</label>
              <input
                type="text"
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                className="app-input w-1/3 text-xs"
              />
            </div>

            {/* Visual workflow flow steps indicator */}
            <div className="border border-line rounded bg-soft p-6 flex flex-col md:flex-row items-center justify-center gap-6">
              {workflowNodes.map((n, i) => (
                <React.Fragment key={n.id}>
                  <div className="rounded border border-line bg-surface p-4 text-center min-w-[150px] shadow-sm relative group hover:border-brand transition-all">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      n.type === 'trigger' ? 'bg-brand/10 text-brand' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {n.type}
                    </span>
                    <p className="text-xs font-bold mt-2 text-ink">{n.label}</p>
                    <button
                      type="button"
                      onClick={() => setWorkflowNodes(workflowNodes.filter(node => node.id !== n.id))}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <FiTrash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {i < workflowNodes.length - 1 && (
                    <div className="text-muted font-bold text-lg rotate-90 md:rotate-0">
                      ➔
                    </div>
                  )}
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => {
                  const label = prompt('Enter Action Label (e.g. "Assign Sales Rep", "Create Calendar Event"):');
                  if (label) {
                    setWorkflowNodes([...workflowNodes, {
                      id: String(workflowNodes.length + 1),
                      type: 'action',
                      label
                    }]);
                  }
                }}
                className="rounded border border-dashed border-line bg-surface p-4 text-center min-w-[150px] hover:border-brand/40 transition-colors flex flex-col items-center justify-center cursor-pointer text-xs font-bold text-muted hover:text-ink"
              >
                <FiPlus className="h-5 w-5 mb-1 text-muted" /> Add step
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHub;

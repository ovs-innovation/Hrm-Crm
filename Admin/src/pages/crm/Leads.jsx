import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiTrash2, 
  FiCpu, 
  FiMail, 
  FiMessageSquare, 
  FiCopy, 
  FiCheckCircle, 
  FiX 
} from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import CsvImportButton from '../../components/CsvImportButton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', notes: '',
  });

  // AI Sidebar Assist Drawer State
  const [selectedLead, setSelectedLead] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [leadScoreData, setLeadScoreData] = useState(null);
  const [emailType, setEmailType] = useState('Cold email');
  const [emailTone, setEmailTone] = useState('Professional');
  const [generatedText, setGeneratedText] = useState('');
  const [whatsappQuery, setWhatsappQuery] = useState('Checking in on proposal interest');
  const [duplicates, setDuplicates] = useState([]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients?status=Lead');
      setLeads(res.data);
      
      const dupRes = await api.get('/ai/leads/duplicates');
      setDuplicates(dupRes.data.duplicates || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeLeads = async (primaryId, secondaryId) => {
    if (!window.confirm('Merge these two duplicate leads? This transfers all deals and logs to the primary lead and removes the duplicate.')) return;
    try {
      await api.post('/ai/leads/merge', { primaryId, secondaryId });
      toast.success('Leads merged successfully!');
      fetchLeads();
    } catch (err) {
      toast.error('Failed to merge leads');
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', { ...formData, status: 'Lead' });
      setIsModalOpen(false);
      setFormData({ name: '', company: '', email: '', phone: '', notes: '' });
      fetchLeads();
      toast.success('Lead created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchLeads();
      toast.success('Lead deleted');
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  const convertToAccount = async (lead) => {
    try {
      await api.put(`/clients/${lead._id}`, { status: 'Active' });
      fetchLeads();
      toast.success('Lead converted to active account');
    } catch (err) {
      toast.error('Conversion failed');
    }
  };

  // Fetch AI Lead Score
  const handleFetchLeadScore = async (lead) => {
    setSelectedLead(lead);
    setGeneratedText('');
    setLeadScoreData(null);
    setAiLoading(true);
    try {
      const res = await api.get(`/ai/lead-score/${lead._id}`);
      setLeadScoreData(res.data);
    } catch (error) {
      toast.error('Could not compute AI Lead Score');
    } finally {
      setAiLoading(false);
    }
  };

  // Generate Email using AI
  const handleGenerateEmail = async () => {
    if (!selectedLead) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/email-writer', {
        leadName: selectedLead.name,
        emailType: emailType,
        instructions: `Client works at ${selectedLead.company || 'their organization'}. Notes: ${selectedLead.notes || 'general lead follow-up'}`,
        tone: emailTone
      });
      setGeneratedText(res.data.email);
      toast.success('AI Email drafted!');
    } catch (err) {
      toast.error('Failed to draft AI email');
    } finally {
      setAiLoading(false);
    }
  };

  // Generate WhatsApp Reply using AI
  const handleGenerateWhatsApp = async () => {
    if (!selectedLead) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/whatsapp-reply', {
        customerMessage: whatsappQuery,
        history: [{ sender: 'admin', text: `Lead notes: ${selectedLead.notes || ''}` }],
        tone: 'Friendly'
      });
      setGeneratedText(res.data.reply);
      toast.success('AI WhatsApp reply drafted!');
    } catch (err) {
      toast.error('Failed to draft WhatsApp response');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success('Copied to clipboard!');
  };

  return (
    <PageShell
      title="Leads"
      description="Prospects not yet converted to accounts"
      count={leads.length}
      actions={
        <div className="flex gap-2">
          <CsvImportButton type="leads" label="Import" onDone={fetchLeads} />
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add lead
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* Table list */}
        <div className="space-y-4">
          {duplicates.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <FiCpu className="h-4 w-4" /> AI Duplicate Detection Alert
              </h4>
              <p className="text-xs text-muted">The AI has identified potential duplicate contacts in your CRM pipeline:</p>
              <div className="space-y-2">
                {duplicates.map((dup, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface border border-line p-3 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-white">{dup.leadA.name} ({dup.leadA.company}) & {dup.leadB.name} ({dup.leadB.company})</p>
                      <p className="text-[10px] text-muted font-medium">Conflict: {dup.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMergeLeads(dup.leadA._id, dup.leadB._id)}
                      className="rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/20 px-3 py-1 font-bold text-brand text-[11px] transition-all"
                    >
                      Merge Leads
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded border border-line bg-surface">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-soft text-muted">
                  <th className="px-4 py-2.5 font-medium">Lead name</th>
                  <th className="px-4 py-2.5 font-medium">Company</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No leads yet.</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                    <td className="px-4 py-3 font-medium text-ink flex items-center gap-1">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-ink">{lead.company}</td>
                    <td className="px-4 py-3 text-muted">{lead.email}</td>
                    <td className="px-4 py-3 text-muted">{lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => handleFetchLeadScore(lead)} 
                        title="AI Sales Co-Pilot Assist"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:text-brand-hover bg-brand/10 border border-brand/20 rounded px-2 py-0.5"
                      >
                        <FiCpu className="h-3 w-3" /> AI Assist
                      </button>
                      <button type="button" onClick={() => convertToAccount(lead)} className="text-[13px] font-semibold text-brand hover:underline">Convert</button>
                      <button type="button" onClick={() => handleDelete(lead._id)} className="rounded p-1 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Sidebar Assist Panel */}
        <div className="rounded border border-line bg-surface p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-ink">
              <FiCpu className="text-brand h-4 w-4" /> Lead Sales Co-Pilot
            </h3>
            {selectedLead && (
              <button onClick={() => setSelectedLead(null)} className="text-muted hover:text-ink">
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {!selectedLead ? (
            <div className="text-xs text-muted text-center py-10 font-medium">
              Click "AI Assist" next to a lead to analyze scoring, draft emails, or generate WhatsApp replies.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] text-muted uppercase font-bold">Selected Contact</p>
                <p className="font-bold text-ink text-sm">{selectedLead.name}</p>
                <p className="text-muted">{selectedLead.company}</p>
              </div>

              {/* Module 5: Smart Lead Scoring display */}
              <div className="border-t border-line/60 pt-3 space-y-2">
                <span className="text-[10px] font-bold text-brand uppercase">AI Lead scoring</span>
                {aiLoading && !leadScoreData ? (
                  <div className="animate-pulse h-8 bg-soft rounded-lg"></div>
                ) : leadScoreData ? (
                  <div className="rounded bg-soft border border-line p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                        leadScoreData.score === 'Hot' ? 'bg-rose-500/10 text-rose-500' :
                        leadScoreData.score === 'Warm' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {leadScoreData.score} Lead
                      </span>
                      <span className="font-bold text-ink">{leadScoreData.probability}% Conversion rate</span>
                    </div>
                    {leadScoreData.confidence !== undefined && (
                      <div className="flex justify-between items-center text-[10px] text-muted pt-1 border-t border-line/30">
                        <span>Prediction confidence:</span>
                        <span className={`px-1 rounded text-white font-bold ${
                          leadScoreData.confidence >= 85 ? 'bg-emerald-600' : leadScoreData.confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>{leadScoreData.confidence}%</span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted leading-relaxed font-medium">{leadScoreData.reason}</p>
                  </div>
                ) : (
                  <div className="text-muted">Analysis pending.</div>
                )}
              </div>

              {/* Module 6 & 7: Draft utilities */}
              <div className="border-t border-line/60 pt-3 space-y-3">
                <span className="text-[10px] font-bold text-brand uppercase">AI Communication Writer</span>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <select 
                    value={emailType} 
                    onChange={e => setEmailType(e.target.value)} 
                    className="bg-surface border border-line text-[11px] rounded p-1 text-ink focus:outline-none cursor-pointer"
                  >
                    <option>Cold email</option>
                    <option>Follow-up</option>
                    <option>Quotation email</option>
                    <option>Reminder</option>
                  </select>
                  <select 
                    value={emailTone} 
                    onChange={e => setEmailTone(e.target.value)} 
                    className="bg-surface border border-line text-[11px] rounded p-1 text-ink focus:outline-none cursor-pointer"
                  >
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Formal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={handleGenerateEmail}
                    disabled={aiLoading}
                    className="rounded bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand py-1 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <FiMail /> Draft Email
                  </button>
                  <button 
                    onClick={handleGenerateWhatsApp}
                    disabled={aiLoading}
                    className="rounded bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand py-1 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <FiMessageSquare /> WhatsApp Reply
                  </button>
                </div>
              </div>

              {generatedText && (
                <div className="border-t border-line/60 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted uppercase font-bold">Draft copy</span>
                    <button 
                      onClick={handleCopyText} 
                      className="text-brand hover:underline flex items-center gap-1 font-bold"
                    >
                      <FiCopy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={generatedText}
                    onChange={e => setGeneratedText(e.target.value)}
                    className="w-full bg-soft rounded-lg border border-line p-2 text-[11px] font-medium leading-relaxed focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">New lead</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Name</label><input required className="app-input h-9 text-[13px]" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Company</label><input required className="app-input h-9 text-[13px]" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="app-label mb-1 block text-[13px]">Email</label><input required type="email" className="app-input h-9 text-[13px]" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><label className="app-label mb-1 block text-[13px]">Phone</label><input className="app-input h-9 text-[13px]" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Leads;

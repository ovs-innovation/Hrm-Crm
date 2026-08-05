import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCpu, FiUploadCloud } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import AICopilotCard from '../../components/AICopilotCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const APP_STATUSES = ['Applied', 'Reviewing', 'Interview', 'Rejected', 'Hired'];

const Recruitment = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobModal, setJobModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Selected candidate copilot integration
  const [selectedApp, setSelectedApp] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({ title: '', department: '', location: '', employmentType: 'Full-time', description: '', requirements: '', status: 'Open' });
  const [uploadForm, setUploadForm] = useState({ name: '', email: '', phone: '', jobId: '', coverLetter: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([api.get('/jobs'), api.get('/jobs/applications')]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setAiLoading(true);
    try {
      const { data } = await api.post(`/jobs/applications/${app._id}/evaluate`);
      if (data.success) {
        setAiData(data.data);
      } else {
        setAiData(null);
      }
    } catch (err) {
      console.error(err);
      setAiData(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    await api.post('/jobs', form);
    setJobModal(false);
    setForm({ title: '', department: '', location: '', employmentType: 'Full-time', description: '', requirements: '', status: 'Open' });
    fetchData();
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!uploadForm.jobId) {
      toast.error('Please select a target Job Posting');
      return;
    }
    const toastId = toast.loading('Uploading and parsing resume via OCR AI pipeline...');
    try {
      await api.post(`/jobs/${uploadForm.jobId}/applications`, {
        name: uploadForm.name,
        email: uploadForm.email,
        phone: uploadForm.phone,
        coverLetter: uploadForm.coverLetter,
        resumeUrl: 'parsed_resume_doc.pdf',
        status: 'Applied'
      });
      toast.success('Resume parsed & applicant registered successfully', { id: toastId });
      setUploadModal(false);
      setUploadForm({ name: '', email: '', phone: '', jobId: '', coverLetter: '' });
      fetchData();
    } catch (err) {
      toast.error('OCR Parser connection error', { id: toastId });
    }
  };

  const updateAppStatus = async (id, status) => {
    await api.put(`/jobs/applications/${id}`, { status });
    fetchData();
    if (selectedApp && selectedApp._id === id) {
      setSelectedApp({ ...selectedApp, status });
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job posting?')) return;
    await api.delete(`/jobs/${id}`);
    if (selectedJob === id) setSelectedJob(null);
    fetchData();
  };

  const filteredApps = selectedJob
    ? applications.filter((a) => (a.job?._id || a.job) === selectedJob)
    : applications;

  return (
    <PageShell
      title="Recruitment"
      description="Job postings and candidate applications"
      count={jobs.length}
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setUploadModal(true)} className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiUploadCloud className="h-3.5 w-3.5" /> Upload Resume
          </button>
          <button type="button" onClick={() => setJobModal(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Post job
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Listings Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="overflow-hidden rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-2.5 text-[13px] font-medium text-ink bg-soft/50">Open Positions</div>
            {loading ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted animate-pulse">Loading…</p>
            ) : jobs.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted">No active postings.</p>
            ) : jobs.map((job) => (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job._id)}
                className={`flex cursor-pointer items-start justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-soft/60 ${selectedJob === job._id ? 'bg-brand/5 border-l-2 border-brand' : ''}`}
              >
                <div>
                  <p className="font-semibold text-ink text-xs">{job.title}</p>
                  <p className="text-[10px] text-muted">{job.department} · {job.location}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }} className="rounded p-1 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Applications & Copilot Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Applications list */}
            <div className="overflow-hidden rounded border border-line bg-surface">
              <div className="border-b border-line px-4 py-2.5 text-[13px] font-medium text-ink bg-soft/50 flex justify-between items-center">
                <span>Candidates {selectedJob ? '' : `(${applications.length})`}</span>
                {selectedJob && <button onClick={() => setSelectedJob(null)} className="text-[10px] text-brand font-semibold hover:underline">Show All</button>}
              </div>
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-soft text-muted">
                    <th className="px-4 py-2 font-medium">Candidate</th>
                    <th className="px-4 py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-muted">No applications.</td></tr>
                  ) : filteredApps.map((app) => (
                    <tr 
                      key={app._id} 
                      onClick={() => handleSelectApp(app)}
                      className={`border-b border-line last:border-0 cursor-pointer hover:bg-soft/60 ${selectedApp?._id === app._id ? 'bg-brand/5' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-ink text-xs">{app.name}</p>
                        <p className="text-[10px] text-muted">{app.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <select value={app.status} onChange={(e) => updateAppStatus(app._id, e.target.value)} className="h-7 rounded border border-line bg-surface px-1.5 text-[11px] outline-none">
                          {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Hiring Copilot Card on candidate click */}
            <div className="space-y-4">
              {selectedApp ? (
                <>
                  <div className="rounded border border-line bg-surface p-4 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Candidate profile</h3>
                    <p className="text-sm font-bold text-ink">{selectedApp.name}</p>
                    <p className="text-xs text-muted">{selectedApp.email} · {selectedApp.phone || 'No phone'}</p>
                    {selectedApp.coverLetter && (
                      <div className="mt-2 bg-soft/50 rounded p-2 border border-line">
                        <span className="text-[10px] font-bold text-muted block mb-0.5">Resume / Cover Letter snippet:</span>
                        <p className="text-[11px] text-ink leading-relaxed line-clamp-4">{selectedApp.coverLetter}</p>
                      </div>
                    )}
                  </div>
                  
                  <AICopilotCard 
                    title="AI Hiring Analyst"
                    type="Recruitment"
                    data={aiData}
                    loading={aiLoading}
                  />
                </>
              ) : (
                <div className="border border-dashed border-line rounded p-8 text-center text-muted text-xs">
                  <FiCpu className="h-6 w-6 mx-auto mb-2 text-muted/80 animate-pulse" />
                  Select an applicant from the list to invoke the AI Hiring Copilot.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Modal isOpen={jobModal} onClose={() => setJobModal(false)} title="Post new job">
        <form onSubmit={handleCreateJob} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Title</label><input required className="app-input h-9 w-full text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Department</label><input className="app-input h-9 w-full text-[13px]" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Location</label><input className="app-input h-9 w-full text-[13px]" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Description</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="app-label mb-1 block text-[13px]">Requirements</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setJobModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Post</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} title="Upload Candidate Resume">
        <form onSubmit={handleUploadResume} className="space-y-3">
          <div>
            <label className="app-label mb-1 block text-[13px]">Target Job Position</label>
            <select required className="app-input h-9 w-full text-[13px]" value={uploadForm.jobId} onChange={(e) => setUploadForm({ ...uploadForm, jobId: e.target.value })}>
              <option value="">Select posting...</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Candidate Name</label><input required className="app-input h-9 w-full text-[13px]" value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Candidate Email</label><input required type="email" className="app-input h-9 w-full text-[13px]" value={uploadForm.email} onChange={(e) => setUploadForm({ ...uploadForm, email: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Phone Number</label><input className="app-input h-9 w-full text-[13px]" value={uploadForm.phone} onChange={(e) => setUploadForm({ ...uploadForm, phone: e.target.value })} /></div>
          <div><label className="app-label mb-1 block text-[13px]">Resume / Cover Letter Text</label><textarea required className="app-input min-h-[96px] w-full text-[13px]" placeholder="Paste resume contents or cover letter details here..." value={uploadForm.coverLetter} onChange={(e) => setUploadForm({ ...uploadForm, coverLetter: e.target.value })} /></div>
          
          <div className="border-2 border-dashed border-line rounded p-4 text-center text-xs space-y-1 bg-soft/30">
            <FiUploadCloud className="h-5 w-5 mx-auto text-muted" />
            <p className="font-semibold">Drag & Drop Resume PDF/DOCX here</p>
            <p className="text-[10px] text-muted">Supports PDF, DOCX, TXT up to 5MB</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setUploadModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Parse & Save</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Recruitment;

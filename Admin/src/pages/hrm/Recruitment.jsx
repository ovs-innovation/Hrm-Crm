import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const APP_STATUSES = ['Applied', 'Reviewing', 'Interview', 'Rejected', 'Hired'];

const Recruitment = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobModal, setJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ title: '', department: '', location: '', employmentType: 'Full-time', description: '', requirements: '', status: 'Open' });

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

  const handleCreateJob = async (e) => {
    e.preventDefault();
    await api.post('/jobs', form);
    setJobModal(false);
    setForm({ title: '', department: '', location: '', employmentType: 'Full-time', description: '', requirements: '', status: 'Open' });
    fetchData();
  };

  const updateAppStatus = async (id, status) => {
    await api.put(`/jobs/applications/${id}`, { status });
    fetchData();
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job posting?')) return;
    await api.delete(`/jobs/${id}`);
    fetchData();
  };

  const filteredApps = selectedJob
    ? applications.filter((a) => (a.job?._id || a.job) === selectedJob)
    : applications;

  return (
    <PageShell
      title="Recruitment"
      description="Job postings and applications"
      count={jobs.length}
      actions={
        <button type="button" onClick={() => setJobModal(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Post job
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 text-[13px] font-medium text-ink">Open positions</div>
          {loading ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">No job postings.</p>
          ) : jobs.map((job) => (
            <div
              key={job._id}
              onClick={() => setSelectedJob(job._id)}
              className={`flex cursor-pointer items-start justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-soft/60 ${selectedJob === job._id ? 'bg-brand/5' : ''}`}
            >
              <div>
                <p className="font-medium text-ink">{job.title}</p>
                <p className="text-[12px] text-muted">{job.department} · {job.status}</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 text-[13px] font-medium text-ink">
            Applications {selectedJob ? '' : `(${applications.length})`}
          </div>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-muted">
                <th className="px-4 py-2 font-medium">Candidate</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-muted">No applications.</td></tr>
              ) : filteredApps.map((app) => (
                <tr key={app._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{app.name}</p>
                    <p className="text-[12px] text-muted">{app.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={app.status} onChange={(e) => updateAppStatus(app._id, e.target.value)} className="h-8 rounded border border-line bg-surface px-2 text-[13px]">
                      {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </PageShell>
  );
};

export default Recruitment;

import React, { useState, useEffect } from 'react';
import { FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/jobs?status=Open')
      .then((res) => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      await api.post(`/jobs/${selectedJob._id}/applications`, form);
      toast.success('Application submitted!');
      setSelectedJob(null);
      setForm({ name: '', email: '', phone: '', coverLetter: '' });
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Careers" description="Open positions at Vastora Tech" count={jobs.length}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-muted">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted">No open positions right now.</p>
          ) : jobs.map((job) => (
            <button
              key={job._id}
              type="button"
              onClick={() => setSelectedJob(job)}
              className={`w-full rounded border border-line bg-surface p-4 text-left transition hover:border-brand/40 ${selectedJob?._id === job._id ? 'border-brand ring-1 ring-brand/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <FiBriefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">{job.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{job.department} · {job.location || 'Remote'} · {job.employmentType}</p>
                  {job.salaryRange && <p className="mt-1 text-[12px] text-brand">{job.salaryRange}</p>}
                </div>
              </div>
              {job.description && <p className="mt-3 text-[13px] text-muted line-clamp-2">{job.description}</p>}
            </button>
          ))}
        </div>

        <div className="rounded border border-line bg-surface p-5">
          {selectedJob ? (
            <>
              <h3 className="text-base font-semibold text-ink">Apply · {selectedJob.title}</h3>
              {selectedJob.requirements && (
                <p className="mt-2 text-[13px] text-muted"><span className="font-medium text-ink">Requirements:</span> {selectedJob.requirements}</p>
              )}
              <form onSubmit={handleApply} className="mt-4 space-y-3">
                <div><label className="app-label mb-1 block text-[13px]">Full name</label><input required className="app-input h-9 w-full text-[13px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="app-label mb-1 block text-[13px]">Email</label><input type="email" required className="app-input h-9 w-full text-[13px]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label className="app-label mb-1 block text-[13px]">Phone</label><input className="app-input h-9 w-full text-[13px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><label className="app-label mb-1 block text-[13px]">Cover letter</label><textarea className="app-input min-h-[100px] w-full text-[13px]" value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} placeholder="Why are you a good fit?" /></div>
                <button type="submit" disabled={submitting} className="btn-primary h-9 px-4 text-[13px] disabled:opacity-60">
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </form>
            </>
          ) : (
            <p className="py-12 text-center text-[13px] text-muted">Select a job to view details and apply.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Careers;

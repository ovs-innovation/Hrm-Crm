import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../../components/PageShell';
import Modal from '../../../components/Modal';
import { orgService } from '../services/orgService';

const LEVELS = ['Junior', 'Mid', 'Senior', 'Manager', 'Director'];

const DesignationList = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', level: 'Mid', status: 'Active' });

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      setDesignations(await orgService.getDesignations());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDesignations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await orgService.createDesignation(form);
    setModalOpen(false);
    setForm({ title: '', department: '', level: 'Mid', status: 'Active' });
    fetchDesignations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this designation?')) return;
    await orgService.deleteDesignation(id);
    fetchDesignations();
  };

  return (
    <PageShell
      title="Designations"
      description="Manage job titles, roles, and hierarchy levels"
      count={designations.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add designation
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Department</th>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : designations.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No designations found.</td></tr>
            ) : designations.map((desig) => (
              <tr key={desig.id || desig._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{desig.title}</td>
                <td className="px-4 py-3 text-muted">{desig.department || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{desig.level}</span></td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{desig.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(desig.id || desig._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add designation">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Title</label><input required className="app-input h-9 w-full text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Department</label><input className="app-input h-9 w-full text-[13px]" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Level</label><select className="app-input h-9 w-full text-[13px]" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default DesignationList;

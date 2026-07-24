import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../../components/PageShell';
import Modal from '../../../components/Modal';
import { orgService } from '../services/orgService';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', head: '', description: '', status: 'Active' });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      setDepartments(await orgService.getDepartments());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await orgService.createDepartment(form);
    setModalOpen(false);
    setForm({ name: '', head: '', description: '', status: 'Active' });
    fetchDepartments();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    await orgService.deleteDepartment(id);
    fetchDepartments();
  };

  return (
    <PageShell
      title="Departments"
      description="Manage company departments and structural hierarchy"
      count={departments.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Add department
        </button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Department</th>
              <th className="px-4 py-2.5 font-medium">Head</th>
              <th className="px-4 py-2.5 font-medium">Employees</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No departments found.</td></tr>
            ) : departments.map((dept) => (
              <tr key={dept.id || dept._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{dept.name}</td>
                <td className="px-4 py-3 text-muted">{dept.head || '—'}</td>
                <td className="px-4 py-3 text-muted">{dept.employeeCount ?? 0}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{dept.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(dept.id || dept._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add department">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Name</label><input required className="app-input h-9 w-full text-[13px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="app-label mb-1 block text-[13px]">Department head</label><input className="app-input h-9 w-full text-[13px]" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} /></div>
          <div><label className="app-label mb-1 block text-[13px]">Description</label><textarea className="app-input min-h-[72px] w-full text-[13px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Save</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default DepartmentList;

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
import api from '../services/api';

const BADGES = ['Star Performer', 'Team Player', 'Innovation', 'Leadership', 'Customer Hero'];

const ManageAppreciation = () => {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fromEmployeeId: '', toEmployeeId: '', message: '', badge: 'Star Performer' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [appRes, empRes] = await Promise.all([api.get('/appreciations'), api.get('/employees')]);
      setItems(appRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const from = employees.find((emp) => emp.employeeId === form.fromEmployeeId);
    const to = employees.find((emp) => emp.employeeId === form.toEmployeeId);
    if (!to) return;
    try {
      await api.post('/appreciations', {
        fromEmployeeId: from?.employeeId || '',
        fromEmployeeName: from?.name || 'HR',
        toEmployeeId: to.employeeId,
        toEmployeeName: to.name,
        message: form.message,
        badge: form.badge,
      });
      toast.success('Appreciation published');
      setModalOpen(false);
      setForm({ fromEmployeeId: '', toEmployeeId: '', message: '', badge: 'Star Performer' });
      fetchItems();
    } catch {
      toast.error('Failed to publish');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this appreciation?')) return;
    await api.delete(`/appreciations/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Appreciation"
      description="Recognize team members for outstanding work"
      count={items.length}
      actions={
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
          <FiPlus className="h-3.5 w-3.5" /> Give appreciation
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full py-10 text-center text-[13px] text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="col-span-full py-10 text-center text-[13px] text-muted">No appreciations yet.</p>
        ) : items.map((a) => (
          <div key={a._id} className="rounded border border-line bg-surface p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                <FiAward className="h-3 w-3" /> {a.badge}
              </span>
              <button type="button" onClick={() => handleDelete(a._id)} className="rounded p-1 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="text-[13px] font-semibold text-ink">{a.toEmployeeName}</p>
            <p className="mt-1 text-[12px] text-muted">From {a.fromEmployeeName || 'HR'}</p>
            <p className="mt-2 text-[13px] text-ink">{a.message}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">Give appreciation</div>
            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div><label className="app-label mb-1 block text-[13px]">To employee</label><select required className="app-input h-9 w-full text-[13px]" value={form.toEmployeeId} onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value })}><option value="">Select…</option>{employees.map((emp) => <option key={emp._id} value={emp.employeeId}>{emp.name}</option>)}</select></div>
              <div><label className="app-label mb-1 block text-[13px]">From (optional)</label><select className="app-input h-9 w-full text-[13px]" value={form.fromEmployeeId} onChange={(e) => setForm({ ...form, fromEmployeeId: e.target.value })}><option value="">HR</option>{employees.map((emp) => <option key={emp._id} value={emp.employeeId}>{emp.name}</option>)}</select></div>
              <div><label className="app-label mb-1 block text-[13px]">Badge</label><select className="app-input h-9 w-full text-[13px]" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>{BADGES.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className="app-label mb-1 block text-[13px]">Message</label><textarea required className="app-input min-h-[80px] w-full text-[13px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default ManageAppreciation;

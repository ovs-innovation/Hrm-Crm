import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const SHIFTS = ['Morning', 'Evening', 'Night', 'General'];

const ShiftRoster = () => {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ employeeId: '', date: '', shiftType: 'General', startTime: '09:00', endTime: '18:00', notes: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [shiftsRes, empRes] = await Promise.all([
        api.get(`/shifts?month=${month}`),
        api.get('/employees'),
      ]);
      setItems(shiftsRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === form.employeeId || e._id === form.employeeId);
    await api.post('/shifts', {
      ...form,
      employeeId: emp?.employeeId || form.employeeId,
      employeeName: emp?.name || 'Employee',
    });
    setModalOpen(false);
    setForm({ employeeId: '', date: '', shiftType: 'General', startTime: '09:00', endTime: '18:00', notes: '' });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this shift?')) return;
    await api.delete(`/shifts/${id}`);
    fetchItems();
  };

  return (
    <PageShell
      title="Shift roster"
      description="Assign and view employee shift schedules"
      count={items.length}
      actions={
        <>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="app-input h-8 text-[13px]" />
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Assign shift
          </button>
        </>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Shift</th>
              <th className="px-4 py-2.5 font-medium">Time</th>
              <th className="px-4 py-2.5 font-medium">Notes</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No shifts for this month.</td></tr>
            ) : items.map((s) => (
              <tr key={s._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{s.employeeName}</td>
                <td className="px-4 py-3 text-muted">{s.date}</td>
                <td className="px-4 py-3"><span className="rounded bg-soft px-2 py-0.5 text-xs">{s.shiftType}</span></td>
                <td className="px-4 py-3 text-muted">{s.startTime} – {s.endTime}</td>
                <td className="px-4 py-3 text-muted">{s.notes || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => handleDelete(s._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign shift">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Employee</label><select required className="app-input h-9 w-full text-[13px]" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Select…</option>{employees.map((emp) => <option key={emp._id} value={emp.employeeId}>{emp.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Date</label><input type="date" required className="app-input h-9 w-full text-[13px]" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Shift type</label><select className="app-input h-9 w-full text-[13px]" value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value })}>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Start</label><input type="time" className="app-input h-9 w-full text-[13px]" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">End</label><input type="time" className="app-input h-9 w-full text-[13px]" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
          </div>
          <div><label className="app-label mb-1 block text-[13px]">Notes</label><input className="app-input h-9 w-full text-[13px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Assign</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default ShiftRoster;

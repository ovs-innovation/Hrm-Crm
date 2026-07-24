import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import Modal from '../../components/Modal';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Payroll = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modalOpen, setModalOpen] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', basicSalary: '50000', allowances: '5000', deductions: '2000' });
  const [genForm, setGenForm] = useState({ basicSalary: '50000', allowances: '5000', deductions: '2000' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        api.get(`/payslips?month=${month}`),
        api.get('/employees'),
      ]);
      setPayslips(payRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === form.employeeId);
    if (!emp) return;
    const basic = Number(form.basicSalary) || 0;
    const allow = Number(form.allowances) || 0;
    const deduct = Number(form.deductions) || 0;
    await api.post('/payslips', {
      employeeId: emp.employeeId,
      employeeName: emp.name,
      month,
      basicSalary: basic,
      allowances: allow,
      deductions: deduct,
      netPay: basic + allow - deduct,
      status: 'Draft',
    });
    toast.success('Payslip created');
    setModalOpen(false);
    fetchData();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const res = await api.post('/payslips/generate', {
      month,
      basicSalary: Number(genForm.basicSalary) || 0,
      allowances: Number(genForm.allowances) || 0,
      deductions: Number(genForm.deductions) || 0,
    });
    toast.success(`Generated ${res.data.count} payslips`);
    setGenModal(false);
    fetchData();
  };

  const markPaid = async (id) => {
    await api.put(`/payslips/${id}`, { status: 'Paid', paidDate: new Date() });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payslip?')) return;
    await api.delete(`/payslips/${id}`);
    fetchData();
  };

  const totalNet = payslips.reduce((s, p) => s + (p.netPay || 0), 0);
  const draftCount = payslips.filter((p) => p.status === 'Draft').length;

  return (
    <PageShell
      title="Payroll"
      description="Generate and manage employee payslips"
      count={payslips.length}
      actions={
        <>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="app-input h-8 text-[13px]" />
          <button type="button" onClick={() => setGenModal(true)} className="btn-outline h-8 px-3 text-[13px]">Generate all</button>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
            <FiPlus className="h-3.5 w-3.5" /> Add payslip
          </button>
        </>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Total payout</p><p className="text-xl font-semibold text-ink">{formatINR(totalNet)}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Draft</p><p className="text-xl font-semibold text-ink">{draftCount}</p></div>
        <div className="rounded border border-line bg-surface p-3"><p className="text-[13px] text-muted">Paid</p><p className="text-xl font-semibold text-ink">{payslips.length - draftCount}</p></div>
      </div>

      <div className="overflow-hidden rounded border border-line bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-soft text-muted">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Month</th>
              <th className="px-4 py-2.5 font-medium text-right">Basic</th>
              <th className="px-4 py-2.5 font-medium text-right">Net pay</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            ) : payslips.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No payslips for this month. Generate or add one.</td></tr>
            ) : payslips.map((p) => (
              <tr key={p._id} className="border-b border-line last:border-0 hover:bg-soft/60">
                <td className="px-4 py-3 font-medium text-ink">{p.employeeName}</td>
                <td className="px-4 py-3 text-muted">{p.month}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.basicSalary)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatINR(p.netPay)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${p.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/hrm/payroll/invoice/${p._id}`} className="rounded p-1.5 text-muted hover:text-brand" title="View"><FiExternalLink className="h-3.5 w-3.5" /></Link>
                    {p.status === 'Draft' && (
                      <button type="button" onClick={() => markPaid(p._id)} className="rounded px-2 py-1 text-xs text-brand hover:bg-brand/10">Mark paid</button>
                    )}
                    <button type="button" onClick={() => handleDelete(p._id)} className="rounded p-1.5 text-muted hover:text-danger"><FiTrash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add payslip">
        <form onSubmit={handleCreate} className="space-y-3">
          <div><label className="app-label mb-1 block text-[13px]">Employee</label><select required className="app-input h-9 w-full text-[13px]" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Select…</option>{employees.map((emp) => <option key={emp._id} value={emp.employeeId}>{emp.name}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Basic (₹)</label><input type="number" className="app-input h-9 w-full text-[13px]" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Allowances</label><input type="number" className="app-input h-9 w-full text-[13px]" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Deductions</label><input type="number" className="app-input h-9 w-full text-[13px]" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Generate payslips for all employees">
        <form onSubmit={handleGenerate} className="space-y-3">
          <p className="text-[13px] text-muted">Creates draft payslips for {month} for every employee without an existing slip.</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="app-label mb-1 block text-[13px]">Basic (₹)</label><input type="number" className="app-input h-9 w-full text-[13px]" value={genForm.basicSalary} onChange={(e) => setGenForm({ ...genForm, basicSalary: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Allowances</label><input type="number" className="app-input h-9 w-full text-[13px]" value={genForm.allowances} onChange={(e) => setGenForm({ ...genForm, allowances: e.target.value })} /></div>
            <div><label className="app-label mb-1 block text-[13px]">Deductions</label><input type="number" className="app-input h-9 w-full text-[13px]" value={genForm.deductions} onChange={(e) => setGenForm({ ...genForm, deductions: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setGenModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary h-9 px-3 text-[13px]">Generate</button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Payroll;

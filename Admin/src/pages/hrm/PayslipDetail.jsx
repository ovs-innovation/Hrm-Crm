import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PayslipDetail = () => {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payslips/${id}`)
      .then((res) => setPayslip(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <PageShell title="Payslip"><p className="text-[13px] text-muted">Loading…</p></PageShell>;
  }

  if (!payslip) {
    return (
      <PageShell title="Payslip not found">
        <Link to="/hrm/payroll" className="btn-outline inline-flex items-center gap-1 px-3 py-2 text-[13px]"><FiArrowLeft /> Back to payroll</Link>
      </PageShell>
    );
  }

  const breakdown = payslip.breakdown || {};

  return (
    <PageShell
      title="Payslip"
      description={`${payslip.employeeName} · ${payslip.month}`}
      actions={
        <Link to="/hrm/payroll" className="btn-outline inline-flex h-8 items-center gap-1 px-3 text-[13px]"><FiArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
      }
    >
      <div className="mx-auto max-w-lg rounded border border-line bg-surface p-6">
        <div className="mb-6 border-b border-line pb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Vastora Tech</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Salary Slip</h2>
          <p className="text-[13px] text-muted">{payslip.month}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-[13px]">
          <div><span className="text-muted">Employee</span><p className="font-medium text-ink">{payslip.employeeName}</p></div>
          <div><span className="text-muted">Employee ID</span><p className="font-medium text-ink">{payslip.employeeId}</p></div>
          <div><span className="text-muted">Status</span><p className="font-medium text-ink">{payslip.status}</p></div>
          <div><span className="text-muted">Paid date</span><p className="font-medium text-ink">{payslip.paidDate ? new Date(payslip.paidDate).toLocaleDateString('en-IN') : '—'}</p></div>
        </div>

        <table className="mb-4 w-full text-[13px]">
          <tbody>
            <tr className="border-b border-line"><td className="py-2 text-muted">Basic salary</td><td className="py-2 text-right tabular-nums">{formatINR(payslip.basicSalary)}</td></tr>
            <tr className="border-b border-line"><td className="py-2 text-muted">Allowances</td><td className="py-2 text-right tabular-nums text-green-700">+ {formatINR(payslip.allowances)}</td></tr>
            {breakdown.hra > 0 && <tr className="border-b border-line"><td className="py-2 pl-4 text-muted">HRA</td><td className="py-2 text-right tabular-nums">{formatINR(breakdown.hra)}</td></tr>}
            <tr className="border-b border-line"><td className="py-2 text-muted">Deductions</td><td className="py-2 text-right tabular-nums text-red-600">− {formatINR(payslip.deductions)}</td></tr>
            <tr><td className="py-3 font-semibold text-ink">Net pay</td><td className="py-3 text-right text-lg font-bold tabular-nums text-brand">{formatINR(payslip.netPay)}</td></tr>
          </tbody>
        </table>

        <p className="text-center text-[11px] text-muted">This is a system-generated payslip.</p>
      </div>
    </PageShell>
  );
};

export default PayslipDetail;
